import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useReviewProof } from "@/hooks/useProofSubmission";
import { formatRelative, formatDate, formatAcres } from "@/lib/format";
import { CheckCircle2, RotateCcw, AlertTriangle, ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProofRow {
  id: string;
  status: string;
  notes: string | null;
  actual_acres: number | null;
  completion_date: string | null;
  version: number;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  approved_at: string | null;
  revision_requested_at: string | null;
  photos?: Array<{
    id: string;
    file_name: string;
    kind: string;
    signedUrl?: string;
  }>;
}

interface Props {
  jobId: string;
  proofs: ProofRow[];
  isGrower: boolean;
}

export function ProofReviewPanel({ jobId, proofs, isGrower }: Props) {
  const review = useReviewProof(jobId);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseNotes, setReviseNotes] = useState("");
  const [activePhoto, setActivePhoto] = useState<{ proofId: string; index: number } | null>(null);

  if (!proofs || proofs.length === 0) return null;

  const latest = proofs[0];
  const photos = (latest.photos || []).filter((p) => p.kind === "photo");
  const logs = (latest.photos || []).filter((p) => p.kind !== "photo");
  const canApprove = isGrower && latest.status === "pending_review" && photos.length >= 1;
  const showApprovalGate = isGrower && latest.status === "pending_review" && photos.length === 0;

  const handleApprove = () => {
    if (!confirm("Approve this work? This will move the job to approved status.")) return;
    review.mutate({ proofId: latest.id, decision: "approved" });
  };

  const handleRequestRevision = () => {
    if (!reviseNotes.trim()) return;
    review.mutate(
      { proofId: latest.id, decision: "revision_requested", reviewNotes: reviseNotes.trim() },
      {
        onSuccess: () => {
          setReviseOpen(false);
          setReviseNotes("");
        },
      }
    );
  };

  const carouselNext = () => {
    if (!activePhoto) return;
    setActivePhoto({ ...activePhoto, index: (activePhoto.index + 1) % photos.length });
  };
  const carouselPrev = () => {
    if (!activePhoto) return;
    setActivePhoto({ ...activePhoto, index: (activePhoto.index - 1 + photos.length) % photos.length });
  };

  const statusBadge = () => {
    const map: Record<string, { label: string; cls: string }> = {
      pending_review: { label: "Pending Review", cls: "bg-warning/15 text-warning" },
      approved: { label: "Approved", cls: "bg-success/15 text-success" },
      revision_requested: { label: "Revision Requested", cls: "bg-destructive/15 text-destructive" },
      rejected: { label: "Rejected", cls: "bg-destructive/15 text-destructive" },
    };
    const m = map[latest.status] || { label: latest.status, cls: "bg-muted text-muted-foreground" };
    return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", m.cls)}>{m.label}</span>;
  };

  return (
    <div className="rounded bg-card border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <CheckCircle2 size={12} /> Proof of Work
          <span className="text-[10px] font-normal text-muted-foreground">
            v{latest.version}{proofs.length > 1 && ` of ${proofs.length}`}
          </span>
        </h3>
        {statusBadge()}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="bg-surface-2 rounded p-2">
          <p className="text-muted-foreground">Actual acres</p>
          <p className="font-semibold tabular-nums">
            {latest.actual_acres ? formatAcres(Number(latest.actual_acres)) : "—"}
          </p>
        </div>
        <div className="bg-surface-2 rounded p-2">
          <p className="text-muted-foreground">Completed</p>
          <p className="font-semibold">
            {latest.completion_date ? formatDate(latest.completion_date) : "—"}
          </p>
        </div>
      </div>

      {latest.notes && (
        <div className="text-[12px]">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Operator notes</p>
          <p className="text-foreground/90">{latest.notes}</p>
        </div>
      )}

      {/* Photo carousel thumbnails */}
      {photos.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
            Completion photos ({photos.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setActivePhoto({ proofId: latest.id, index: i })}
                className="w-16 h-16 rounded overflow-hidden border bg-muted hover:ring-2 hover:ring-primary transition-all"
              >
                {p.signedUrl ? (
                  <img src={p.signedUrl} alt={p.file_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon size={16} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Logs / data</p>
          <ul className="space-y-1">
            {logs.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-[11px] bg-surface-2 rounded px-2 py-1">
                <FileText size={11} className="text-muted-foreground" />
                <span className="truncate flex-1">{l.file_name}</span>
                <span className="text-[10px] text-muted-foreground uppercase">{l.kind}</span>
                {l.signedUrl && (
                  <a href={l.signedUrl} target="_blank" rel="noreferrer" className="text-info hover:underline text-[11px]">
                    Open
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {latest.review_notes && (
        <div className="bg-info/10 border-l-2 border-info p-2 rounded-sm">
          <p className="text-[10px] font-semibold text-info uppercase tracking-wider">Review notes</p>
          <p className="text-[12px] mt-0.5">{latest.review_notes}</p>
        </div>
      )}

      {/* Grower actions */}
      {isGrower && latest.status === "pending_review" && (
        <div className="border-t pt-3 space-y-2">
          {showApprovalGate && (
            <div className="flex items-start gap-2 bg-warning/10 border border-warning/30 rounded p-2">
              <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] text-warning-foreground">
                You can't approve work without seeing at least one photo. Ask the operator to resubmit with photos.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1 text-[12px]"
              onClick={handleApprove}
              disabled={!canApprove || review.isPending}
            >
              <CheckCircle2 size={12} /> Approve Work
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1 text-[12px]"
              onClick={() => setReviseOpen(true)}
              disabled={review.isPending}
            >
              <RotateCcw size={12} /> Request Revision
            </Button>
          </div>
        </div>
      )}

      {/* Submission history (if multiple versions) */}
      {proofs.length > 1 && (
        <details className="border-t pt-2">
          <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">
            Earlier submissions ({proofs.length - 1})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {proofs.slice(1).map((p) => (
              <li key={p.id} className="text-[11px] bg-surface-2 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">v{p.version} · {p.status.replace("_", " ")}</span>
                  <span className="text-muted-foreground text-[10px]">{formatRelative(p.created_at)}</span>
                </div>
                {p.review_notes && <p className="text-muted-foreground mt-1">"{p.review_notes}"</p>}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Photo lightbox */}
      <Dialog open={!!activePhoto} onOpenChange={(o) => !o && setActivePhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Photo {activePhoto ? activePhoto.index + 1 : 0} of {photos.length}
            </DialogTitle>
          </DialogHeader>
          {activePhoto && photos[activePhoto.index]?.signedUrl && (
            <div className="relative">
              <img
                src={photos[activePhoto.index].signedUrl}
                alt={photos[activePhoto.index].file_name}
                className="w-full max-h-[70vh] object-contain rounded"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={carouselPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 hover:bg-background"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={carouselNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 rounded-full p-2 hover:bg-background"
                    aria-label="Next"
                  >
                    <ChevronRight size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Request revision dialog */}
      <Dialog open={reviseOpen} onOpenChange={setReviseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Request Revision</DialogTitle>
          </DialogHeader>
          <p className="text-[12px] text-muted-foreground">
            Tell the operator what needs to be corrected. The job will return to <strong>In Progress</strong> so they can resubmit.
          </p>
          <Textarea
            value={reviseNotes}
            onChange={(e) => setReviseNotes(e.target.value)}
            placeholder="e.g., Photos don't show the southwest corner. Please add coverage of that section."
            className="min-h-[100px] text-[12px]"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setReviseOpen(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={handleRequestRevision}
              disabled={!reviseNotes.trim() || review.isPending}
              className="gap-1"
            >
              <RotateCcw size={12} /> Send Revision Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}