import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFarms } from "@/hooks/useFields";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StateSelect } from "@/components/ui/state-select";
import { Textarea } from "@/components/ui/textarea";
import { FieldDrawMap, getBbox, getCentroid } from "@/components/map/FieldDrawMap";
import { toast } from "sonner";

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
  const [showMap, setShowMap] = useState(false);

  const handleBoundaryChange = (geojson: GeoJSON.Polygon | null, acres: number) => {
    setBoundary(geojson);
    setCalculatedAcres(acres);
    if (acres > 0 && !form.acreage) {
      setForm(f => ({ ...f, acreage: acres.toFixed(1) }));
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const baseData = {
        name: form.name,
        farm_id: form.farmId,
        acreage: Number(form.acreage) || 0,
        crop: form.crop as any,
        crop_year: Number(form.cropYear),
        county: form.county || null,
        state: form.state || null,
        legal_description: form.legalDescription || null,
        clu_number: form.cluNumber || null,
        fsa_farm_number: form.fsaFarmNumber || null,
        ...(boundary ? (() => {
          const ring = boundary.coordinates[0];
          const cent = getCentroid(ring);
          const bbox = getBbox(ring);
          return {
            boundary_geojson: boundary as any,
            centroid_lat: cent.lat,
            centroid_lng: cent.lng,
            bbox_north: bbox.north,
            bbox_south: bbox.south,
            bbox_east: bbox.east,
            bbox_west: bbox.west,
          };
        })() : {}),
      };

      const { error } = await supabase.from("fields").insert(baseData as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      toast.success("Field added to library");
      setForm({ name: "", farmId: preselectedFarmId || "", acreage: "", crop: "corn", cropYear: String(new Date().getFullYear()), county: "", state: "", legalDescription: "", cluNumber: "", fsaFarmNumber: "" });
      setBoundary(null);
      setCalculatedAcres(0);
      setShowMap(false);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">Add Field to Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Farm *</Label>
            <Select value={form.farmId} onValueChange={v => setForm(f => ({ ...f, farmId: v }))}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select farm" /></SelectTrigger>
              <SelectContent>
                {farms.map(farm => (
                  <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Field Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. North Quarter" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Acreage *
                {calculatedAcres > 0 && <span className="text-primary ml-1">(calc: {calculatedAcres.toFixed(1)})</span>}
              </Label>
              <Input type="number" value={form.acreage} onChange={e => setForm(f => ({ ...f, acreage: e.target.value }))} placeholder="160" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Crop</Label>
              <Select value={form.crop} onValueChange={v => setForm(f => ({ ...f, crop: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CROP_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Crop Year</Label>
              <Input type="number" value={form.cropYear} onChange={e => setForm(f => ({ ...f, cropYear: e.target.value }))} className="h-8 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">County <span className="text-destructive">*</span></Label>
              <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">State <span className="text-destructive">*</span></Label>
              <StateSelect value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))} />
            </div>
          </div>

          {/* Map boundary drawing */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Field Boundary</Label>
              <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                onClick={() => setShowMap(!showMap)}>
                {showMap ? "Hide Map" : "Draw on Map"}
              </Button>
            </div>
            {showMap && (
              <FieldDrawMap
                onBoundaryChange={handleBoundaryChange}
                initialGeojson={boundary}
              />
            )}
            {boundary && !showMap && (
              <p className="text-[11px] text-success bg-success/8 rounded px-2 py-1">
                ✓ Boundary drawn — {calculatedAcres.toFixed(1)} acres calculated
              </p>
            )}
          </div>

          <details className="group">
            <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              Additional identifiers ›
            </summary>
            <div className="mt-2 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Legal Description</Label>
                <Textarea value={form.legalDescription} onChange={e => setForm(f => ({ ...f, legalDescription: e.target.value }))} placeholder="SE¼ of Section 12, T15N, R8E" rows={2} className="text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">CLU Number</Label>
                  <Input value={form.cluNumber} onChange={e => setForm(f => ({ ...f, cluNumber: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">FSA Farm Number</Label>
                  <Input value={form.fsaFarmNumber} onChange={e => setForm(f => ({ ...f, fsaFarmNumber: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>
            </div>
          </details>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.name.trim() || !form.farmId || !form.acreage || !form.county.trim() || !form.state || mutation.isPending} className="h-8 text-xs">
            {mutation.isPending ? "Saving…" : "Add Field"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
