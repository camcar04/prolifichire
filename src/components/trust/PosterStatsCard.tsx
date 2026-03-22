import { cn } from "@/lib/utils";
import { TrustBadge } from "./TrustBadge";
import { usePosterStats, deriveTrustLevel } from "@/hooks/useTrustSystem";
import { CheckCircle2, XCircle, FileText, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface PosterStatsCardProps {
  userId: string;
  compact?: boolean;
  className?: string;
}

export function PosterStatsCard({ userId, compact = false, className }: PosterStatsCardProps) {
  const { data: stats, isLoading } = usePosterStats(userId);
  const trustLevel = deriveTrustLevel(stats || null);

  if (isLoading || !stats) return null;

  const completionRate = stats.total_posted > 0
    ? Math.round(((stats.total_completed) / stats.total_posted) * 100)
    : 0;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-[10px]", className)}>
        <TrustBadge level={trustLevel} size="sm" />
        <span className="text-muted-foreground tabular-nums">
          {stats.total_completed} completed · {completionRate}% rate
        </span>
      </div>
    );
  }

  return (
    <div className={cn("rounded border bg-card", className)}>
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Poster History
        </h3>
        <TrustBadge level={trustLevel} size="sm" showLabel />
      </div>
      <div className="grid grid-cols-2 gap-px bg-border">
        {[
          { icon: FileText, label: "Posted", value: stats.total_posted },
          { icon: CheckCircle2, label: "Completed", value: stats.total_completed },
          { icon: XCircle, label: "Cancelled", value: stats.total_cancelled },
          { icon: DollarSign, label: "Total Paid", value: formatCurrency(Number(stats.total_paid)) },
        ].map(s => (
          <div key={s.label} className="bg-card px-3 py-2">
            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
              <s.icon size={9} />{s.label}
            </p>
            <p className="text-[13px] font-bold tabular-nums mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>
      {completionRate > 0 && (
        <div className="px-3 py-2 border-t">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className={cn(
              "font-bold tabular-nums",
              completionRate >= 90 ? "text-green-700" :
              completionRate >= 70 ? "text-amber-700" : "text-destructive"
            )}>{completionRate}%</span>
          </div>
          <div className="h-1 bg-surface-2 rounded-full mt-1 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completionRate >= 90 ? "bg-green-600" :
                completionRate >= 70 ? "bg-amber-500" : "bg-destructive"
              )}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
