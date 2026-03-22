import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { JobQualityResult } from "@/hooks/useTrustSystem";

interface JobQualityIndicatorProps {
  quality: JobQualityResult;
  compact?: boolean;
  className?: string;
}

export function JobQualityIndicator({ quality, compact = false, className }: JobQualityIndicatorProps) {
  const { score, missing, valid } = quality;

  if (compact) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium",
        valid ? "text-green-700" : score >= 70 ? "text-amber-700" : "text-destructive",
        className,
      )}>
        {valid ? <CheckCircle2 size={10} /> : score >= 70 ? <AlertTriangle size={10} /> : <XCircle size={10} />}
        {valid ? "Complete" : `${missing.length} missing`}
      </span>
    );
  }

  return (
    <div className={cn("rounded border bg-card", className)}>
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Posting Quality
        </h3>
        <span className={cn(
          "text-[11px] font-bold tabular-nums",
          valid ? "text-green-700" : score >= 70 ? "text-amber-700" : "text-destructive",
        )}>
          {score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-3 pt-2">
        <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              valid ? "bg-green-600" : score >= 70 ? "bg-amber-500" : "bg-destructive"
            )}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {missing.length > 0 && (
        <div className="px-3 py-2 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground">Missing:</p>
          {missing.map(m => (
            <p key={m} className="text-[10px] text-destructive flex items-center gap-1.5">
              <XCircle size={9} className="shrink-0" /> {m}
            </p>
          ))}
        </div>
      )}

      {valid && (
        <div className="px-3 py-2">
          <p className="text-[10px] text-green-700 flex items-center gap-1.5">
            <CheckCircle2 size={10} /> All required information present
          </p>
        </div>
      )}
    </div>
  );
}
