import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { useMyBidQueue } from "@/hooks/useJobs";
import { formatCurrency, formatAcres, formatOperationType, formatDateShort, formatRelative } from "@/lib/format";
import { Bookmark, ChevronRight, Clock, DollarSign, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Awaiting Response", color: "text-warning" },
  accepted: { label: "Accepted", color: "text-success" },
  rejected: { label: "Rejected", color: "text-destructive" },
  countered: { label: "Countered", color: "text-info" },
  expired: { label: "Expired", color: "text-muted-foreground" },
};

export default function BidQueue() {
  const { data: quotes = [], isLoading } = useMyBidQueue();

  const active = quotes.filter((q: any) => ["pending", "countered"].includes(q.status));
  const resolved = quotes.filter((q: any) => ["accepted", "rejected", "expired"].includes(q.status));

  return (
    <AppShell title="Bid Queue">
      <div className="animate-fade-in max-w-3xl">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={24} />}
            title="No bids submitted yet"
            description="Browse available jobs in the marketplace and submit quotes to build your bid queue."
            action={{ label: "Browse Marketplace", to: "/marketplace" }}
          />
        ) : (
          <div className="space-y-5">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active Bids", value: active.length, color: "text-primary" },
                { label: "Accepted", value: quotes.filter((q: any) => q.status === "accepted").length, color: "text-success" },
                { label: "Total Quoted", value: formatCurrency(quotes.reduce((a: number, q: any) => a + Number(q.total_quote || 0), 0)), color: "text-foreground" },
              ].map(s => (
                <div key={s.label} className="rounded-lg bg-card border p-3 text-center">
                  <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Active bids */}
            {active.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Active Bids ({active.length})
                </p>
                <div className="rounded-lg border bg-card overflow-hidden divide-y">
                  {active.map((q: any) => (
                    <QuoteRow key={q.id} quote={q} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved */}
            {resolved.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  History ({resolved.length})
                </p>
                <div className="rounded-lg border bg-card overflow-hidden divide-y">
                  {resolved.map((q: any) => (
                    <QuoteRow key={q.id} quote={q} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function QuoteRow({ quote }: { quote: any }) {
  const job = quote.jobs;
  const jf = job?.job_fields?.[0];
  const fieldName = jf?.fields?.name || job?.title || "Unknown";
  const statusInfo = STATUS_LABELS[quote.status] || { label: quote.status, color: "text-muted-foreground" };

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
