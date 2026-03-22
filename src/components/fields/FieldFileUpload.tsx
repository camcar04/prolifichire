import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FILE_CATEGORIES = [
  { value: "boundary", label: "Boundary / Shapefile" },
  { value: "prescription", label: "Prescription Map" },
  { value: "planting", label: "Planting Data" },
  { value: "as_applied", label: "As-Applied Data" },
  { value: "harvest", label: "Harvest Data" },
  { value: "soil_sample", label: "Soil Sample" },
  { value: "photo", label: "Photo" },
  { value: "other", label: "Other" },
];

interface Props {
  fieldId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FieldFileUpload({ fieldId, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState("boundary");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !user) throw new Error("No file selected");

      const ext = selectedFile.name.split(".").pop()?.toLowerCase() || "bin";
      const storagePath = `${user.id}/${fieldId}/${Date.now()}_${selectedFile.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("field-data")
        .upload(storagePath, selectedFile);
      if (uploadError) throw uploadError;

      // Determine format
      let format: string = "other";
      if (["geojson", "json"].includes(ext)) format = "geojson";
      else if (["shp", "dbf", "shx", "prj", "cpg"].includes(ext)) format = "shapefile";
      else if (ext === "kml" || ext === "kmz") format = "kml";
      else if (ext === "csv") format = "csv";
      else if (ext === "pdf") format = "pdf";
      else if (["png", "jpg", "jpeg", "webp"].includes(ext)) format = "png";
      else if (ext === "zip") format = "zip";

      // Create dataset_asset record
      const { error: dbError } = await supabase
        .from("dataset_assets")
        .insert({
          field_id: fieldId,
          category: category as any,
          format: format as any,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          mime_type: selectedFile.type || "application/octet-stream",
          storage_path: storagePath,
          uploaded_by: user.id,
          description: description || null,
          crop_year: new Date().getFullYear(),
        });
      if (dbError) throw dbError;

      // If it's a GeoJSON boundary file, try to parse and update field boundary
      if (category === "boundary" && (ext === "geojson" || ext === "json")) {
        try {
          const text = await selectedFile.text();
          const geojson = JSON.parse(text);
          let polygon = null;

          if (geojson.type === "FeatureCollection" && geojson.features?.length > 0) {
            polygon = geojson.features[0].geometry;
          } else if (geojson.type === "Feature") {
            polygon = geojson.geometry;
          } else if (geojson.type === "Polygon") {
            polygon = geojson;
          }

          if (polygon?.type === "Polygon" && polygon.coordinates?.[0]?.length >= 3) {
            const ring = polygon.coordinates[0];
            const lats = ring.map((c: number[]) => c[1]);
            const lngs = ring.map((c: number[]) => c[0]);
            const centroidLat = lats.reduce((a: number, b: number) => a + b, 0) / lats.length;
            const centroidLng = lngs.reduce((a: number, b: number) => a + b, 0) / lngs.length;

            await supabase.from("fields").update({
              boundary_geojson: polygon,
              centroid_lat: centroidLat,
              centroid_lng: centroidLng,
              bbox_north: Math.max(...lats),
              bbox_south: Math.min(...lats),
              bbox_east: Math.max(...lngs),
              bbox_west: Math.min(...lngs),
            }).eq("id", fieldId);

            toast.success("Boundary extracted and applied to field");
          }
        } catch {
          // Not valid GeoJSON boundary, that's ok
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets", fieldId] });
      queryClient.invalidateQueries({ queryKey: ["field", fieldId] });
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      toast.success("File uploaded successfully");
      setSelectedFile(null);
      setDescription("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Upload Field File</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">File Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FILE_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">File *</Label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".geojson,.json,.shp,.dbf,.shx,.prj,.kml,.kmz,.csv,.pdf,.png,.jpg,.jpeg,.zip,.xml,.tif,.tiff"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
            />
            {selectedFile ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <FileText size={14} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[10px]"
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                  Remove
                </Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full h-16 border-dashed gap-2"
                onClick={() => fileInputRef.current?.click()}>
                <Upload size={16} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Choose file to upload</span>
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. 2025 variable-rate prescription" className="h-8 text-sm" />
          </div>

          {category === "boundary" && (
            <p className="text-[11px] text-muted-foreground bg-muted/50 rounded p-2">
              GeoJSON boundary files will automatically update the field's boundary, centroid, and bounding box.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={() => uploadMutation.mutate()}
            disabled={!selectedFile || uploadMutation.isPending} className="h-8 text-xs gap-1">
            {uploadMutation.isPending ? <><Loader2 size={12} className="animate-spin" /> Uploading…</> : "Upload File"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
