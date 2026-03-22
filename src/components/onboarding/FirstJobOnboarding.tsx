import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFarms } from "@/hooks/useFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractModeSelector, ContractMode } from "@/components/jobs/ContractModeSelector";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Check, Loader2, Building2, Map, Briefcase, Wheat } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "farm", label: "Add Farm", icon: Building2 },
  { id: "field", label: "Add Field", icon: Map },
  { id: "job", label: "Create Job", icon: Briefcase },
  { id: "review", label: "Post", icon: Check },
];

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

export function FirstJobOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existingFarms = [] } = useFarms();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    farmName: "", farmCounty: "", farmState: "",
    fieldName: "", fieldAcreage: "", fieldCrop: "corn" as string,
    opType: "spraying", contractMode: "fixed_price" as ContractMode,
    rate: "", deadline: "", title: "",
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handlePost = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Get or create org
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("user_id", user.id).single();
      let orgId = profile?.organization_id;
      if (!orgId) {
        const { data: org, error: orgErr } = await supabase.from("organizations").insert({ name: form.farmName, type: "farm" }).select("id").single();
        if (orgErr) throw orgErr;
        orgId = org.id;
        await supabase.from("profiles").update({ organization_id: orgId }).eq("user_id", user.id);
      }

      // Create farm
      const { data: farm, error: farmErr } = await supabase.from("farms").insert({
        name: form.farmName, organization_id: orgId!, owner_id: user.id,
        county: form.farmCounty || null, state: form.farmState || null,
      }).select("id").single();
      if (farmErr) throw farmErr;

      // Create field
      const { data: field, error: fieldErr } = await supabase.from("fields").insert({
        name: form.fieldName, farm_id: farm.id, acreage: parseFloat(form.fieldAcreage) || 0,
        crop: form.fieldCrop as any,
      }).select("id").single();
      if (fieldErr) throw fieldErr;

      // Create job
      const acres = parseFloat(form.fieldAcreage) || 0;
      const rate = parseFloat(form.rate) || 0;
      const deadlineDate = form.deadline ? new Date(form.deadline).toISOString() : new Date(Date.now() + 14 * 86400000).toISOString();

      const { data: job, error: jobErr } = await supabase.from("jobs").insert({
        title: form.title || `${form.fieldName} — ${form.opType}`,
        farm_id: farm.id,
        requested_by: user.id,
        operation_type: form.opType as any,
        pricing_model: "per_acre" as any,
        base_rate: rate,
        total_acres: acres,
        estimated_total: rate * acres,
        deadline: deadlineDate,
        status: "requested" as any,
        contract_mode: form.contractMode,
      }).select("id").single();
      if (jobErr) throw jobErr;

      // Link field to job
      await supabase.from("job_fields").insert({
        job_id: job.id, field_id: field.id, acreage: acres, crop: form.fieldCrop as any,
      });

      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Your first job is live!");
      navigate(`/jobs/${job.id}`);
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
    setSaving(false);
  };

  const canNext = () => {
    if (step === 0) return form.farmName.trim().length > 0;
    if (step === 1) return form.fieldName.trim().length > 0 && form.fieldAcreage.trim().length > 0;
    if (step === 2) return form.opType && form.contractMode;
    return true;
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold">Post your first job</h2>
        <p className="text-sm text-muted-foreground mt-1">Set up a farm, add a field, and get work posted in under 2 minutes.</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1 mb-6">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className={cn(
              "h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0 transition-colors",
              i < step ? "bg-primary text-primary-foreground" :
              i === step ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2" :
              "bg-muted text-muted-foreground"
            )}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn("h-0.5 flex-1 mx-1.5 rounded", i < step ? "bg-primary" : "bg-border")} />}
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-card border p-5">
        <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
          {(() => { const Icon = STEPS[step].icon; return <Icon size={14} />; })()}
          {STEPS[step].label}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {step === 0 && "Name your farm or operation."}
          {step === 1 && "Add your first field."}
          {step === 2 && "What work needs to be done?"}
          {step === 3 && "Review and post your job."}
        </p>

        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Farm name</Label><Input value={form.farmName} onChange={e => set("farmName", e.target.value)} placeholder="e.g. Westfield Farms" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>County</Label><Input value={form.farmCounty} onChange={e => set("farmCounty", e.target.value)} placeholder="e.g. Lancaster" /></div>
              <div className="space-y-1.5"><Label>State</Label><Input value={form.farmState} onChange={e => set("farmState", e.target.value)} placeholder="e.g. NE" /></div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Field name</Label><Input value={form.fieldName} onChange={e => set("fieldName", e.target.value)} placeholder="e.g. North Quarter" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Acreage</Label><Input type="number" value={form.fieldAcreage} onChange={e => set("fieldAcreage", e.target.value)} placeholder="160" /></div>
              <div className="space-y-1.5">
                <Label>Crop</Label>
                <Select value={form.fieldCrop} onValueChange={v => set("fieldCrop", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corn">Corn</SelectItem>
                    <SelectItem value="soybeans">Soybeans</SelectItem>
                    <SelectItem value="wheat">Wheat</SelectItem>
                    <SelectItem value="alfalfa">Alfalfa</SelectItem>
                    <SelectItem value="hay">Hay</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Operation type</Label>
              <Select value={form.opType} onValueChange={v => set("opType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{OP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <ContractModeSelector value={form.contractMode} onChange={v => setForm(f => ({ ...f, contractMode: v }))} />
            {form.contractMode === "fixed_price" && (
              <div className="space-y-1.5">
                <Label>Rate per acre</Label>
                <Input type="number" value={form.rate} onChange={e => set("rate", e.target.value)} placeholder="0.00" />
                {form.rate && form.fieldAcreage && (
                  <p className="text-xs text-muted-foreground">Est. total: <span className="font-medium text-foreground">${(parseFloat(form.rate) * parseFloat(form.fieldAcreage)).toFixed(2)}</span></p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3 text-sm">
            <div className="space-y-1.5"><Label>Job title (auto-generated, editable)</Label><Input value={form.title || `${form.fieldName} — ${OP_TYPES.find(t => t.value === form.opType)?.label || form.opType}`} onChange={e => set("title", e.target.value)} /></div>
            <div className="rounded-lg bg-surface-2 p-3 space-y-1.5 text-[13px]">
              <Row label="Farm" value={form.farmName} />
              <Row label="Field" value={`${form.fieldName} · ${form.fieldAcreage} ac`} />
              <Row label="Operation" value={OP_TYPES.find(t => t.value === form.opType)?.label || form.opType} />
              <Row label="Hiring mode" value={form.contractMode === "fixed_price" ? "Fixed Price" : form.contractMode === "open_bidding" ? "Open Bidding" : "Invite Only"} />
              {form.rate && <Row label="Rate" value={`$${form.rate}/ac`} />}
              {form.deadline && <Row label="Deadline" value={form.deadline} />}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0} size="sm">
            <ChevronLeft size={14} className="mr-0.5" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} size="sm">
              Next <ChevronRight size={14} className="ml-0.5" />
            </Button>
          ) : (
            <Button onClick={handlePost} disabled={saving} size="sm">
              {saving && <Loader2 size={14} className="animate-spin mr-1" />}
              Post Job
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-[11px] text-muted-foreground mt-3">
        <button onClick={() => navigate("/dashboard")} className="hover:underline">Skip for now</button>
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
