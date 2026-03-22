import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Flag } from "lucide-react";
import { useReportJob } from "@/hooks/useTrustSystem";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  "This job is not real",
  "Missing key details",
  "Suspicious posting",
  "Misleading pay or terms",
  "Duplicate posting",
  "Other",
] as const;

interface ReportJobDialogProps {
  jobId: string;
  className?: string;
}

export function ReportJobDialog({ jobId, className }: ReportJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const report = useReportJob();

  const handleSubmit = () => {
    if (!reason) return;
    report.mutate(
      { jobId, reason, details: details.trim() || undefined },
      { onSuccess: () => { setOpen(false); setReason(""); setDetails(""); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-6 text-[10px] gap-1 text-muted-foreground", className)}>
          <Flag size={9} /> Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">Report Job Posting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Reason</p>
            <div className="flex flex-wrap gap-1.5">
              {REPORT_REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] border transition-colors",
                    reason === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground border-transparent"
                  )}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground mb-1">Details (optional)</p>
            <Textarea
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Provide additional context…"
              className="text-[12px] min-h-[60px]"
              maxLength={500}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[11px] h-7">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!reason || report.isPending}
              className="text-[11px] h-7 gap-1 bg-destructive hover:bg-destructive/90">
              <Flag size={10} /> Submit Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
