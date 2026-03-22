import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CANCELLATION_REASONS, useCancelJob, canCancelJob, type CancellationReason } from "@/hooks/useJobActions";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle, Ban } from "lucide-react";

interface Props {
  job: any;
}

export function CancelJobDialog({ job }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CancellationReason | "">("");
  const [note, setNote] = useState("");
  const cancelJob = useCancelJob(job.id);

  const cancelInfo = canCancelJob(job, user?.id || "");
  if (!cancelInfo.allowed) return null;

  const handleCancel = () => {
    if (!reason) return;
    cancelJob.mutate(
      { reason: reason as CancellationReason, note: note.trim() || undefined },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/5 gap-1">
          <Ban size={13} /> Cancel Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            Cancel Job {job.display_id}
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The job will be marked as cancelled and remain in your records.
          </DialogDescription>
        </DialogHeader>

        {cancelInfo.feeWarning && (
          <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3 text-[12px] text-destructive flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Cancellation within 48 hours of scheduled work</p>
              <p className="mt-0.5 opacity-80">A cancellation fee may apply per the service agreement. The assigned operator will be notified immediately.</p>
            </div>
          </div>
        )}

        {job.operator_id && (
          <div className="rounded-md bg-warning/5 border border-warning/20 p-3 text-[12px] text-warning flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>This job has been accepted. The assigned operator will be notified of the cancellation.</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-[12px] font-medium mb-1 block">Reason for cancellation</label>
            <Select value={reason} onValueChange={(v) => setReason(v as CancellationReason)}>
              <SelectTrigger className="text-[13px]">
                <SelectValue placeholder="Select a reason…" />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value} className="text-[13px]">{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reason === "other" && (
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Provide additional details…"
              className="text-[12px] min-h-[60px] resize-none"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Keep Job</Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleCancel}
            disabled={!reason || cancelJob.isPending}
            className="gap-1"
          >
            <Ban size={13} />
            {cancelJob.isPending ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
