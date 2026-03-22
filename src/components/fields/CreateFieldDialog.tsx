import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFarms } from "@/hooks/useFields";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StateSelect } from "@/components/ui/state-select";
import { Textarea } from "@/components/ui/textarea";
import { FieldDrawMap, getBbox, getCentroid } from "@/components/map/FieldDrawMap";
import { MapPin, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CROP_OPTIONS = [
  { value: "corn", label: "Corn" },
  { value: "soybeans", label: "Soybeans" },
  { value: "wheat", label: "Wheat" },
  { value: "alfalfa", label: "Alfalfa" },
  { value: "hay", label: "Hay" },
  { value: "sorghum", label: "Sorghum" },
  { value: "cotton", label: "Cotton" },
  { value: "rice", label: "Rice" },
  { value: "oats", label: "Oats" },
  { value: "canola", label: "Canola" },
  { value: "sunflower", label: "Sunflower" },
  { value: "other", label: "Other" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedFarmId?: string;
}

export function CreateFieldDialog({ open, onOpenChange, preselectedFarmId }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: farms = [] } = useFarms();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    name: "",
    farmId: preselectedFarmId || "",
    acreage: "",
    crop: "corn",
    cropYear: String(new Date().getFullYear()),
    county: "",
    state: "",
    legalDescription: "",
    cluNumber: "",
    fsaFarmNumber: "",
  });

  const [boundary, setBoundary] = useState<GeoJSON.Polygon | null>(null);
  const [calculatedAcres, setCalculatedAcres] = useState(0);

  const handleBoundaryChange = (geojson: GeoJSON.Polygon | null, acres: number) => {
    setBoundary(geojson);
    setCalculatedAcres(acres);
    if (acres > 0) {
      setForm(f => ({ ...f, acreage: acres.toFixed(1) }));
    }
  };

  const step1Valid = form.name.trim() && form.farmId;
  const step2Valid = boundary !== null;
  const step3Valid = form.acreage && form.county.trim() && form.state;

  const mutation = useMutation({
    mutationFn: async () => {
      const baseData: Record<string, any> = {
        name: form.name,
        farm_id: form.farmId,
        acreage: Number(form.acreage) || 0,
        crop: form.crop,
        crop_year: Number(form.cropYear),
        county: form.county || null,
        state: form.state || null,
        legal_description: form.legalDescription || null,
        clu_number: form.cluNumber || null,
        fsa_farm_number: form.fsaFarmNumber || null,
      };

      if (boundary) {
        const ring = boundary.coordinates[0];
        const cent = getCentroid(ring);
        const bbox = getBbox(ring);
        baseData.boundary_geojson = boundary;
        baseData.centroid_lat = cent.lat;
        baseData.centroid_lng = cent.lng;
        baseData.bbox_north = bbox.north;
        baseData.bbox_south = bbox.south;
        baseData.bbox_east = bbox.east;
        baseData.bbox_west = bbox.west;
      }

      const { error } = await supabase.from("fields").insert(baseData as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      toast.success("Field added to library");
      resetForm();
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => {
    setForm({ name: "", farmId: preselectedFarmId || "", acreage: "", crop: "corn", cropYear: String(new Date().getFullYear()), county: "", state: "", legalDescription: "", cluNumber: "", fsaFarmNumber: "" });
    setBoundary(null);
    setCalculatedAcres(0);
    setStep(1);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Progress header */}
        <div className="px-5 pt-5 pb-3 border-b">
          <DialogHeader>
            <DialogTitle className="text-base">Add Field to Library</DialogTitle>
            <DialogDescription className="text-xs">
              {step === 1 && "Name your field and assign it to a farm"}
              {step === 2 && "Draw the field boundary on the satellite map"}
              {step === 3 && "Confirm details and save"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-1 mt-3">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )} />
            ))}
          </div>
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span className={step === 1 ? "text-foreground font-medium" : ""}>1. Identity</span>
            <span className={step === 2 ? "text-foreground font-medium" : ""}>2. Boundary</span>
            <span className={step === 3 ? "text-foreground font-medium" : ""}>3. Details</span>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Step 1: Name + Farm */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Farm <span className="text-destructive">*</span></Label>
                <Select value={form.farmId} onValueChange={v => setForm(f => ({ ...f, farmId: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    {farms.map(farm => (
                      <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Field Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. North Quarter, Section 12 West" className="h-9 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Crop</Label>
                  <Select value={form.crop} onValueChange={v => setForm(f => ({ ...f, crop: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CROP_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Crop Year</Label>
                  <Input type="number" value={form.cropYear} onChange={e => setForm(f => ({ ...f, cropYear: e.target.value }))} className="h-9 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Draw boundary */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <MapPin size={13} className="text-primary shrink-0" />
                <span>Click on the map to place boundary points. Place at least 3 points, then click "Close Shape" to complete.</span>
              </div>
              <FieldDrawMap
                onBoundaryChange={handleBoundaryChange}
                initialGeojson={boundary}
                className="!aspect-[16/9] min-h-[350px]"
              />
              {boundary && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-primary" />
                  <span className="font-medium">{calculatedAcres.toFixed(1)} acres</span>
                  <span className="text-muted-foreground">boundary drawn</span>
                </div>
              )}
              {!boundary && (
                <p className="text-[11px] text-muted-foreground">You can skip this step and add a boundary later, but jobs require field location data.</p>
              )}
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Acreage <span className="text-destructive">*</span>
                    {calculatedAcres > 0 && <span className="text-primary ml-1 font-normal">(from map)</span>}
                  </Label>
                  <Input type="number" value={form.acreage} onChange={e => setForm(f => ({ ...f, acreage: e.target.value }))}
                    placeholder="160" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">County <span className="text-destructive">*</span></Label>
                  <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                    placeholder="e.g. Lancaster" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">State <span className="text-destructive">*</span></Label>
                  <StateSelect value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))} />
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">Field</span><span className="font-medium">{form.name || "—"}</span>
                  <span className="text-muted-foreground">Farm</span><span className="font-medium">{farms.find(f => f.id === form.farmId)?.name || "—"}</span>
                  <span className="text-muted-foreground">Acreage</span><span className="font-medium tabular-nums">{form.acreage || "—"} ac</span>
                  <span className="text-muted-foreground">Boundary</span>
                  <span className={cn("font-medium", boundary ? "text-primary" : "text-warning")}>
                    {boundary ? "✓ Drawn" : "Not set"}
                  </span>
                  <span className="text-muted-foreground">Crop</span><span className="font-medium">{CROP_OPTIONS.find(c => c.value === form.crop)?.label}</span>
                </div>
              </div>

              <details className="group">
                <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Additional identifiers ›
                </summary>
                <div className="mt-2 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Legal Description</Label>
                    <Textarea value={form.legalDescription} onChange={e => setForm(f => ({ ...f, legalDescription: e.target.value }))}
                      placeholder="SE¼ of Section 12, T15N, R8E" rows={2} className="text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">CLU Number</Label>
                      <Input value={form.cluNumber} onChange={e => setForm(f => ({ ...f, cluNumber: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">FSA Farm Number</Label>
                      <Input value={form.fsaFarmNumber} onChange={e => setForm(f => ({ ...f, fsaFarmNumber: e.target.value }))} className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
          <div>
            {step > 1 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="h-8 text-xs gap-1">
                <ChevronLeft size={12} /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { resetForm(); onOpenChange(false); }} className="h-8 text-xs">Cancel</Button>
            {step < 3 ? (
              <Button size="sm" onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                disabled={step === 1 ? !step1Valid : false}
                className="h-8 text-xs gap-1">
                {step === 2 && !boundary ? "Skip Boundary" : "Next"} <ChevronRight size={12} />
              </Button>
            ) : (
              <Button size="sm" onClick={() => mutation.mutate()}
                disabled={!step3Valid || mutation.isPending}
                className="h-8 text-xs">
                {mutation.isPending ? "Saving…" : "Save Field"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
