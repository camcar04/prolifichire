import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFields, useFarms } from "@/hooks/useFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ContractModeSelector, ContractMode } from "@/components/jobs/ContractModeSelector";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatAcres, formatCropType } from "@/lib/format";
import { OperationSpecFields, validateOperationSpec, type OperationSpec } from "@/components/jobs/OperationSpecFields";
import { trackFirstTimeEvent } from "@/lib/analytics";

const OP_TYPES = [
  { value: "spraying", label: "Spraying / Application" },
  { value: "planting", label: "Planting" },
  { value: "harvest", label: "Harvest" },
  { value: "fertilizing", label: "Fertilizer Application" },
  { value: "tillage", label: "Tillage" },
  { value: "rock_picking", label: "Rock Picking" },
  { value: "mowing", label: "Mowing" },
  { value: "baling", label: "Baling" },
  { value: "grain_hauling", label: "Grain Hauling" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a field when opening from field context */
  preselectedFieldId?: string;
}

export function CreateJobDialog({ open, onOpenChange, preselectedFieldId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fields = [] } = useFields();
  const { data: farms = [] } = useFarms();

  const [form, setForm] = useState({
    fieldIds: preselectedFieldId ? [preselectedFieldId] : [] as string[],
    opType: "spraying",
    contractMode: "open_bidding" as ContractMode,
    rate: "",
    deadline: "",
    title: "",
    notes: "",
  });
  const [spec, setSpec] = useState<OperationSpec>({});
  const [saving, setSaving] = useState(false);

  // Reset when opened
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setForm({
        fieldIds: preselectedFieldId ? [preselectedFieldId] : [],
        opType: "spraying",
        contractMode: "open_bidding",
        rate: "",
        deadline: "",
        title: "",
        notes: "",
      });
      setSpec({});
    }
    onOpenChange(v);
  };

  const selectedFields = fields.filter(f => form.fieldIds.includes(f.id));
  const totalAcres = selectedFields.reduce((a, f) => a + Number(f.acreage || 0), 0);
  const rate = parseFloat(form.rate) || 0;
  const estimatedTotal = rate * totalAcres;

  // Derive farm from first selected field
  const farmId = selectedFields[0]?.farm_id || "";
  const farm = farms.find(f => f.id === farmId);

  const canPost = form.fieldIds.length > 0 && form.opType;

  const handlePost = async () => {
    if (!user || !canPost) return;
    // Validate operation-specific required fields before posting
    const missing = validateOperationSpec(form.opType, spec);
    if (missing.length > 0) {
      toast.error(`Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`);
      return;
    }
    setSaving(true);
    try {
      const deadlineDate = form.deadline
        ? new Date(form.deadline).toISOString()
        : new Date(Date.now() + 14 * 86400000).toISOString();

      const firstField = selectedFields[0];
      const autoTitle = form.title || `${firstField?.name || "Field"} — ${OP_TYPES.find(t => t.value === form.opType)?.label || form.opType}`;

      const { data: job, error: jobErr } = await supabase.from("jobs").insert({
        title: autoTitle,
        farm_id: farmId || null,
        requested_by: user.id,
        operation_type: form.opType as any,
        pricing_model: form.contractMode === "fixed_price" ? "per_acre" as any : "per_acre" as any,
        base_rate: rate || 0,
        total_acres: totalAcres,
        estimated_total: estimatedTotal || 0,
        deadline: deadlineDate,
        status: "requested" as any,
        contract_mode: form.contractMode,
        notes: form.notes || null,
      }).select("id").single();
      if (jobErr) throw jobErr;

      // Link fields to job
      const jobFields = selectedFields.map((f, i) => ({
        job_id: job.id,
        field_id: f.id,
        acreage: Number(f.acreage || 0),
        crop: f.crop as any,
        sequence: i + 1,
      }));
      const { error: jfErr } = await supabase.from("job_fields").insert(jobFields);
      if (jfErr) console.warn("job_fields insert error:", jfErr);

      // Persist operation spec (JSONB) for relevant op types
      if (["spraying", "fertilizing", "planting", "harvest"].includes(form.opType)) {
        const { error: specErr } = await supabase.from("operation_specs").insert({
          job_id: job.id,
          operation_type: form.opType as any,
          spec_data: spec as any,
        });
        if (specErr) console.warn("operation_specs insert error:", specErr);
      }

      // For application jobs, also create a job_inputs row so operators see the product clearly
      if ((form.opType === "spraying" || form.opType === "fertilizing") && spec.product_name) {
        const { error: inErr } = await supabase.from("job_inputs").insert({
          job_id: job.id,
          product_name: spec.product_name,
          product_type: spec.product_type || "other",
          supplied_by: "grower",
          unit: spec.rate_unit || null,
          quantity: spec.target_rate ? Number(spec.target_rate) * totalAcres : null,
        });
        if (inErr) console.warn("job_inputs insert error:", inErr);
      }

      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      // First job milestone (no-op if already fired)
      void trackFirstTimeEvent(user.id, "first_job_posted", {
        job_id: job.id,
        operation_type: form.opType,
        total_acres: totalAcres,
      });
      toast.success("Job posted! Operators can now see it.");
      onOpenChange(false);
      navigate(`/jobs/${job.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to post job");
    }
    setSaving(false);
  };

  const toggleField = (fieldId: string) => {
    setForm(f => ({
      ...f,
      fieldIds: f.fieldIds.includes(fieldId)
        ? f.fieldIds.filter(id => id !== fieldId)
        : [...f.fieldIds, fieldId],
    }));
  };

  // Group fields by farm for easy selection
  const fieldsByFarm = farms.map(farm => ({
    farm,
    fields: fields.filter(f => f.farm_id === farm.id),
  })).filter(g => g.fields.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Job</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Step 1: Select fields */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select fields</Label>
            <div className="max-h-48 overflow-y-auto rounded border divide-y">
              {fieldsByFarm.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground text-center">
                  No fields yet. Add fields from the Field Library first.
                </p>
              ) : fieldsByFarm.map(({ farm, fields: farmFields }) => (
                <div key={farm.id}>
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    {farm.name}
                  </p>
                  {farmFields.map(field => {
                    const selected = form.fieldIds.includes(field.id);
                    return (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => toggleField(field.id)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                          selected ? "bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <div>
                          <span className="font-medium">{field.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatAcres(Number(field.acreage))} · {formatCropType(field.crop)}
                          </span>
                        </div>
                        <div className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                          selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                        }`}>
                          {selected && "✓"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
            {selectedFields.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedFields.length} field{selectedFields.length > 1 ? "s" : ""} · {formatAcres(totalAcres)} total
              </p>
            )}
          </div>

          {/* Step 2: Operation type */}
          <div className="space-y-1.5">
            <Label>Operation type</Label>
            <Select value={form.opType} onValueChange={v => setForm(f => ({ ...f, opType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Operation-specific spec fields (conditional) */}
          <OperationSpecFields opType={form.opType} value={spec} onChange={setSpec} />

          {/* Step 3: Contract mode */}
          <ContractModeSelector
            value={form.contractMode}
            onChange={v => setForm(f => ({ ...f, contractMode: v }))}
          />

          {/* Conditional: rate for fixed price */}
          {form.contractMode === "fixed_price" && (
            <div className="space-y-1.5">
              <Label>Rate per acre ($)</Label>
              <Input
                type="number"
                value={form.rate}
                onChange={e => setForm(f => ({ ...f, rate: e.target.value }))}
                placeholder="0.00"
              />
              {rate > 0 && totalAcres > 0 && (
                <p className="text-xs text-muted-foreground">
                  Estimated total: <span className="font-semibold text-foreground">${estimatedTotal.toFixed(2)}</span>
                </p>
              )}
            </div>
          )}

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>Deadline</Label>
            <Input
              type="date"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
            />
          </div>

          {/* Optional title override */}
          <div className="space-y-1.5">
            <Label>Job title <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder={selectedFields[0] ? `${selectedFields[0].name} — ${OP_TYPES.find(t => t.value === form.opType)?.label || form.opType}` : "Auto-generated"}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes for operators <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any special instructions, requirements, or context…"
              rows={2}
            />
          </div>

          {/* Post */}
          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handlePost} disabled={!canPost || saving}>
              {saving && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Post Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
