import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useJobUpdates, usePostJobUpdate, UPDATE_STATUS_LABELS, type JobUpdateStatus } from "@/hooks/useJobExecution";
import { useProofWithPhotos, useMarkInProgress } from "@/hooks/useProofSubmission";
import { ProofSubmissionPanel } from "@/components/jobs/ProofSubmissionPanel";
import { ProofReviewPanel } from "@/components/jobs/ProofReviewPanel";
import { formatRelative } from "@/lib/format";
import { 
  Navigation, MapPin, Play, Pause, AlertTriangle, CheckCircle2, 
  FileText, Clock, Send, ChevronDown, Eye 
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_ICONS: Record<string, typeof Play> = {
  packet_reviewed: Eye,
  en_route: Navigation,
  arrived: MapPin,
  starting_work: Play,
  delayed: Clock,
  paused: Pause,
  issue_encountered: AlertTriangle,
  completed: CheckCircle2,
  note: FileText,
};

const QUICK_STATUSES: JobUpdateStatus[] = [
  "en_route", "arrived", "starting_work", "paused", "completed",
];

interface Props {
  jobId: string;
  jobStatus: string;
  isOperator: boolean;
  isGrowerView: boolean;
}

export function JobExecutionPanel({ jobId, jobStatus, isOperator, isGrowerView }: Props) {
  const { data: updates = [] } = useJobUpdates(jobId);
  const { data: proofs = [] } = useProofWithPhotos(jobId);
  const postUpdate = usePostJobUpdate(jobId);
  const markInProgress = useMarkInProgress(jobId);
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(true);

  const activeStatuses = ["accepted", "scheduled", "in_progress"];
  const canUpdate = isOperator && activeStatuses.includes(jobStatus);
  const latestProof: any = proofs[0];
  const isPendingReview = latestProof?.status === "pending_review";
  const isRevisionRequested = latestProof?.status === "revision_requested";
  const canMarkInProgress = isOperator && jobStatus === "scheduled";
  const canSubmitProof =
    isOperator &&
    (jobStatus === "in_progress" || isRevisionRequested) &&
    !isPendingReview;

  const handleQuickUpdate = (status: JobUpdateStatus) => {
    postUpdate.mutate({ status });
  };

  const handleNoteSubmit = () => {
    if (!note.trim()) return;
    postUpdate.mutate({ status: "note", note: note.trim() });
    setNote("");
  };

  return (
    <div className="rounded bg-card border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 border-b hover:bg-surface-2 transition-colors"
      >
        <h3 className="text-xs font-semibold flex items-center gap-1.5">
          <Play size={12} /> Job Execution
          {updates.length > 0 && (
            <span className="text-[10px] font-normal text-muted-foreground">· {updates.length} updates</span>
          )}
        </h3>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="p-3 space-y-3">
          {/* Mark In Progress (operator, scheduled) */}
          {canMarkInProgress && (
            <div className="bg-primary/5 border border-primary/20 rounded p-2.5 flex items-center gap-2">
              <Play size={14} className="text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium">Ready to start work?</p>
                <p className="text-[11px] text-muted-foreground">Mark this job as In Progress to begin tracking execution.</p>
              </div>
              <Button size="sm" className="h-7 text-[12px]" onClick={() => markInProgress.mutate()} disabled={markInProgress.isPending}>
                Mark as In Progress
              </Button>
            </div>
          )}

          {/* Quick status buttons — operator only */}
          {canUpdate && (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Quick Update</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_STATUSES.map((s) => {
                  const Icon = STATUS_ICONS[s] || FileText;
                  return (
                    <Button
                      key={s}
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 gap-1"
                      onClick={() => handleQuickUpdate(s)}
                      disabled={postUpdate.isPending}
                    >
                      <Icon size={11} /> {UPDATE_STATUS_LABELS[s]}
                    </Button>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-1">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note or update…"
                  className="text-[12px] min-h-[56px] resize-none"
                />
                <Button
                  size="sm"
                  className="shrink-0 self-end h-7"
                  onClick={handleNoteSubmit}
                  disabled={!note.trim() || postUpdate.isPending}
                >
                  <Send size={11} />
                </Button>
              </div>
            </div>
          )}

          {/* Proof submission form (operator) */}
          {canSubmitProof && (
            <ProofSubmissionPanel
              jobId={jobId}
              isResubmission={isRevisionRequested}
            />
          )}

          {/* Proof review (grower) or read-only (operator) */}
          {proofs.length > 0 && (
            <ProofReviewPanel jobId={jobId} proofs={proofs} isGrower={isGrowerView} />
          )}

          {/* Update timeline */}
          {updates.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Activity</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {updates.map((u: any) => {
                  const Icon = STATUS_ICONS[u.status] || FileText;
                  return (
                    <div key={u.id} className="flex items-start gap-2">
                      <div className="mt-0.5 h-5 w-5 rounded-full bg-surface-2 flex items-center justify-center shrink-0">
                        <Icon size={10} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium">{UPDATE_STATUS_LABELS[u.status as JobUpdateStatus] || u.status}</span>
                          <span className="text-[10px] text-muted-foreground">{formatRelative(u.created_at)}</span>
                        </div>
                        {u.note && <p className="text-[11px] text-muted-foreground mt-0.5">{u.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {updates.length === 0 && !canUpdate && (
            <p className="text-[12px] text-muted-foreground text-center py-3">
              {isGrowerView ? "No operator updates yet. Updates will appear here once work begins." : "Status updates will appear here once the job is active."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
