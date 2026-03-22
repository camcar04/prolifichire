import { useProfileScore } from "@/hooks/useProfileScore";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const MISSING_ITEM_LINKS: Record<string, { link: string; label: string }> = {
  "Full name": { link: "/settings?tab=profile", label: "Add your name" },
  "Farm created": { link: "/fields", label: "Create a farm" },
  "Farm state": { link: "/fields", label: "Set farm state" },
  "Farm county": { link: "/fields", label: "Set farm county" },
  "At least one field": { link: "/fields", label: "Add a field" },
  "Field boundary": { link: "/fields", label: "Add field boundary" },
  "Field location": { link: "/fields", label: "Set field location" },
  "Operator profile": { link: "/settings?tab=account", label: "Complete operator profile" },
  "Base location": { link: "/settings?tab=account", label: "Set base location" },
  "Service radius": { link: "/settings?tab=account", label: "Set service radius" },
  "Service types": { link: "/settings?tab=account", label: "Select service types" },
  "At least one equipment record": { link: "/settings?tab=account", label: "Add equipment" },
  "Insurance documentation": { link: "/settings?tab=account", label: "Upload insurance" },
  "License or certification": { link: "/settings?tab=account", label: "Add license" },
  "Credentials (insurance, license)": { link: "/settings?tab=account", label: "Add credentials" },
};

function getItemAction(item: string) {
  return MISSING_ITEM_LINKS[item] || { link: "/settings?tab=account", label: item };
}

export function ProfileScoreCard({ compact = false }: { compact?: boolean }) {
  const { data: score, isLoading } = useProfileScore();
  const { activeMode } = useAuth();

  if (isLoading || !score) return null;

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

  return (
    <div className="rounded-lg bg-card border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Profile Completion</h3>
        <span className={cn("text-lg font-bold tabular-nums", color)}>{score.total}%</span>
      </div>
      <Progress value={score.total} className="h-2 mb-3" />

      {score.missing.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5">Complete to unlock features</p>
          {score.missing.slice(0, 4).map(item => {
            const action = getItemAction(item);
            return (
              <Link
                key={item}
                to={action.link}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-2 rounded px-1.5 py-1 -mx-1.5 transition-colors group"
              >
                <AlertTriangle size={11} className="text-warning shrink-0" />
                <span className="flex-1 min-w-0 truncate">{action.label}</span>
                <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            );
          })}
          {score.missing.length > 4 && (
            <Link to="/settings?tab=account" className="text-[11px] text-primary hover:underline block mt-1">
              +{score.missing.length - 4} more items →
            </Link>
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
