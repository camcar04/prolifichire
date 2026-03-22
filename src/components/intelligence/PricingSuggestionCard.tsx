import { DollarSign, TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PricingEstimate } from "@/hooks/useIntelligence";
import { cn } from "@/lib/utils";

interface Props {
  estimate: PricingEstimate | null;
  loading: boolean;
  acreage: number;
}

const likelihoodConfig = {
  high: { label: "High fill likelihood", color: "text-success", bg: "bg-success/10" },
  medium: { label: "Moderate fill likelihood", color: "text-warning", bg: "bg-warning/10" },
  low: { label: "Low fill likelihood", color: "text-destructive", bg: "bg-destructive/10" },
};

export function PricingSuggestionCard({ estimate, loading, acreage }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">AI Pricing Estimate</h3>
        </div>
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 size={16} className="animate-spin mr-2" /> Analyzing pricing factors…
        </div>
      </div>
    );
  }

  if (!estimate) return null;

  const lk = likelihoodConfig[estimate.fill_likelihood] || likelihoodConfig.medium;

  return (
    <div className="rounded-xl bg-card shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">AI Pricing Estimate</h3>
        </div>
        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", lk.bg, lk.color)}>
          {lk.label}
        </span>
      </div>

      {/* Price range bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Low</p>
            <p className="text-sm font-medium tabular">{formatCurrency(estimate.low_estimate)}</p>
            <p className="text-[10px] text-muted-foreground tabular">{formatCurrency(estimate.per_acre.low)}/ac</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">Recommended</p>
            <p className="text-lg font-bold tabular text-primary">{formatCurrency(estimate.recommended_estimate)}</p>
            <p className="text-xs text-primary/70 tabular">{formatCurrency(estimate.per_acre.recommended)}/ac</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">High</p>
            <p className="text-sm font-medium tabular">{formatCurrency(estimate.high_estimate)}</p>
            <p className="text-[10px] text-muted-foreground tabular">{formatCurrency(estimate.per_acre.high)}/ac</p>
          </div>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-muted-foreground/30 via-primary to-muted-foreground/30 rounded-full"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-sm border-t pt-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign size={13} /> Base rate</span>
          <span className="font-medium tabular">{formatCurrency(estimate.base_rate)}/ac</span>
        </div>
        {estimate.travel_cost > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5"><TrendingUp size={13} /> Travel cost</span>
            <span className="font-medium tabular">+{formatCurrency(estimate.travel_cost)}</span>
          </div>
        )}
        {estimate.urgency_adjustment > 0 && (
          <div className="flex justify-between">
            <span className="text-warning flex items-center gap-1.5"><TrendingUp size={13} /> Urgency surcharge</span>
            <span className="font-medium tabular text-warning">+{formatCurrency(estimate.urgency_adjustment)}</span>
          </div>
        )}
        {estimate.clustering_discount > 0 && (
          <div className="flex justify-between">
            <span className="text-success flex items-center gap-1.5"><TrendingDown size={13} /> Route discount</span>
            <span className="font-medium tabular text-success">-{formatCurrency(estimate.clustering_discount)}</span>
          </div>
        )}
      </div>

      {/* AI reasoning */}
      {estimate.reasoning && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <Sparkles size={10} className="inline mr-1 text-primary" />
            {estimate.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
