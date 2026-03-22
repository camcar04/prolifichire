import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { VerifiedBadge, deriveBadgesFromRows } from "@/components/operators/VerifiedBadge";
import { formatCurrency, formatPricingModel } from "@/lib/format";
import { MessageSquare, ArrowUpDown, Star, MapPin, Check, Trophy, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuoteComparisonTableProps {
  jobId: string;
  onAccept?: () => void;
}

type SortKey = "total_quote" | "travel_fee" | "operator_name";

export function QuoteComparisonTable({ jobId, onAccept }: QuoteComparisonTableProps) {
  const [sortBy, setSortBy] = useState<SortKey>("total_quote");
  const [sortAsc, setSortAsc] = useState(true);
  const queryClient = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["job-quotes", jobId],
    queryFn: async () => {
      const { data } = await supabase
        .from("quotes")
        .select("*")
        .eq("job_id", jobId)
        .order("submitted_at", { ascending: false });

      if (!data?.length) return [];

      // Fetch operator profiles + credentials for each quote
      const operatorIds = [...new Set(data.map(q => q.operator_id))];
      const { data: profiles } = await supabase
        .from("operator_profiles")
        .select("id, user_id, business_name, base_address, rating, completed_jobs, service_radius")
        .in("user_id", operatorIds);

      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

      // Get credentials for badges
      const opIds = (profiles || []).map(p => p.id);
      const { data: creds } = opIds.length > 0
        ? await supabase.from("credentials").select("*").in("operator_id", opIds)
        : { data: [] };

      const credsByOp = new Map<string, any[]>();
      (creds || []).forEach(c => {
        const list = credsByOp.get(c.operator_id) || [];
        list.push(c);
        credsByOp.set(c.operator_id, list);
      });

      return data.map(q => {
        const profile = profileMap.get(q.operator_id);
        const opCreds = profile ? (credsByOp.get(profile.id) || []) : [];
        return {
          ...q,
          operator_name: profile?.business_name || "Unknown Operator",
          operator_profile_id: profile?.id,
          operator_address: profile?.base_address,
          operator_rating: profile?.rating,
          operator_jobs: profile?.completed_jobs,
          badges: deriveBadgesFromRows(opCreds),
        };
      });
    },
    enabled: !!jobId,
  });

  const acceptMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const quote = quotes.find(q => q.id === quoteId);
      if (!quote) throw new Error("Quote not found");

      // Update job
      const { error: jobErr } = await supabase.from("jobs").update({
        operator_id: quote.operator_id,
        status: "accepted",
        base_rate: quote.base_rate,
        estimated_total: quote.total_quote,
      }).eq("id", jobId);
      if (jobErr) throw jobErr;

      // Update quote status
      await supabase.from("quotes").update({ status: "accepted" } as any).eq("id", quoteId);
      // Reject others
      const otherIds = quotes.filter(q => q.id !== quoteId).map(q => q.id);
      if (otherIds.length > 0) {
        await supabase.from("quotes").update({ status: "declined" } as any).in("id", otherIds);
      }
    },
    onSuccess: () => {
      toast.success("Quote accepted — job awarded to operator");
      queryClient.invalidateQueries({ queryKey: ["job-quotes", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      onAccept?.();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(true); }
  };

  if (isLoading) return <div className="h-24 bg-muted animate-pulse rounded-lg" />;
  if (quotes.length === 0) {
    return <EmptyState icon={<Star size={18} />} title="No quotes yet" description="Operators haven't submitted quotes for this job yet." />;
  }

  const sorted = [...quotes].sort((a, b) => {
    let cmp = 0;
    if (sortBy === "total_quote") cmp = Number(a.total_quote) - Number(b.total_quote);
    else if (sortBy === "travel_fee") cmp = Number(a.travel_fee || 0) - Number(b.travel_fee || 0);
    else cmp = (a.operator_name || "").localeCompare(b.operator_name || "");
    return sortAsc ? cmp : -cmp;
  });

  const bestPrice = Math.min(...quotes.map(q => Number(q.total_quote)));
  const hasVerified = quotes.some(q => q.badges?.includes("fully_verified"));

  return (
    <div className="rounded bg-card border overflow-hidden">
      <div className="px-4 py-2.5 border-b flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">Quotes ({quotes.length})</h3>
        <span className="text-[10px] text-muted-foreground">Best: {formatCurrency(bestPrice)}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b text-left text-[11px] text-muted-foreground">
              <th className="px-4 py-2 font-medium">Operator</th>
              <th className="px-4 py-2 font-medium hidden md:table-cell">Credentials</th>
              <th className="px-4 py-2 font-medium cursor-pointer select-none" onClick={() => toggleSort("total_quote")}>
                <span className="flex items-center gap-1">Total <ArrowUpDown size={10} /></span>
              </th>
              <th className="px-4 py-2 font-medium hidden sm:table-cell">Rate</th>
              <th className="px-4 py-2 font-medium hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("travel_fee")}>
                <span className="flex items-center gap-1">Travel <ArrowUpDown size={10} /></span>
              </th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.map(q => {
              const isBest = Number(q.total_quote) === bestPrice;
              const isAccepted = q.status === "accepted";
              return (
                <tr key={q.id} className={cn(
                  "hover:bg-surface-2 transition-colors",
                  isAccepted && "bg-success/5"
                )}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0">
                        {q.operator_profile_id ? (
                          <Link to={`/operators/${q.operator_profile_id}`} className="font-medium text-primary hover:underline truncate block">{q.operator_name}</Link>
                        ) : (
                          <p className="font-medium truncate">{q.operator_name}</p>
                        )}
                        {q.operator_address && <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><MapPin size={8} /> {q.operator_address}</p>}
                      </div>
                      {isBest && <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5"><Trophy size={8} /> Best</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {(q.badges || []).slice(0, 2).map((b: any) => <VerifiedBadge key={b} type={b} size="sm" showLabel={false} />)}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-bold tabular">{formatCurrency(Number(q.total_quote))}</td>
                  <td className="px-4 py-2.5 hidden sm:table-cell text-muted-foreground tabular">{formatCurrency(Number(q.base_rate))}/{formatPricingModel(q.pricing_model)}</td>
                  <td className="px-4 py-2.5 hidden lg:table-cell text-muted-foreground tabular">{q.travel_fee ? formatCurrency(Number(q.travel_fee)) : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-[10px] font-medium",
                      q.status === "accepted" ? "text-success" :
                      q.status === "declined" ? "text-destructive" :
                      "text-muted-foreground"
                    )}>
                      {q.status === "accepted" ? "✓ Accepted" : q.status === "declined" ? "Declined" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {q.status === "pending" && (
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => acceptMutation.mutate(q.id)} disabled={acceptMutation.isPending}>
                          <Check size={10} className="mr-0.5" /> Accept
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
