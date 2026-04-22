import { cn } from "@/lib/utils";
import { FUNDING_LABELS, FUNDING_COLORS } from "@/hooks/usePaymentFlow";
import { DollarSign, Shield, AlertTriangle, CheckCircle2, Clock, Ban } from "lucide-react";

const FUNDING_ICONS: Record<string, React.ElementType> = {
  not_required: Shield,
  unfunded: Clock,
  funding_required: AlertTriangle,
  pending_payment: Clock,
  funded: CheckCircle2,
  payout_ready: DollarSign,
  payout_released: CheckCircle2,
  disputed: AlertTriangle,
  refunded: Ban,
  cancelled: Ban,
};

export function FundingStatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const label = FUNDING_LABELS[status] || status;
  const color = FUNDING_COLORS[status] || "text-muted-foreground";
  const Icon = FUNDING_ICONS[status] || Clock;
  const isSm = size === "sm";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-medium rounded border px-2 py-0.5",
      isSm ? "text-[10px]" : "text-xs",
      color,
      status === "funded" && "bg-success/10 border-success/20",
      status === "funding_required" && "bg-warning/10 border-warning/20",
      status === "pending_payment" && "bg-info/10 border-info/20",
      status === "payout_released" && "bg-success/10 border-success/20",
      status === "disputed" && "bg-destructive/10 border-destructive/20",
      !["funded", "funding_required", "pending_payment", "payout_released", "disputed"].includes(status) && "bg-muted/50 border-border",
    )}>
      <Icon size={isSm ? 10 : 12} />
      {label}
    </span>
  );
}
