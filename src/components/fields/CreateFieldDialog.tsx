import { useState, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFarms } from "@/hooks/useFields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StateSelect } from "@/components/ui/state-select";
import { Textarea } from "@/components/ui/textarea";
import { FieldDrawMap, getBbox, getCentroid } from "@/components/map/FieldDrawMap";
import { X, ChevronDown } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);

  // Set default farm
  useEffect(() => {
    if (open && !form.farmId && farms.length === 1) {
      setForm(f => ({ ...f, farmId: farms[0].id }));
    }
  }, [open, farms]);

  const handleBoundaryChange = useCallback((geojson: GeoJSON.Polygon | null, acres: number) => {
    setBoundary(geojson);
    setCalculatedAcres(acres);
    if (acres > 0) {
      setForm(f => ({ ...f, acreage: acres.toFixed(1) }));
    }
  }, []);

  const canSave = form.name.trim() && form.farmId && (boundary !== null || Number(form.acreage) > 0);

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
    setShowDetails(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar — dark, minimal */}
      <div className="flex items-center justify-between h-14 px-4 bg-card border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={handleClose}
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors active:scale-95 shrink-0">
            <X size={18} />
          </button>

          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Field name"
            className="h-9 border-0 bg-transparent text-base font-semibold px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 max-w-[240px]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Farm selector — compact */}
          <Select value={form.farmId} onValueChange={v => setForm(f => ({ ...f, farmId: v }))}>
            <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs border-muted bg-muted/50">
              <SelectValue placeholder="Farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map(farm => (
                <SelectItem key={farm.id} value={farm.id}>{farm.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleClose} className="h-8 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={() => mutation.mutate()}
            disabled={!canSave || mutation.isPending}
            className="h-8 text-xs font-semibold">
            {mutation.isPending ? "Saving…" : "Save Field"}
          </Button>
        </div>
      </div>

      {/* Map — fills remaining space */}
      <div className="flex-1 relative">
        <FieldDrawMap
          onBoundaryChange={handleBoundaryChange}
          initialGeojson={boundary}
          fullscreen
          className="!rounded-none"
        />

        {/* Details drawer — slides up from bottom-left */}
        <div className={cn(
          "absolute bottom-16 left-4 z-30 w-[320px] rounded-xl bg-card/95 backdrop-blur-xl shadow-2xl border overflow-hidden transition-all duration-300",
          showDetails ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh]">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field Details</h3>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Crop</Label>
                <Select value={form.crop} onValueChange={v => setForm(f => ({ ...f, crop: v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CROP_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">Year</Label>
                <Input type="number" value={form.cropYear} onChange={e => setForm(f => ({ ...f, cropYear: e.target.value }))} className="h-8 text-xs" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">
                Acreage {calculatedAcres > 0 && <span className="text-primary">(from boundary)</span>}
              </Label>
              <Input type="number" value={form.acreage} onChange={e => setForm(f => ({ ...f, acreage: e.target.value }))} placeholder="0" className="h-8 text-xs" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">County</Label>
                <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} placeholder="Lancaster" className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">State</Label>
                <StateSelect value={form.state} onValueChange={v => setForm(f => ({ ...f, state: v }))} />
              </div>
            </div>

            <details className="group">
              <summary className="text-[10px] font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Legal identifiers ›
              </summary>
              <div className="mt-2 space-y-2">
                <div className="space-y-1">
                  <Label className="text-[10px] text-muted-foreground">Legal Description</Label>
                  <Textarea value={form.legalDescription} onChange={e => setForm(f => ({ ...f, legalDescription: e.target.value }))}
                    placeholder="SE¼ of Section 12…" rows={2} className="text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">CLU #</Label>
                    <Input value={form.cluNumber} onChange={e => setForm(f => ({ ...f, cluNumber: e.target.value }))} className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">FSA Farm #</Label>
                    <Input value={form.fsaFarmNumber} onChange={e => setForm(f => ({ ...f, fsaFarmNumber: e.target.value }))} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Toggle details button */}
        <button onClick={() => setShowDetails(!showDetails)}
          className={cn(
            "absolute z-30 left-4 rounded-lg bg-card/90 backdrop-blur-md shadow-lg border px-3 py-2 text-xs font-medium text-foreground hover:bg-card active:scale-95 transition-all flex items-center gap-1.5",
            showDetails ? "bottom-[calc(60vh+80px)]" : "bottom-16"
          )}>
          <ChevronDown size={12} className={cn("transition-transform", showDetails && "rotate-180")} />
          {showDetails ? "Hide" : "Details"}
        </button>
      </div>
    </div>
  );
}
