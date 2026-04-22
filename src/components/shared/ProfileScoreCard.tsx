import { useProfileScore } from "@/hooks/useProfileScore";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronRight, Square } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileScoreCard({ compact = false }: { compact?: boolean }) {
  const { data: score, isLoading } = useProfileScore();

  // Skeleton until the deterministic score has fully resolved — never render a partial value.
  if (isLoading || !score) {
    if (compact) {
      return (
        <div className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-1.5 flex-1 rounded-full" />
        </div>
      );
    }
    return (
      <div className="rounded bg-card border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    );
  }

  const color = score.total >= 80 ? "text-success" : score.total >= 50 ? "text-warning" : "text-destructive";
  const progressColor = score.total >= 80 ? "bg-success" : score.total >= 50 ? "bg-warning" : "bg-destructive";

  if (compact) {
    return (
      <Link to="/settings?tab=account" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group">
        <div className={cn("text-sm font-bold tabular-nums", color)}>{score.total}%</div>
        <div className="flex-1 min-w-0">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-full rounded-full transition-all", progressColor)} style={{ width: `${score.total}%` }} />
          </div>
        </div>
        <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
      </Link>
    );
  }

  const completedCount = score.checklist.filter((c) => c.done).length;

  return (
    <div className="rounded bg-card border p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Profile Completion</h3>
        <span className={cn("text-lg font-bold tabular-nums", color)}>{score.total}%</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">
        {completedCount} of {score.checklist.length} steps complete
      </p>
      <Progress value={score.total} className="h-2 mb-3" />

      <ol className="space-y-1">
        {score.checklist.map((item, idx) => (
          <li key={item.label}>
            <Link
              to={item.link}
              className={cn(
                "flex items-center gap-2 text-xs rounded px-1.5 py-1.5 -mx-1.5 transition-colors group",
                item.done
                  ? "text-muted-foreground"
                  : "text-foreground hover:bg-surface-2",
              )}
            >
              {item.done ? (
                <CheckCircle2 size={14} className="text-success shrink-0" />
              ) : (
                <Square size={14} className="text-muted-foreground shrink-0" strokeWidth={2} />
              )}
              <span className="text-[11px] font-mono text-muted-foreground tabular-nums shrink-0">{idx + 1}.</span>
              <span className={cn("flex-1 min-w-0 truncate", item.done && "line-through opacity-60")}>
                {item.label}
              </span>
              <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">+{item.weight}%</span>
            </Link>
          </li>
        ))}
      </ol>

      {score.total >= 100 && (
        <div className="flex items-center gap-2 text-xs text-success mt-3 pt-3 border-t">
          <CheckCircle2 size={12} />
          <span>Your profile is complete</span>
        </div>
      )}
    </div>
  );
}
