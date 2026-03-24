import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: { id: string; name: string } | null;
}

export function DeleteFieldDialog({ open, onOpenChange, field }: Props) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!field) throw new Error("No field selected");
      // Delete related records first (field_access_instructions, field_requirements)
      await supabase.from("field_access_instructions").delete().eq("field_id", field.id);
      await supabase.from("field_requirements").delete().eq("field_id", field.id);
      // Delete the field itself
      const { error } = await supabase.from("fields").delete().eq("id", field.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fields"] });
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      toast.success(`"${field?.name}" has been removed`);
      setConfirm("");
      onOpenChange(false);
    },
    onError: (e: Error) => {
      // If foreign key constraint, field is linked to jobs
      if (e.message?.includes("foreign key") || e.message?.includes("violates")) {
        toast.error("This field is linked to existing jobs and cannot be deleted. Archive it instead.");
      } else {
        toast.error(e.message || "Failed to delete field");
      }
    },
  });

  const canDelete = confirm === field?.name;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setConfirm(""); onOpenChange(v); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle size={18} /> Remove Field
          </DialogTitle>
          <DialogDescription>
            This will permanently remove <strong>{field?.name}</strong> and all its boundary data, access instructions, and requirements. Jobs linked to this field will not be affected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type the field name to confirm:</label>
            <Input
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder={field?.name || ""}
              className="font-mono"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={!canDelete || mutation.isPending}
            >
              {mutation.isPending && <Loader2 size={14} className="animate-spin mr-1.5" />}
              Delete Field
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
