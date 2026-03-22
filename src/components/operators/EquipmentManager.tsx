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
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "sonner";
import {
  Plus, Wrench, ShieldCheck, ShieldAlert, Camera, FileText, Loader2,
  Copy, Trash2, ChevronDown, ChevronUp, Edit2, X, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Reference Data ──────────────────────────────────────────────

const BRANDS = [
  "John Deere", "Case IH", "New Holland", "CLAAS", "AGCO", "Fendt",
  "Massey Ferguson", "Kubota", "JCB", "Caterpillar", "Hagie", "Apache",
  "Bourgault", "Kinze", "Great Plains", "Unverferth", "Brent", "Demco",
  "Wilson", "Peterbilt", "Kenworth", "Freightliner", "International",
  "Challenger", "Lexion", "MacDon", "Geringhoff", "Other",
];

const EQUIPMENT_TYPES = [
  { value: "tractor", label: "Tractor" },
  { value: "combine", label: "Combine" },
  { value: "sprayer", label: "Sprayer" },
  { value: "planter", label: "Planter" },
  { value: "drill", label: "Drill" },
  { value: "grain_cart", label: "Grain Cart" },
  { value: "semi", label: "Semi / Truck" },
  { value: "hopper_trailer", label: "Hopper Trailer" },
  { value: "tender_truck", label: "Tender Truck" },
  { value: "fertilizer_applicator", label: "Fertilizer Applicator" },
  { value: "tillage", label: "Tillage Equipment" },
  { value: "rock_picker", label: "Rock Picker" },
  { value: "hay_equipment", label: "Hay Equipment" },
  { value: "loader", label: "Loader / Skid Loader" },
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

// ── Default form state ──────────────────────────────────────────

const EMPTY_FORM = {
  type: "tractor", make: "", model: "", year: "", unitName: "", serialNumber: "",
  capacity: "", widthFt: "", gpsEquipped: false, variableRate: false, seeAndSpray: false,
  isoCompatible: false, rowCount: "", rowSpacing: "", boomWidthFt: "", tankSizeGal: "",
  hopperCapacityBu: "", haulingCapacityTons: "", notes: "",
};

type EqForm = typeof EMPTY_FORM;

// ── Helpers ─────────────────────────────────────────────────────

function getCategoryLabel(type: string) {
  return EQUIPMENT_TYPES.find(c => c.value === type)?.label || type;
}

// ── Main Component ──────────────────────────────────────────────

interface EquipmentManagerProps {
  operatorProfileId: string;
  readOnly?: boolean;
}

export function EquipmentManager({ operatorProfileId, readOnly = false }: EquipmentManagerProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState<EqForm>({ ...EMPTY_FORM });
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  // ── Mutations ───────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async ({ form, id }: { form: EqForm; id?: string }) => {
      const payload = {
        operator_id: operatorProfileId,
        type: form.type,
        make: form.make,
        model: form.model,
        year: form.year ? parseInt(form.year) : null,
        unit_name: form.unitName || null,
        serial_number: form.serialNumber || null,
        capacity: form.capacity || null,
        width_ft: form.widthFt ? parseFloat(form.widthFt) : null,
        gps_equipped: form.gpsEquipped,
        iso_compatible: form.isoCompatible,
        variable_rate: form.variableRate,
        see_and_spray: form.seeAndSpray,
        row_count: form.rowCount ? parseInt(form.rowCount) : null,
        row_spacing: form.rowSpacing ? parseFloat(form.rowSpacing) : null,
        boom_width_ft: form.boomWidthFt ? parseFloat(form.boomWidthFt) : null,
        tank_size_gal: form.tankSizeGal ? parseFloat(form.tankSizeGal) : null,
        hopper_capacity_bu: form.hopperCapacityBu ? parseInt(form.hopperCapacityBu) : null,
        hauling_capacity_tons: form.haulingCapacityTons ? parseFloat(form.haulingCapacityTons) : null,
        notes: form.notes || null,
      };
      if (id) {
        const { error } = await supabase.from("equipment").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("equipment").insert({ ...payload, verification_status: "draft" });
        if (error) throw error;
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["equipment", operatorProfileId] });
      toast.success(id ? "Equipment updated" : "Equipment added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("equipment").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", operatorProfileId] });
      toast.success("Equipment removed");
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
      await supabase.from("equipment").update({ verification_status: "pending_review" }).eq("id", equipmentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment", operatorProfileId] });
      queryClient.invalidateQueries({ queryKey: ["equipment-documents", operatorProfileId] });
      toast.success("Proof uploaded — pending review");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Handlers ────────────────────────────────────────────────

  function openNewForm() {
    setEditingId(null);
    setFormState({ ...EMPTY_FORM });
    setShowForm(true);
  }

  function openEditForm(eq: any) {
    setEditingId(eq.id);
    setFormState({
      type: eq.type || "other",
      make: eq.make || "",
      model: eq.model || "",
      year: eq.year ? String(eq.year) : "",
      unitName: eq.unit_name || "",
      serialNumber: eq.serial_number || "",
      capacity: eq.capacity || "",
      widthFt: eq.width_ft ? String(eq.width_ft) : "",
      gpsEquipped: !!eq.gps_equipped,
      isoCompatible: !!eq.iso_compatible,
      variableRate: !!eq.variable_rate,
      seeAndSpray: !!eq.see_and_spray,
      rowCount: eq.row_count ? String(eq.row_count) : "",
      rowSpacing: eq.row_spacing ? String(eq.row_spacing) : "",
      boomWidthFt: eq.boom_width_ft ? String(eq.boom_width_ft) : "",
      tankSizeGal: eq.tank_size_gal ? String(eq.tank_size_gal) : "",
      hopperCapacityBu: eq.hopper_capacity_bu ? String(eq.hopper_capacity_bu) : "",
      haulingCapacityTons: eq.hauling_capacity_tons ? String(eq.hauling_capacity_tons) : "",
      notes: eq.notes || "",
    });
    setShowForm(true);
  }

  function duplicateEquipment(eq: any) {
    openEditForm(eq);
    setEditingId(null); // Treat as new
    setFormState(f => ({ ...f, unitName: "", serialNumber: "" }));
  }

  function handleSave() {
    saveMutation.mutate({ form: formState, id: editingId || undefined }, {
      onSuccess: () => {
        // Keep form open for "Add Another"
        if (!editingId) {
          setFormState({ ...EMPTY_FORM, type: formState.type, make: formState.make });
        } else {
          setShowForm(false);
          setEditingId(null);
        }
      },
    });
  }

  function handleSaveAndClose() {
    saveMutation.mutate({ form: formState, id: editingId || undefined }, {
      onSuccess: () => {
        setShowForm(false);
        setEditingId(null);
      },
    });
  }

  const getDocCount = (eqId: string) => documents.filter((d: any) => d.equipment_id === eqId).length;

  // ── Loading ─────────────────────────────────────────────────

  if (isLoading) {
    return <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}</div>;
  }

  // ── Render ──────────────────────────────────────────────────

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Wrench size={14} /> Equipment Fleet
          {equipment.length > 0 && (
            <span className="text-[10px] font-normal text-muted-foreground ml-1">
              {equipment.length} item{equipment.length !== 1 ? "s" : ""}
            </span>
          )}
        </h3>
        {!readOnly && !showForm && (
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={openNewForm}>
            <Plus size={12} className="mr-1" /> Add Equipment
          </Button>
        )}
      </div>

      {/* ── Fleet List ──────────────────────────────────────── */}
      {equipment.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {equipment.map((eq: any) => {
            const vs = VERIFICATION_LABELS[eq.verification_status] || VERIFICATION_LABELS.draft;
            const docCount = getDocCount(eq.id);
            const isExpanded = expandedId === eq.id;

            return (
              <div key={eq.id} className={cn(
                "rounded-lg border transition-all",
                eq.verification_status === "verified" ? "border-success/20" :
                eq.verification_status === "rejected" ? "border-destructive/30" : "border-border",
              )}>
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 p-2.5 text-left hover:bg-accent/50 transition-colors rounded-lg"
                  onClick={() => setExpandedId(isExpanded ? null : eq.id)}
                >
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                    <Wrench size={13} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate flex items-center gap-1.5">
                      {eq.year ? `${eq.year} ` : ""}{eq.make} {eq.model}
                      {eq.verification_status === "verified" && <ShieldCheck size={11} className="text-success shrink-0" />}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {getCategoryLabel(eq.type)}
                      {eq.unit_name ? ` · ${eq.unit_name}` : ""}
                      {eq.width_ft ? ` · ${eq.width_ft}ft` : ""}
                      {eq.boom_width_ft ? ` · ${eq.boom_width_ft}ft boom` : ""}
                    </p>
                  </div>
                  <span className={cn("text-[9px] font-medium shrink-0", vs.color)}>{vs.label}</span>
                  {isExpanded ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t space-y-2">
                    {/* Capability tags */}
                    <div className="flex flex-wrap gap-1 pt-2">
                      {eq.gps_equipped && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">GPS</span>}
                      {eq.iso_compatible && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">ISOBUS</span>}
                      {eq.variable_rate && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">Variable Rate</span>}
                      {eq.see_and_spray && <span className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5">See & Spray</span>}
                      {eq.tank_size_gal && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.tank_size_gal} gal</span>}
                      {eq.hopper_capacity_bu && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.hopper_capacity_bu} bu</span>}
                      {eq.hauling_capacity_tons && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.hauling_capacity_tons}T</span>}
                      {eq.row_count && <span className="text-[9px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">{eq.row_count} rows</span>}
                    </div>

                    {eq.serial_number && (
                      <p className="text-[10px] text-muted-foreground">S/N: {eq.serial_number}</p>
                    )}
                    {eq.notes && (
                      <p className="text-[10px] text-muted-foreground">{eq.notes}</p>
                    )}

                    {/* Proof + actions */}
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <FileText size={9} /> {docCount} proof file{docCount !== 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-1">
                        {!readOnly && eq.verification_status !== "verified" && (
                          <label className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-0.5">
                            <Camera size={9} /> Upload proof
                            <input type="file" className="hidden" accept="image/*,.pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadProof.mutate({ equipmentId: eq.id, file });
                                e.target.value = "";
                              }}
                            />
                          </label>
                        )}
                        {!readOnly && (
                          <>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); openEditForm(eq); }}>
                              <Edit2 size={10} />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); duplicateEquipment(eq); }}>
                              <Copy size={10} />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(eq.id); }}>
                              <Trash2 size={10} />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {equipment.length === 0 && !showForm && (
        <EmptyState
          icon={<Wrench size={20} />}
          title="No equipment on file"
          description={readOnly ? "This operator hasn't added equipment yet." : "Add your equipment to improve job matching and get verified."}
        />
      )}

      {/* ── Add / Edit Form ─────────────────────────────────── */}
      {showForm && !readOnly && (
        <div className="rounded-lg border-2 border-primary/20 bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {editingId ? "Edit Equipment" : "Add Equipment"}
            </p>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
              onClick={() => { setShowForm(false); setEditingId(null); }}>
              <X size={14} />
            </Button>
          </div>

          <EquipmentForm
            form={formState}
            onChange={setFormState}
          />

          <div className="flex gap-2 pt-1">
            {!editingId && (
              <Button size="sm" className="flex-1 text-xs gap-1" onClick={handleSave}
                disabled={saveMutation.isPending || !formState.make || !formState.model}>
                {saveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Save & Add Another
              </Button>
            )}
            <Button size="sm" variant={editingId ? "default" : "outline"} className="flex-1 text-xs gap-1"
              onClick={handleSaveAndClose}
              disabled={saveMutation.isPending || !formState.make || !formState.model}>
              {saveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {editingId ? "Save Changes" : "Save & Close"}
            </Button>
          </div>
        </div>
      )}

      {/* Add button below fleet */}
      {!showForm && !readOnly && equipment.length > 0 && (
        <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-2 gap-1" onClick={openNewForm}>
          <Plus size={12} /> Add Another Equipment
        </Button>
      )}
    </div>
  );
}

