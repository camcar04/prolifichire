import { useAuth } from "@/contexts/AuthContext";
import { useJobs } from "@/hooks/useJobs";
import { useAllJobActuals, computeServiceInsights } from "@/hooks/useJobActuals";
import { formatCurrency, formatOperationType } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function PricingInsightsPanel() {
  const { user } = useAuth();
  const { data: allJobs = [] } = useJobs();
  const { data: allActuals = [] } = useAllJobActuals();

  const myJobs = allJobs.filter((j) => j.operator_id === user?.id);
  const completedJobs = myJobs.filter((j) =>
    ["completed", "approved", "paid", "closed"].includes(j.status)
  );

  const insights = computeServiceInsights(completedJobs, allActuals);
  const reviewedCount = allActuals.length;

  if (completedJobs.length === 0) return null;

  const totalRevenue = insights.reduce((s, i) => s + i.totalRevenue, 0);
  const totalCost = insights.reduce((s, i) => s + i.totalCost, 0);
  const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  // Find best and worst performing service types
  const sorted = [...insights].sort((a, b) => b.avgMargin - a.avgMargin);
  const best = sorted[0];
  const worst = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  // Jobs needing review
  const unreviewed = completedJobs.filter(
    (j) => !allActuals.some((a) => a.job_id === j.id)
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-surface-2/50">
        <div className="flex items-center gap-1.5">
          <BarChart3 size={11} className="text-muted-foreground" />
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Pricing Insights
          </h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Private</span>
        </div>
      </div>

      <div className="p-3 space-y-3">
        {/* Overall stats */}
        <div className="flex items-stretch gap-3">
          <div className="flex-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Reviewed</p>
            <p className="text-lg font-bold tabular-nums">{reviewedCount}<span className="text-[10px] text-muted-foreground font-normal">/{completedJobs.length}</span></p>
          </div>
          {reviewedCount > 0 && (
            <>
              <div className="border-l" />
              <div className="flex-1">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Avg Margin</p>
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  overallMargin >= 20 ? "text-emerald-600" : overallMargin >= 10 ? "text-amber-600" : "text-destructive"
                )}>
                  {overallMargin.toFixed(1)}%
                </p>
              </div>
            </>
          )}
        </div>

        {/* Service breakdown */}
        {insights.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">By Service</p>
            {sorted.map((s) => (
              <div key={s.serviceType} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 text-[11px]">
                <span className="font-medium">{formatOperationType(s.serviceType)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums">{s.jobCount} jobs</span>
                  <span className={cn(
                    "font-semibold tabular-nums min-w-[48px] text-right",
                    s.avgMargin >= 20 ? "text-emerald-600" : s.avgMargin >= 10 ? "text-amber-600" : "text-destructive"
                  )}>
                    {s.avgMargin.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick insights */}
        {best && reviewedCount >= 2 && (
          <div className="space-y-1 text-[10px]">
            <div className="flex items-start gap-1.5 text-emerald-700">
              <TrendingUp size={10} className="mt-0.5 shrink-0" />
              <span><strong>{formatOperationType(best.serviceType)}</strong> is your best margin at {best.avgMargin.toFixed(0)}%</span>
            </div>
            {worst && worst.avgMargin < 15 && (
              <div className="flex items-start gap-1.5 text-amber-700">
                <TrendingDown size={10} className="mt-0.5 shrink-0" />
                <span><strong>{formatOperationType(worst.serviceType)}</strong> averages {worst.avgMargin.toFixed(0)}% — consider adjusting rates</span>
              </div>
            )}
          </div>
        )}

        {/* Unreviewed prompt */}
        {unreviewed.length > 0 && (
          <div className="rounded-md bg-amber-500/10 px-2.5 py-2 text-[10px] text-amber-700">
            <strong>{unreviewed.length}</strong> completed job{unreviewed.length > 1 ? "s" : ""} not yet reviewed.{" "}
            <Link to={`/jobs/${unreviewed[0].id}`} className="underline font-medium">
              Review now <ArrowRight size={9} className="inline" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
