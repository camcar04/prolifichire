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

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fields").insert({
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      toast.success("Field added to library");
      setForm({ name: "", farmId: preselectedFarmId || "", acreage: "", crop: "corn", cropYear: String(new Date().getFullYear()), county: "", state: "", legalDescription: "", cluNumber: "", fsaFarmNumber: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
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
              <Label className="text-xs">Acreage *</Label>
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
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.name.trim() || !form.farmId || !form.acreage || mutation.isPending} className="h-8 text-xs">
            {mutation.isPending ? "Saving…" : "Add Field"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
