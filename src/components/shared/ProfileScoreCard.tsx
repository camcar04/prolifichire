import { useProfileScore } from "@/hooks/useProfileScore";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function ProfileScoreCard({ compact = false }: { compact?: boolean }) {
  const { data: score, isLoading } = useProfileScore();

  if (isLoading || !score) return null;

  const color = score.total >= 80 ? "text-success" : score.total >= 50 ? "text-warning" : "text-destructive";
  const progressColor = score.total >= 80 ? "bg-success" : score.total >= 50 ? "bg-warning" : "bg-destructive";

  if (compact) {
    return (
      <Link to="/settings?tab=profile" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-2 transition-colors group">
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

  return (
    <div className="rounded-lg bg-card border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Profile Completion</h3>
        <span className={cn("text-lg font-bold tabular-nums", color)}>{score.total}%</span>
      </div>
      <Progress value={score.total} className="h-2 mb-3" />

      {score.missing.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">Missing items</p>
          {score.missing.slice(0, 4).map(item => (
            <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertTriangle size={11} className="text-warning shrink-0" />
              <span>{item}</span>
            </div>
          ))}
          {score.missing.length > 4 && (
            <p className="text-[11px] text-muted-foreground">+{score.missing.length - 4} more</p>
          )}
        </div>
      )}

      {score.total >= 80 && (
        <div className="flex items-center gap-2 text-xs text-success">
          <CheckCircle2 size={12} />
          <span>Profile is well-configured</span>
        </div>
      )}
    </div>
  );
}
