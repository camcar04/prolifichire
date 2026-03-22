import { cn } from "@/lib/utils";
import { ShieldCheck, CheckCircle2, Repeat, Award } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type JobBadgeType = "verified" | "complete_posting" | "repeat_poster" | "high_completion";

const BADGE_CONFIG: Record<JobBadgeType, { icon: typeof ShieldCheck; label: string; color: string; tip: string }> = {
  verified: {
    icon: ShieldCheck,
    label: "Verified Job",
    color: "text-primary bg-primary/8 border-primary/20",
    tip: "Poster confirmed this is a real job",
  },
  complete_posting: {
    icon: CheckCircle2,
    label: "Complete",
    color: "text-green-700 bg-green-50 border-green-200",
    tip: "All required job details are present",
  },
  repeat_poster: {
    icon: Repeat,
    label: "Repeat Poster",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    tip: "This poster has completed multiple jobs",
  },
  high_completion: {
    icon: Award,
    label: "High Completion",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    tip: "Poster has 90%+ job completion rate",
  },
};

interface VerifiedJobBadgeProps {
  type: JobBadgeType;
  size?: "sm" | "md";
}

export function VerifiedJobBadge({ type, size = "sm" }: VerifiedJobBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center gap-0.5 rounded border font-medium cursor-default",
          config.color,
          size === "sm" ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[10px]"
        )}>
          <Icon size={size === "sm" ? 8 : 10} />
          {size === "md" && config.label}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-xs font-medium">{config.label}</p>
        <p className="text-[10px] text-muted-foreground">{config.tip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Derive which badges a job should show
export function deriveJobBadges(job: any, posterStats: any): JobBadgeType[] {
  const badges: JobBadgeType[] = [];

  // Check if confirmed
  if (job._confirmed) badges.push("verified");

  // Check posting quality
  const hasField = job.job_fields?.length > 0;
  const hasRate = Number(job.base_rate) > 0;
  const hasAcres = Number(job.total_acres) > 0;
  if (hasField && hasRate && hasAcres && job.deadline) {
    badges.push("complete_posting");
  }

  if (posterStats) {
    if (posterStats.total_completed >= 3) badges.push("repeat_poster");
    const rate = posterStats.total_posted > 0
      ? posterStats.total_completed / posterStats.total_posted
      : 0;
    if (rate >= 0.9 && posterStats.total_completed >= 5) badges.push("high_completion");
  }

  return badges;
}
