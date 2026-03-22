import { Link } from "react-router-dom";
import { Sparkles, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { JobRecommendation } from "@/hooks/useIntelligence";
import { formatCurrency, formatAcres, formatOperationType } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  recommendations: JobRecommendation[];
  loading: boolean;
  title?: string;
}

export function RecommendedJobsPanel({ recommendations, loading, title = "Recommended for You" }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl bg-card shadow-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
          <Loader2 size={16} className="animate-spin mr-2" /> Finding best matches…
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="rounded-xl bg-card shadow-card">
      <div className="p-4 border-b flex items-center gap-2">
        <Sparkles size={16} className="text-primary" />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-[10px] text-primary bg-primary/8 px-1.5 py-0.5 rounded-full font-medium ml-1">AI</span>
      </div>
      <div className="divide-y">
        {recommendations.slice(0, 5).map((rec) => (
          <Link
            key={rec.job_id}
            to={`/jobs/${rec.job_id}`}
            className="flex gap-3 p-4 hover:bg-surface-2 transition-colors"
          >
            {/* Score badge */}
            <div className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold",
              rec.score >= 80 ? "bg-success/10 text-success" :
              rec.score >= 60 ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            )}>
              {rec.score}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium truncate">{rec.job?.title || rec.job?.display_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {rec.job?.field_name} · {formatOperationType(rec.job?.operation_type || "")} · {formatAcres(rec.job?.total_acres || 0)}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular shrink-0">{formatCurrency(rec.job?.estimated_total || 0)}</span>
              </div>

              {/* Reason tags */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {rec.reasons.map((r, i) => (
                  <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted-foreground">
                    {r}
                  </span>
                ))}
              </div>

              {rec.job?.distance_miles != null && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-muted-foreground">
                  <MapPin size={10} /> {rec.job.distance_miles} mi away
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      <div className="p-3 border-t">
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
          <Link to="/marketplace">View all opportunities <ArrowRight size={14} /></Link>
        </Button>
      </div>
    </div>
  );
}
