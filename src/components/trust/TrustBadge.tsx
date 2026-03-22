import { cn } from "@/lib/utils";
import { ShieldCheck, Shield, Star, UserCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TrustLevel } from "@/hooks/useTrustSystem";

const TRUST_CONFIG: Record<TrustLevel, { icon: typeof Shield; label: string; color: string; description: string }> = {
  new: {
    icon: Shield,
    label: "New Poster",
    color: "text-muted-foreground bg-muted/50 border-border",
    description: "Recently joined the platform",
  },
  active: {
    icon: UserCheck,
    label: "Active Poster",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    description: "Has posted and completed jobs",
  },
  trusted: {
    icon: Star,
    label: "Trusted Poster",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    description: "Consistent job completion with low cancellation",
  },
  verified: {
    icon: ShieldCheck,
    label: "Verified Poster",
    color: "text-primary bg-primary/8 border-primary/20",
    description: "Proven track record of reliable job postings",
  },
};

interface TrustBadgeProps {
  level: TrustLevel;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function TrustBadge({ level, size = "sm", showLabel = false }: TrustBadgeProps) {
  const config = TRUST_CONFIG[level];
  const Icon = config.icon;

  const badge = (
    <span className={cn(
      "inline-flex items-center gap-1 rounded border font-medium",
      config.color,
      size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
    )}>
      <Icon size={size === "sm" ? 10 : 12} />
      {showLabel && config.label}
    </span>
  );

  if (!showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs font-medium">{config.label}</p>
          <p className="text-[10px] text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
