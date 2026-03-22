import { useMemo } from "react";
import { useOperatorPricingProfile, estimateJobCost, type JobCostEstimate } from "@/hooks/useOperatorPricing";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Calculator, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Fuel, Truck, DollarSign, Target,
} from "lucide-react";
import { Link } from "react-router-dom";

interface PrivateCostCalculatorProps {
  job: any;
  compact?: boolean;
}

const VERDICT_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  profitable: { label: "Profitable", color: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle2, bg: "bg-emerald-500/10" },
  low_margin: { label: "Low Margin", color: "text-amber-700 dark:text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10" },
  below_target: { label: "Below Target", color: "text-orange-700 dark:text-orange-400", icon: TrendingDown, bg: "bg-orange-500/10" },
  counter_recommended: { label: "Counter Recommended", color: "text-red-700 dark:text-red-400", icon: TrendingDown, bg: "bg-red-500/10" },
};

export function PrivateCostCalculator({ job, compact = false }: PrivateCostCalculatorProps) {
  const { data: profile, isLoading } = useOperatorPricingProfile();

  const estimate = useMemo(() => {
    if (!profile) return null;
    return estimateJobCost(job, profile);
  }, [job, profile]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed p-3 animate-pulse">
        <div className="h-3 bg-muted rounded w-24 mb-2" />
        <div className="h-6 bg-muted rounded w-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/30 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Calculator size={13} className="text-muted-foreground" />
          <p className="text-[11px] font-semibold text-muted-foreground">Private Costing</p>
        </div>
        <p className="text-[11px] text-muted-foreground mb-2">
          Set up your pricing profile to see private cost estimates on every job.
        </p>
        <Link
          to="/settings?tab=dowork"
          className="text-[11px] text-primary font-medium hover:underline"
        >
          Set Up Pricing →
        </Link>
      </div>
    );
  }

  if (!estimate) return null;

  const v = VERDICT_CONFIG[estimate.verdict];
  const VerdictIcon = v.icon;
  const postedTotal = Number(job.estimated_total || 0);

  if (compact) {
    return (
      <div className={cn("rounded-lg border p-2.5", v.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <VerdictIcon size={12} className={v.color} />
            <span className={cn("text-[11px] font-semibold", v.color)}>{v.label}</span>
          </div>
          <span className="text-[11px] font-bold tabular-nums">
            {estimate.marginPct > 0 ? "+" : ""}{estimate.marginPct}% margin
          </span>
        </div>
        {postedTotal > 0 && (
          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
            <span>Cost: {formatCurrency(estimate.internalCost)}</span>
            <span>Profit: {formatCurrency(estimate.expectedProfit)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-[11px] font-semibold flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
          <Calculator size={11} /> Private Costing
        </h3>
        <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Only you see this</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Verdict banner */}
        <div className={cn("rounded-md p-2.5 flex items-center gap-2", v.bg)}>
          <VerdictIcon size={16} className={v.color} />
          <div>
            <p className={cn("text-[12px] font-bold", v.color)}>{v.label}</p>
            <p className="text-[10px] text-muted-foreground">
              {estimate.verdict === "profitable" && "This job meets your margin targets."}
              {estimate.verdict === "low_margin" && "Margin is below your target but still positive."}
              {estimate.verdict === "below_target" && "Consider if the volume or relationship justifies the low margin."}
              {estimate.verdict === "counter_recommended" && "Posted price is below your cost. Submit a counter-quote."}
            </p>
          </div>
        </div>

        {/* Key numbers */}
        <div className="grid grid-cols-2 gap-2">
          {postedTotal > 0 && (
            <NumberBlock label="Posted Payout" value={formatCurrency(postedTotal)} icon={DollarSign} />
          )}
          <NumberBlock label="Your Est. Cost" value={formatCurrency(estimate.internalCost)} icon={Calculator} muted />
          <NumberBlock label="Recommended Quote" value={formatCurrency(estimate.recommendedQuote)} icon={Target} highlight />
          <NumberBlock
            label="Expected Profit"
            value={formatCurrency(estimate.expectedProfit)}
            icon={estimate.expectedProfit >= 0 ? TrendingUp : TrendingDown}
            positive={estimate.expectedProfit >= 0}
          />
        </div>

        {/* Cost breakdown */}
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cost Breakdown</p>
          <div className="space-y-1">
            <CostRow label="Field work" value={estimate.costBreakdown.fieldWork} total={estimate.internalCost} />
            <CostRow label="Travel (round trip)" value={estimate.costBreakdown.travel} total={estimate.internalCost} />
            <CostRow label="Fuel surcharge" value={estimate.costBreakdown.fuel} total={estimate.internalCost} />
            <CostRow label="Labor" value={estimate.costBreakdown.labor} total={estimate.internalCost} />
          </div>
        </div>

        {/* Margin gauge */}
        <div>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-muted-foreground">Margin</span>
            <span className={cn("font-bold tabular-nums", estimate.marginPct >= 20 ? "text-emerald-600" : estimate.marginPct >= 10 ? "text-amber-600" : "text-red-600")}>
              {estimate.marginPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                estimate.marginPct >= 20 ? "bg-emerald-500" : estimate.marginPct >= 10 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${Math.min(Math.max(estimate.marginPct, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
            <span>0%</span>
            <span>Target: {profile?.desired_margin_pct || 20}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberBlock({ label, value, icon: Icon, muted, highlight, positive }: {
  label: string; value: string; icon: any; muted?: boolean; highlight?: boolean; positive?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-md p-2 border",
      highlight ? "border-primary/30 bg-primary/5" : "border-transparent bg-surface-2/50"
    )}>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon size={10} className={cn(
          muted ? "text-muted-foreground" :
          highlight ? "text-primary" :
          positive === false ? "text-red-500" :
          positive === true ? "text-emerald-500" :
          "text-foreground"
        )} />
        <p className="text-[9px] text-muted-foreground font-medium">{label}</p>
      </div>
      <p className={cn(
        "text-[14px] font-bold tabular-nums",
        muted && "text-muted-foreground",
        highlight && "text-primary",
        positive === false && "text-red-600",
        positive === true && "text-emerald-600"
      )}>
        {value}
      </p>
    </div>
  );
}

function CostRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  if (value <= 0) return null;
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-muted-foreground flex-1">{label}</span>
      <span className="tabular-nums font-medium w-16 text-right">{formatCurrency(value)}</span>
      <span className="text-[9px] text-muted-foreground w-8 text-right tabular-nums">{pct.toFixed(0)}%</span>
    </div>
  );
}
