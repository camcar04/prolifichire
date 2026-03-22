import { cn } from "@/lib/utils";
import { ShieldCheck, Truck, Beaker, FileCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type BadgeType = "fully_verified" | "cdl_verified" | "licensed_applicator" | "insurance_verified";

const BADGE_CONFIG: Record<BadgeType, { icon: typeof ShieldCheck; label: string; color: string }> = {
  fully_verified: { icon: ShieldCheck, label: "Fully Verified", color: "text-primary bg-primary/10 border-primary/20" },
  cdl_verified: { icon: Truck, label: "CDL Verified", color: "text-blue-600 bg-blue-50 border-blue-200" },
  licensed_applicator: { icon: Beaker, label: "Licensed Applicator", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  insurance_verified: { icon: FileCheck, label: "Insurance Verified", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

interface VerifiedBadgeProps {
  type: BadgeType;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function VerifiedBadge({ type, size = "sm", showLabel = true }: VerifiedBadgeProps) {
  const config = BADGE_CONFIG[type];
  const Icon = config.icon;

  const badge = (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
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
        <TooltipContent side="top"><p className="text-xs">{config.label}</p></TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

export function deriveBadges(credentials: Array<{ type: string; is_verified: boolean; status: string; expires_at?: string | null; name?: string }>): BadgeType[] {
  const badges: BadgeType[] = [];
  const now = new Date();

  const verified = credentials.filter(c => c.is_verified && c.status === "verified" && (!c.expires_at || new Date(c.expires_at) > now));

  if (verified.some(c => c.name?.toLowerCase().includes("cdl"))) badges.push("cdl_verified");
  if (verified.some(c => c.type === "license")) badges.push("licensed_applicator");
  if (verified.some(c => c.type === "insurance")) badges.push("insurance_verified");
  if (badges.length >= 2) badges.unshift("fully_verified");

  return [...new Set(badges)];
}

// Overload for raw credential rows
export function deriveBadgesFromRows(credentials: Array<{ type: string; is_verified: boolean; status: string; expires_at?: string | null; name: string }>): BadgeType[] {
  const badges: BadgeType[] = [];
  const now = new Date();

  const verified = credentials.filter(c =>
    c.is_verified && c.status === "verified" && (!c.expires_at || new Date(c.expires_at) > now)
  );

  const hasCDL = verified.some(c => c.name.toLowerCase().includes("cdl"));
  const hasLicense = verified.some(c => c.type === "license" || c.type === "certification");
  const hasInsurance = verified.some(c => c.type === "insurance");

  if (hasCDL) badges.push("cdl_verified");
  if (hasLicense) badges.push("licensed_applicator");
  if (hasInsurance) badges.push("insurance_verified");
  if (badges.length >= 2) badges.unshift("fully_verified");

  return [...new Set(badges)];
}