// ── Equipment Form ────────────────────────────────────────────────

function EquipmentForm({ form, onChange }: { form: EqForm; onChange: (f: EqForm) => void }) {
  const set = (key: keyof EqForm, val: any) => onChange({ ...form, [key]: val });

  const isSprayType = form.type === "sprayer" || form.type === "fertilizer_applicator";
  const isPlanter = form.type === "planter" || form.type === "drill";
  const isHauling = form.type === "semi" || form.type === "hopper_trailer" || form.type === "tender_truck" || form.type === "grain_cart";
  const isCombine = form.type === "combine";
  const isTractor = form.type === "tractor";

  return (
    <div className="space-y-4">
      {/* Row 1: Type */}
      <div className="space-y-1.5">
        <Label className="text-xs">Equipment Type <span className="text-destructive">*</span></Label>
        <Select value={form.type} onValueChange={v => set("type", v)}>
          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {EQUIPMENT_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Brand + Model */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Brand <span className="text-destructive">*</span></Label>
          <Select value={BRANDS.includes(form.make) ? form.make : "__other"} onValueChange={v => {
            if (v === "__other") set("make", "");
            else set("make", v);
          }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select brand" /></SelectTrigger>
            <SelectContent>
              {BRANDS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              <SelectItem value="__other">Other (type below)</SelectItem>
            </SelectContent>
          </Select>
          {!BRANDS.includes(form.make) && (
            <Input className="h-8 text-xs mt-1" value={form.make} onChange={e => set("make", e.target.value)}
              placeholder="Enter brand name" />
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Model <span className="text-destructive">*</span></Label>
          <Input className="h-9 text-sm" value={form.model} onChange={e => set("model", e.target.value)}
            placeholder="e.g. 4940, S790, 2100" />
        </div>
      </div>

      {/* Row 3: Year + Unit Name + Serial */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Year</Label>
          <Input className="h-9 text-sm" type="number" value={form.year} onChange={e => set("year", e.target.value)} placeholder="2024" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Unit Name</Label>
          <Input className="h-9 text-sm" value={form.unitName} onChange={e => set("unitName", e.target.value)} placeholder="e.g. SP-1" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Serial / VIN</Label>
          <Input className="h-9 text-sm" value={form.serialNumber} onChange={e => set("serialNumber", e.target.value)} />
        </div>
      </div>

      {/* ── Type-specific fields ────────────────────────────── */}

      {isTractor && (
        <TypeSection title="Tractor Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Horsepower</Label>
              <Input className="h-8 text-xs" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. 380" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Width (ft)</Label>
              <Input className="h-8 text-xs" type="number" value={form.widthFt} onChange={e => set("widthFt", e.target.value)} />
            </div>
          </div>
          <CheckRow form={form} set={set} fields={["gpsEquipped", "isoCompatible"]}
            labels={["GPS / Autosteer Ready", "ISOBUS Compatible"]} />
        </TypeSection>
      )}

      {isCombine && (
        <TypeSection title="Combine Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Header Width (ft)</Label>
              <Input className="h-8 text-xs" type="number" value={form.widthFt} onChange={e => set("widthFt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Grain Tank (bu)</Label>
              <Input className="h-8 text-xs" type="number" value={form.hopperCapacityBu} onChange={e => set("hopperCapacityBu", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Capacity / Class</Label>
            <Input className="h-8 text-xs" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. Class 9" />
          </div>
          <CheckRow form={form} set={set} fields={["gpsEquipped", "variableRate"]}
            labels={["Yield Monitor / GPS", "Variable Rate"]} />
        </TypeSection>
      )}

      {isSprayType && (
        <TypeSection title="Sprayer / Applicator Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Boom Width (ft)</Label>
              <Input className="h-8 text-xs" type="number" value={form.boomWidthFt} onChange={e => set("boomWidthFt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tank Size (gal)</Label>
              <Input className="h-8 text-xs" type="number" value={form.tankSizeGal} onChange={e => set("tankSizeGal", e.target.value)} />
            </div>
          </div>
          <CheckRow form={form} set={set}
            fields={["gpsEquipped", "variableRate", "seeAndSpray", "isoCompatible"]}
            labels={["GPS / Autosteer", "Variable Rate", "See & Spray", "Section Control / ISO"]} />
        </TypeSection>
      )}

      {isPlanter && (
        <TypeSection title="Planter / Drill Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Row Count</Label>
              <Input className="h-8 text-xs" type="number" value={form.rowCount} onChange={e => set("rowCount", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Row Spacing (in)</Label>
              <Input className="h-8 text-xs" type="number" value={form.rowSpacing} onChange={e => set("rowSpacing", e.target.value)} />
            </div>
          </div>
          <CheckRow form={form} set={set} fields={["gpsEquipped", "variableRate", "isoCompatible"]}
            labels={["GPS / Autosteer", "Variable Rate", "Liquid Fert / ISO"]} />
        </TypeSection>
      )}

      {isHauling && (
        <TypeSection title="Hauling / Cart Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Hopper / Cart (bu)</Label>
              <Input className="h-8 text-xs" type="number" value={form.hopperCapacityBu} onChange={e => set("hopperCapacityBu", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hauling Capacity (tons)</Label>
              <Input className="h-8 text-xs" type="number" value={form.haulingCapacityTons} onChange={e => set("haulingCapacityTons", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Trailer / Truck Type</Label>
            <Input className="h-8 text-xs" value={form.capacity} onChange={e => set("capacity", e.target.value)} placeholder="e.g. Hopper bottom, End dump, Live floor" />
          </div>
        </TypeSection>
      )}

      {/* Catch-all for types without specific fields */}
      {!isTractor && !isCombine && !isSprayType && !isPlanter && !isHauling && (
        <TypeSection title="Details">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Width (ft)</Label>
              <Input className="h-8 text-xs" type="number" value={form.widthFt} onChange={e => set("widthFt", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Capacity</Label>
              <Input className="h-8 text-xs" value={form.capacity} onChange={e => set("capacity", e.target.value)} />
            </div>
          </div>
          <CheckRow form={form} set={set} fields={["gpsEquipped"]} labels={["GPS Equipped"]} />
        </TypeSection>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notes</Label>
        <Textarea className="text-xs min-h-[48px]" value={form.notes} onChange={e => set("notes", e.target.value)}
          rows={2} placeholder="Attachments, modifications, specialty capabilities…" />
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function TypeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t pt-3 space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
      {children}
    </div>
  );
}

function CheckRow({ form, set, fields, labels }: {
  form: EqForm; set: (k: keyof EqForm, v: any) => void;
  fields: (keyof EqForm)[]; labels: string[];
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {fields.map((field, i) => (
        <label key={field} className="flex items-center gap-1.5 text-xs cursor-pointer">
          <Checkbox checked={!!form[field]} onCheckedChange={v => set(field, !!v)} />
          {labels[i]}
        </label>
      ))}
    </div>
  );
}

// ── Admin Verification Actions ──────────────────────────────────

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
