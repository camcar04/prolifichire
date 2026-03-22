import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StateSelect } from "@/components/ui/state-select";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFarmDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", county: "", state: "", totalAcres: "" });

  const mutation = useMutation({
    mutationFn: async () => {
      // First ensure user has an organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user!.id)
        .single();

      let orgId = profile?.organization_id;

      if (!orgId) {
        const { data: org, error: orgError } = await supabase
          .from("organizations")
          .insert({ name: form.name + " Farm Org", type: "farm" })
          .select("id")
          .single();
        if (orgError) throw orgError;
        orgId = org.id;
        await supabase
          .from("profiles")
          .update({ organization_id: orgId })
          .eq("user_id", user!.id);
      }

      const { error } = await supabase.from("farms").insert({
        name: form.name,
        county: form.county || null,
        state: form.state || null,
        total_acres: form.totalAcres ? Number(form.totalAcres) : 0,
        owner_id: user!.id,
        organization_id: orgId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      toast.success("Farm created");
      setForm({ name: "", county: "", state: "", totalAcres: "" });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Add Farm</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Farm Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Riverside Farm" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">County</Label>
              <Input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))} placeholder="Douglas" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">State</Label>
              <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="NE" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Total Acres</Label>
            <Input type="number" value={form.totalAcres} onChange={e => setForm(f => ({ ...f, totalAcres: e.target.value }))} placeholder="0" className="h-8 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">Cancel</Button>
          <Button size="sm" onClick={() => mutation.mutate()} disabled={!form.name.trim() || mutation.isPending} className="h-8 text-xs">
            {mutation.isPending ? "Creating…" : "Create Farm"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
