import { useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuotesReceived } from "@/hooks/useJobs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSetAgreedPrice, useLogQuoteAction } from "@/hooks/usePaymentFlow";
import {
  formatCurrency, formatAcres, formatOperationType, formatDateShort,
  formatRelative,
} from "@/lib/format";
import { Check, X, MessageSquare, ChevronRight, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-warning",
  accepted: "text-success",
  rejected: "text-destructive",
  countered: "text-info",
  expired: "text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Your Review",
  accepted: "Accepted",
  rejected: "Declined",
  countered: "You Countered",
  expired: "Expired",
};

export default function QuotesReceived() {
  const { data: quotes = [], isLoading } = useQuotesReceived();
  const queryClient = useQueryClient();
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterQuoteId, setCounterQuoteId] = useState<string | null>(null);
  const [counterRate, setCounterRate] = useState("");

  const updateQuoteMutation = useMutation({
    mutationFn: async ({ quoteId, status }: { quoteId: string; status: string }) => {
      // Use RLS-safe approach: update via job owner check
      const { error } = await supabase
        .from("quotes")
        .update({ status } as any)
        .eq("id", quoteId);
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      toast.success(status === "accepted" ? "Quote accepted!" : "Quote declined");
      queryClient.invalidateQueries({ queryKey: ["quotes-received"] });
      queryClient.invalidateQueries({ queryKey: ["my-quotes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const pending = quotes.filter((q: any) => q.status === "pending");
  const others = quotes.filter((q: any) => q.status !== "pending");

  return (
    <AppShell title="Quotes Received">
      <div className="animate-fade-in max-w-3xl">
        {isLoading ? (
          <ListSkeleton rows={4} />
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No quotes received yet"
            description="When operators submit quotes on your jobs, they'll appear here."
          />
        ) : (
          <div className="space-y-4">
            {pending.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Needs Your Response ({pending.length})
                </p>
                <div className="rounded-lg border bg-card overflow-hidden divide-y">
                  {pending.map((q: any) => (
                    <QuoteReceivedRow
                      key={q.id}
                      quote={q}
                      onAccept={() => updateQuoteMutation.mutate({ quoteId: q.id, status: "accepted" })}
                      onReject={() => updateQuoteMutation.mutate({ quoteId: q.id, status: "rejected" })}
                      isPending={updateQuoteMutation.isPending}
                    />
                  ))}
                </div>
              </div>
            )}
            {others.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  History ({others.length})
                </p>
                <div className="rounded-lg border bg-card overflow-hidden divide-y">
                  {others.map((q: any) => (
                    <QuoteReceivedRow key={q.id} quote={q} />
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

function QuoteReceivedRow({ quote, onAccept, onReject, isPending }: {
  quote: any;
  onAccept?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}) {
  const job = quote.jobs;
  const jf = job?.job_fields?.[0];
  const fieldName = jf?.fields?.name || job?.title || "Unknown";
  const statusLabel = STATUS_LABELS[quote.status] || quote.status;
  const statusColor = STATUS_COLORS[quote.status] || "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 px-3 py-3 hover:bg-surface-2 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link to={`/jobs/${job?.id}`} className="text-[13px] font-medium truncate hover:text-primary transition-colors">
            {fieldName}
          </Link>
          <span className={cn("text-[10px] font-medium shrink-0", statusColor)}>
            {statusLabel}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {job ? formatOperationType(job.operation_type) : "—"}
          {job?.total_acres ? ` · ${formatAcres(Number(job.total_acres))}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[13px] font-semibold tabular-nums">{formatCurrency(Number(quote.total_quote))}</p>
        <p className="text-[10px] text-muted-foreground">
          {quote.base_rate ? `${formatCurrency(Number(quote.base_rate))}/ac` : ""}
        </p>
      </div>
      {quote.status === "pending" && onAccept && onReject && (
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-success border-success/30 hover:bg-success/10"
            onClick={onAccept} disabled={isPending}>
            <Check size={10} /> Accept
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={onReject} disabled={isPending}>
            <X size={10} /> Decline
          </Button>
        </div>
      )}
      <Link to={`/jobs/${job?.id}`}>
        <ChevronRight size={14} className="text-muted-foreground shrink-0" />
      </Link>
    </div>
  );
}
