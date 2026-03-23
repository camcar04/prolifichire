import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatRelative } from "@/lib/format";
import { ArrowRight, ArrowLeft, Check, X, MessageSquare } from "lucide-react";

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  submitted: { label: "Quote Submitted", icon: ArrowRight, color: "text-info" },
  countered: { label: "Counter-Offer", icon: ArrowLeft, color: "text-warning" },
  accepted: { label: "Accepted", icon: Check, color: "text-success" },
  rejected: { label: "Declined", icon: X, color: "text-destructive" },
  price_agreed: { label: "Price Agreed", icon: Check, color: "text-success" },
  revised: { label: "Revised", icon: MessageSquare, color: "text-muted-foreground" },
};

export function QuoteNegotiationHistory({ quoteId, jobId }: { quoteId?: string; jobId: string }) {
  const { data: history = [] } = useQuery({
    queryKey: ["quote-history", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_history" as any)
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  if (history.length === 0) return null;

  return (
    <div className="rounded border bg-card">
      <div className="px-3 py-2 border-b">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Negotiation History
        </h4>
      </div>
      <div className="divide-y">
        {history.map((entry: any) => {
          const config = ACTION_CONFIG[entry.action] || ACTION_CONFIG.submitted;
          const Icon = config.icon;
          return (
            <div key={entry.id} className="flex items-center gap-3 px-3 py-2">
              <div className={`shrink-0 ${config.color}`}>
                <Icon size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium">{config.label}</p>
                {entry.notes && (
                  <p className="text-[11px] text-muted-foreground truncate">{entry.notes}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-semibold tabular-nums">
                  {formatCurrency(Number(entry.amount))}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {formatRelative(entry.created_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
