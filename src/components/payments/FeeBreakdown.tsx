import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

/**
 * FeeBreakdown
 *
 * Transparent split-fee display for the ProlificHire payment model.
 *
 * Fee math (must match supabase/functions/stripe-checkout/index.ts):
 *   - Grower pays:   job total + 7.5% grower platform fee + Stripe processing
 *                    (2.9% + $0.30 of the grower's gross charge)
 *   - Operator gets: job total − 7.5% operator platform fee
 *   - Platform earns: 7.5% from each side − Stripe fee absorbed by platform
 */

export const PLATFORM_FEE_RATE = 0.075;       // 7.5% per side
export const STRIPE_PERCENT_FEE = 0.029;      // 2.9%
export const STRIPE_FIXED_FEE_CENTS = 30;     // $0.30

export interface FeeBreakdownNumbers {
  jobTotalCents: number;
  growerPlatformFeeCents: number;
  operatorPlatformFeeCents: number;
  stripeFeeCents: number;
  growerChargeCents: number;
  operatorPayoutCents: number;
  platformRevenueCents: number;
}

/**
 * Single source of truth for the split-fee math. Mirror of the edge function.
 */
export function computeFeeBreakdown(jobTotal: number): FeeBreakdownNumbers {
  const jobTotalCents = Math.round(jobTotal * 100);
  const growerPlatformFeeCents = Math.round(jobTotalCents * PLATFORM_FEE_RATE);
  const operatorPlatformFeeCents = Math.round(jobTotalCents * PLATFORM_FEE_RATE);
  const growerChargeCents = jobTotalCents + growerPlatformFeeCents;
  const stripeFeeCents =
    Math.round(growerChargeCents * STRIPE_PERCENT_FEE) + STRIPE_FIXED_FEE_CENTS;
  const operatorPayoutCents = jobTotalCents - operatorPlatformFeeCents;
  const platformRevenueCents =
    growerPlatformFeeCents + operatorPlatformFeeCents - stripeFeeCents;

  return {
    jobTotalCents,
    growerPlatformFeeCents,
    operatorPlatformFeeCents,
    stripeFeeCents,
    growerChargeCents,
    operatorPayoutCents,
    platformRevenueCents,
  };
}

const fmt = (cents: number) => formatCurrency(cents / 100);

interface FeeBreakdownProps {
  jobTotal: number;
  /** Which side of the split to display. Both sides MUST be shown before any payment action. */
  side: "grower" | "operator";
  className?: string;
  /** Optional override; defaults to USD. Currency conversion is not yet supported. */
  currency?: string;
}

export function FeeBreakdown({ jobTotal, side, className, currency = "USD" }: FeeBreakdownProps) {
  if (currency !== "USD") {
    // Defensive — keep callers honest while we are USD-only.
    console.warn(`FeeBreakdown received unsupported currency '${currency}', rendering as USD.`);
  }

  const f = computeFeeBreakdown(jobTotal);

  if (side === "grower") {
    return (
      <div className={cn("rounded-lg border bg-card p-4 space-y-2", className)}>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={14} className="text-primary" />
          <h3 className="text-sm font-semibold">Your fee breakdown</h3>
        </div>
        <Row label="Job Total" value={fmt(f.jobTotalCents)} />
        <Row
          label="Platform fee (7.5%)"
          value={`+${fmt(f.growerPlatformFeeCents)}`}
          muted
        />
        <Row
          label="Stripe processing fee"
          value={`+${fmt(f.stripeFeeCents)}`}
          muted
        />
        <div className="border-t pt-2 mt-1">
          <Row
            label="You pay total"
            value={fmt(f.growerChargeCents)}
            bold
          />
        </div>
        <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
          Funds are held securely until you approve completed work. Full refund if the job is cancelled before work begins.
        </p>
      </div>
    );
  }

  // Operator view
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-2", className)}>
      <div className="flex items-center gap-2 mb-1">
        <Shield size={14} className="text-primary" />
        <h3 className="text-sm font-semibold">Your payout breakdown</h3>
      </div>
      <Row label="Job Total" value={fmt(f.jobTotalCents)} />
      <Row
        label="Platform fee (7.5%)"
        value={`−${fmt(f.operatorPlatformFeeCents)}`}
        muted
      />
      <div className="border-t pt-2 mt-1">
        <Row
          label="You receive"
          value={fmt(f.operatorPayoutCents)}
          bold
        />
      </div>
      <p className="text-[11px] text-muted-foreground pt-1 leading-relaxed">
        Stripe processing fees are absorbed by the platform — you get the full amount above once the grower approves your work.
      </p>
    </div>
  );
}

function Row({ label, value, muted, bold }: { label: string; value: string; muted?: boolean; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className={cn(muted ? "text-muted-foreground" : "", bold && "font-semibold text-foreground")}>
        {label}
      </span>
      <span
        className={cn(
          "tabular-nums",
          muted ? "text-muted-foreground" : "",
          bold && "font-semibold text-foreground text-base"
        )}
      >
        {value}
      </span>
    </div>
  );
}