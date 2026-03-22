import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { Plus, Wrench, ShieldCheck, ShieldAlert, Camera, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const EQUIPMENT_CATEGORIES = [
  { value: "sprayer", label: "Sprayer" },
  { value: "planter", label: "Planter" },
  { value: "combine", label: "Combine" },
  { value: "semi", label: "Semi / Truck" },
  { value: "hopper_trailer", label: "Hopper Trailer" },
  { value: "fertilizer_applicator", label: "Fertilizer Applicator" },
  { value: "tillage", label: "Tillage Equipment" },
  { value: "rock_picker", label: "Rock Picker" },
  { value: "other", label: "Other" },
];

const VERIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Not Submitted", color: "text-muted-foreground" },
  proof_uploaded: { label: "Proof Uploaded", color: "text-info" },
  pending_review: { label: "Pending Review", color: "text-warning" },
  verified: { label: "Verified", color: "text-success" },
  rejected: { label: "Rejected", color: "text-destructive" },
  outdated: { label: "Outdated", color: "text-muted-foreground" },
};

interface EquipmentManagerProps {
  operatorProfileId: string;
  readOnly?: boolean;
}

export function EquipmentManager({ operatorProfileId, readOnly = false }: EquipmentManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment", operatorProfileId],
    queryFn: async () => {
      const { data } = await supabase
        .from("equipment")
        .select("*")
        .eq("operator_id", operatorProfileId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!operatorProfileId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["equipment-documents", operatorProfileId],
    queryFn: async () => {
      const equipIds = equipment.map((e: any) => e.id);
      if (equipIds.length === 0) return [];
      const { data } = await supabase
        .from("equipment_documents")
        .select("*")
        .in("equipment_id", equipIds);
      return data || [];
    },
    enabled: equipment.length > 0,
  });

  const addMutation = useMutation({
    mutationFn: async (eq: any) => {
      const { error } = await supabase.from("equipment").insert({
        operator_id: operatorProfileId,
        type: eq.type,
        make: eq.make,
        model: eq.model,
        year: eq.year ? parseInt(eq.year) : null,
        unit_name: eq.unitName || null,
        serial_number: eq.serialNumber || null,
        capacity: eq.capacity || null,
        width_ft: eq.widthFt ? parseFloat(eq.widthFt) : null,
        gps_equipped: eq.gpsEquipped,
        variable_rate: eq.variableRate,
        see_and_spray: eq.seeAndSpray,
        row_count: eq.rowCount ? parseInt(eq.rowCount) : null,
        row_spacing: eq.rowSpacing ? parseFloat(eq.rowSpacing) : null,
        boom_width_ft: eq.boomWidthFt ? parseFloat(eq.boomWidthFt) : null,
        tank_size_gal: eq.tankSizeGal ? parseFloat(eq.tankSizeGal) : null,
        hopper_capacity_bu: eq.hopperCapacityBu ? parseInt(eq.hopperCapacityBu) : null,
        hauling_capacity_tons: eq.haulingCapacityTons ? parseFloat(eq.haulingCapacityTons) : null,
        notes: eq.notes || null,
        verification_status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", operatorProfileId] });
      toast.success("Equipment added");
      setAddOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const uploadProof = useMutation({
    mutationFn: async ({ equipmentId, file }: { equipmentId: string; file: File }) => {
      const path = `equipment/${operatorProfileId}/${equipmentId}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("credentials").upload(path, file);
      if (uploadErr) throw uploadErr;

      const { error: docErr } = await supabase.from("equipment_documents").insert({
        equipment_id: equipmentId,
        file_name: file.name,
        file_path: path,
        file_type: file.type.startsWith("image/") ? "photo" : "document",
        file_size: file.size,
        uploaded_by: user!.id,
      });
      if (docErr) throw docErr;

      await supabase.from("equipment").update({
        verification_status: "pending_review",
      }).eq("id", equipmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", operatorProfileId] });
      queryClient.invalidateQueries({ queryKey: ["equipment-documents", operatorProfileId] });
      toast.success("Proof uploaded — pending review");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getCategoryLabel = (type: string) =>
    EQUIPMENT_CATEGORIES.find(c => c.value === type)?.label || type;

  const getDocCount = (eqId: string) =>
    documents.filter((d: any) => d.equipment_id === eqId).length;

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Wrench size={14} /> Equipment & Verification</h3>
        {!readOnly && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs"><Plus size={12} className="mr-1" /> Add</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
              <AddEquipmentForm onSubmit={(eq) => addMutation.mutate(eq)} saving={addMutation.isPending} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {equipment.length === 0 ? (
        <EmptyState
          icon={<Wrench size={20} />}
          title="No equipment on file"
          description={readOnly ? "This operator hasn't added equipment yet." : "Add your equipment to improve job matching and get verified."}
        />
      ) : (
        <div className="space-y-2">
          {equipment.map((eq: any) => {
            const vs = VERIFICATION_LABELS[eq.verification_status] || VERIFICATION_LABELS.draft;
            const docCount = getDocCount(eq.id);
            return (
              <div key={eq.id} className={cn(
                "rounded-lg border p-3 transition-colors",
                eq.verification_status === "verified" ? "border-success/20 bg-success/5" :
                eq.verification_status === "rejected" ? "border-destructive/30 bg-destructive/5" :
                "bg-card"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {eq.year ? `${eq.year} ` : ""}{eq.make} {eq.model}
                      </p>
                      {eq.verification_status === "verified" && <ShieldCheck size={12} className="text-success shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getCategoryLabel(eq.type)}
                      {eq.unit_name ? ` · ${eq.unit_name}` : ""}
                      {eq.width_ft ? ` · ${eq.width_ft}ft` : ""}
                      {eq.gps_equipped ? " · GPS" : ""}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium shrink-0", vs.color)}>{vs.label}</span>
                </div>

                {/* Capability tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {eq.variable_rate && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">Variable Rate</span>}
                  {eq.see_and_spray && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">See & Spray</span>}
                  {eq.boom_width_ft && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.boom_width_ft}ft boom</span>}
                  {eq.tank_size_gal && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.tank_size_gal} gal tank</span>}
                  {eq.hopper_capacity_bu && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.hopper_capacity_bu} bu</span>}
                  {eq.hauling_capacity_tons && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.hauling_capacity_tons}T</span>}
                  {eq.row_count && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.row_count} rows</span>}
                </div>

                {/* Proof section */}
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                    <FileText size={9} /> {docCount} proof file{docCount !== 1 ? "s" : ""}
                  </span>
                  {!readOnly && eq.verification_status !== "verified" && (
                    <label className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-0.5">
                      <Camera size={9} />
                      {uploadProof.isPending ? "Uploading…" : "Upload proof"}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadProof.mutate({ equipmentId: eq.id, file });
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddEquipmentForm({ onSubmit, saving }: { onSubmit: (eq: any) => void; saving: boolean }) {
  const [form, setForm] = useState({
    type: "sprayer", make: "", model: "", year: "", unitName: "", serialNumber: "",
    capacity: "", widthFt: "", gpsEquipped: false, variableRate: false, seeAndSpray: false,
    rowCount: "", rowSpacing: "", boomWidthFt: "", tankSizeGal: "",
    hopperCapacityBu: "", haulingCapacityTons: "", notes: "",
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));
  const isSprayType = form.type === "sprayer" || form.type === "fertilizer_applicator";
  const isPlanter = form.type === "planter";
  const isHauling = form.type === "semi" || form.type === "hopper_trailer";
  const isCombine = form.type === "combine";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Equipment category <span className="text-destructive">*</span></Label>
        <Select value={form.type} onValueChange={v => set("type", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EQUIPMENT_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Make <span className="text-destructive">*</span></Label>
          <Input value={form.make} onChange={e => set("make", e.target.value)} placeholder="e.g. John Deere" />
        </div>
        <div className="space-y-1.5">
          <Label>Model <span className="text-destructive">*</span></Label>
          <Input value={form.model} onChange={e => set("model", e.target.value)} placeholder="e.g. 4940" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Input type="number" value={form.year} onChange={e => set("year", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit name</Label>
          <Input value={form.unitName} onChange={e => set("unitName", e.target.value)} placeholder="e.g. Sprayer 1" />
        </div>
        <div className="space-y-1.5">
          <Label>Serial / VIN</Label>
          <Input value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} />
        </div>
      </div>

      {/* Conditional capability fields */}
      {isSprayType && (
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Sprayer Capabilities</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Boom width (ft)</Label>
              <Input type="number" value={form.boomWidthFt} onChange={e => set("boomWidthFt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tank size (gal)</Label>
              <Input type="number" value={form.tankSizeGal} onChange={e => set("tankSizeGal", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.variableRate} onCheckedChange={v => set("variableRate", !!v)} />
              Variable rate capable
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.seeAndSpray} onCheckedChange={v => set("seeAndSpray", !!v)} />
              See & Spray capable
            </label>
          </div>
        </div>
      )}

      {isPlanter && (
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Planter Capabilities</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Row count</Label>
              <Input type="number" value={form.rowCount} onChange={e => set("rowCount", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Row spacing (in)</Label>
              <Input type="number" value={form.rowSpacing} onChange={e => set("rowSpacing", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.variableRate} onCheckedChange={v => set("variableRate", !!v)} />
            Variable rate capable
          </label>
        </div>
      )}

      {isHauling && (
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Hauling Specs</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hopper capacity (bu)</Label>
              <Input type="number" value={form.hopperCapacityBu} onChange={e => set("hopperCapacityBu", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hauling capacity (tons)</Label>
              <Input type="number" value={form.haulingCapacityTons} onChange={e => set("haulingCapacityTons", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {isCombine && (
        <div className="border-t pt-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Combine Specs</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Header width (ft)</Label>
              <Input type="number" value={form.widthFt} onChange={e => set("widthFt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hopper capacity (bu)</Label>
              <Input type="number" value={form.hopperCapacityBu} onChange={e => set("hopperCapacityBu", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      <div className="border-t pt-3 space-y-3">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.gpsEquipped} onCheckedChange={v => set("gpsEquipped", !!v)} />
          GPS equipped
        </label>
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Additional details, attachments, specialty capabilities…" />
        </div>
      </div>

      <Button className="w-full" onClick={() => onSubmit(form)} disabled={saving || !form.make || !form.model}>
        {saving ? <><Loader2 size={14} className="animate-spin mr-1" /> Adding…</> : "Add Equipment"}
      </Button>
    </div>
  );
}

// Admin verification actions for equipment
export function AdminEquipmentActions({ equipmentId, currentStatus }: { equipmentId: string; currentStatus: string }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const updates: any = { verification_status: status };
      if (status === "verified") updates.verified_at = new Date().toISOString();
      const { error } = await supabase.from("equipment").update(updates).eq("id", equipmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment verification updated");
    },
  });

  return (
    <div className="flex items-center gap-1">
      {currentStatus !== "verified" && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] text-success border-success/30"
          onClick={() => updateStatus.mutate({ status: "verified" })}>
          Verify
        </Button>
      )}
      {currentStatus !== "rejected" && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive/30"
          onClick={() => updateStatus.mutate({ status: "rejected" })}>
          Reject
        </Button>
      )}
    </div>
  );
}
