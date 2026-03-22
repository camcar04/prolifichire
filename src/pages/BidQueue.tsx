import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Button } from "@/components/ui/button";
import { useMyBidQueue } from "@/hooks/useJobs";
import { useSavedJobsList, useToggleSaveJob } from "@/hooks/useSavedJobs";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { Bookmark, BookmarkX, ChevronRight, Store, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Tab = "saved" | "quoted";

const QUOTE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Response", color: "text-warning" },
  accepted: { label: "Accepted", color: "text-success" },
  rejected: { label: "Rejected", color: "text-destructive" },
  countered: { label: "Countered", color: "text-info" },
  expired: { label: "Expired", color: "text-muted-foreground" },
};

export default function BidQueue() {
  const [tab, setTab] = useState<Tab>("saved");
  const { data: savedJobs = [], isLoading: loadingSaved } = useSavedJobsList();
  const { data: quotes = [], isLoading: loadingQuotes } = useMyBidQueue();
  const toggleSave = useToggleSaveJob();

  const isLoading = tab === "saved" ? loadingSaved : loadingQuotes;

  return (
    <AppShell title="Bid Queue">
      <div className="animate-fade-in max-w-3xl">
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b">
          <button
            onClick={() => setTab("saved")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
              tab === "saved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Bookmark size={12} /> Saved Jobs
            {savedJobs.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold tabular-nums">{savedJobs.length}</span>
            )}
          </button>
          <button
            onClick={() => setTab("quoted")}
            className={cn(
              "px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
              tab === "quoted" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Send size={12} /> Quotes Submitted
            {quotes.length > 0 && (
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold tabular-nums">{quotes.length}</span>
            )}
          </button>
        </div>

        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : tab === "saved" ? (
          savedJobs.length === 0 ? (
            <EmptyState
              icon={<Bookmark size={24} />}
              title="No saved jobs"
              description="Browse jobs in the marketplace and save ones you're interested in."
              action={{ label: "Browse Marketplace", to: "/marketplace" }}
            />
          ) : (
            <div className="rounded border bg-card overflow-hidden divide-y">
              {savedJobs.map((sj: any) => {
                const job = sj.jobs;
                if (!job) return null;
                const jf = job.job_fields?.[0];
                const fieldName = jf?.fields?.name || job.title;
                return (
                  <div key={sj.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors group">
                    <Link to={`/jobs/${job.id}`} className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
                          {fieldName}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatOperationType(job.operation_type)}
                          {job.total_acres ? ` · ${formatAcres(Number(job.total_acres))}` : ""}
                          {job.deadline ? ` · by ${formatDateShort(job.deadline)}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(Number(job.estimated_total))}</p>
                        <p className="text-[10px] text-muted-foreground">Saved {formatRelative(sj.saved_at)}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => toggleSave.mutate({ jobId: job.id, isSaved: true })}
                      className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors"
                      title="Remove from saved"
                    >
                      <BookmarkX size={14} />
                    </button>
                    <Link to={`/jobs/${job.id}`}><ChevronRight size={14} className="text-muted-foreground shrink-0" /></Link>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          quotes.length === 0 ? (
            <EmptyState
              icon={<Send size={24} />}
              title="No quotes submitted"
              description="Submit quotes on marketplace jobs to track them here."
              action={{ label: "Browse Marketplace", to: "/marketplace" }}
            />
          ) : (
            <div className="space-y-4">
              {/* Active quotes */}
              {(() => {
                const active = quotes.filter((q: any) => ["pending", "countered"].includes(q.status));
                const resolved = quotes.filter((q: any) => ["accepted", "rejected", "expired"].includes(q.status));
                return (
                  <>
                    {active.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Active ({active.length})
                        </p>
                        <div className="rounded border bg-card overflow-hidden divide-y">
                          {active.map((q: any) => <QuoteRow key={q.id} quote={q} />)}
                        </div>
                      </div>
                    )}
                    {resolved.length > 0 && (
                      <div>
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          History ({resolved.length})
                        </p>
                        <div className="rounded border bg-card overflow-hidden divide-y">
                          {resolved.map((q: any) => <QuoteRow key={q.id} quote={q} />)}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )
        )}
      </div>
    </AppShell>
  );
}

function QuoteRow({ quote }: { quote: any }) {
  const job = quote.jobs;
  const jf = job?.job_fields?.[0];
  const fieldName = jf?.fields?.name || job?.title || "Unknown";
  const statusInfo = QUOTE_STATUS_LABELS[quote.status] || { label: quote.status, color: "text-muted-foreground" };

  return (
    <Link
      to={`/jobs/${job?.id}`}
      className="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-2 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">
            {fieldName}
          </p>
          <span className={cn("text-[10px] font-medium", statusInfo.color)}>
            {statusInfo.label}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {job ? formatOperationType(job.operation_type) : "—"}
          {job?.total_acres ? ` · ${formatAcres(Number(job.total_acres))}` : ""}
          {job?.deadline ? ` · by ${formatDateShort(job.deadline)}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(Number(quote.total_quote))}</p>
        <p className="text-[10px] text-muted-foreground">{formatRelative(quote.submitted_at)}</p>
      </div>
      <ChevronRight size={14} className="text-muted-foreground shrink-0" />
    </Link>
  );
}
