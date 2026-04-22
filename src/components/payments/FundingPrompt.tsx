import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  deriveAgreedPrice,
  useFundJob,
  isFundingRequired,
  isFundingPending,
} from "@/hooks/usePaymentFlow";
import { FundingStatusBadge } from "./FundingStatusBadge";
import { FeeBreakdown, computeFeeBreakdown } from "./FeeBreakdown";
import { Shield, CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FundingPromptProps {
  job: any;
  isGrowerView: boolean;
}

export function FundingPrompt({ job, isGrowerView }: FundingPromptProps) {
  const fundJob = useFundJob();

  const fundingStatus = (job as any).funding_status || "unfunded";
  const agreedPrice = deriveAgreedPrice(job);
  const needsFunding = isFundingRequired(job);
  const pending = isFundingPending(job);

  // Only growers see the funding prompt
  if (!isGrowerView) {
    return <OperatorFundingView job={job} />;
  }

  // Pending Stripe checkout — grower can resume or restart
  if (pending) {
    const breakdown = agreedPrice ? computeFeeBreakdown(agreedPrice) : null;
    const totalDollars = breakdown ? breakdown.growerChargeCents / 100 : 0;
    return (
      <div className="rounded border border-info/30 bg-info/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-info" />
          <span className="text-sm font-semibold">Payment In Progress</span>
          <FundingStatusBadge status={fundingStatus} />
        </div>
        <p className="text-xs text-muted-foreground">
          A Stripe checkout session is open for this job. Complete the payment to fund the job, or start a new checkout if the session expired.
        </p>
        <Button
          variant="outline"
          className="w-full gap-2"
          disabled={fundJob.isPending || !agreedPrice}
          onClick={() => fundJob.mutate({ jobId: job.id, amount: totalDollars })}
        >
          <CreditCard size={14} />
          {fundJob.isPending ? "Redirecting…" : "Resume / Restart Checkout"}
        </Button>
      </div>
    );
  }

  // Already funded or beyond
  if (!needsFunding) {
    return (
      <div className="rounded border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-success" />
            <span className="text-sm font-medium">Payment Status</span>
          </div>
          <FundingStatusBadge status={fundingStatus} size="md" />
        </div>
        {(job as any).funded_amount && (
          <p className="text-xs text-muted-foreground mt-2">
            {formatCurrency(Number((job as any).funded_amount))} funded
          </p>
        )}
      </div>
    );
  }

  // No agreed price yet
  if (!agreedPrice) {
    return (
      <div className="rounded border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-sm font-medium">Awaiting Price Agreement</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Funding will be required once a price is agreed upon (via acceptance or quote).
        </p>
      </div>
    );
  }

  const breakdown = computeFeeBreakdown(agreedPrice);
  const totalDollars = breakdown.growerChargeCents / 100;

  return (
    <div className="rounded border border-warning/30 bg-warning/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-warning" />
        <span className="text-sm font-semibold">Funding Required</span>
        <FundingStatusBadge status={fundingStatus} />
      </div>

      <p className="text-xs text-muted-foreground">
        Review the full fee breakdown below before funding. Funds are held securely until work is completed and approved.
      </p>

      <FeeBreakdown jobTotal={agreedPrice} side="grower" />

      <div className="space-y-2 pt-1">
        <Button
          className="w-full gap-2"
          disabled={fundJob.isPending}
          onClick={() => fundJob.mutate({ jobId: job.id, amount: totalDollars })}
        >
          <CreditCard size={14} />
          {fundJob.isPending ? "Redirecting…" : `Fund Job — ${formatCurrency(totalDollars)}`}
        </Button>
      </div>
    </div>
  );
}

// ── Operator view of funding status ──
function OperatorFundingView({ job }: { job: any }) {
  const fundingStatus = (job as any).funding_status || "unfunded";
  const agreedPrice = deriveAgreedPrice(job);
  const needsFunding = isFundingRequired(job);

  return (
    <div className={cn(
      "rounded border bg-card p-4",
      needsFunding && "border-warning/30 bg-warning/5",
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Payment Status</span>
        <FundingStatusBadge status={fundingStatus} size="md" />
      </div>

      {agreedPrice ? (
        <div className="space-y-3 text-[13px]">
          <FeeBreakdown jobTotal={agreedPrice} side="operator" />
          {fundingStatus === "funded" && (
            <p className="text-xs text-success mt-1">
              ✓ Job is funded. You may begin work when scheduled.
            </p>
          )}
          {needsFunding && (
            <p className="text-xs text-warning mt-1">
              ⏳ Waiting for grower to fund this job before work can begin.
            </p>
          )}
          {fundingStatus === "pending_payment" && (
            <p className="text-xs text-info mt-1">
              💳 Grower has started payment — waiting for Stripe to confirm.
            </p>
          )}
          {fundingStatus === "payout_ready" && (
            <p className="text-xs text-info mt-1">
              Payout is being processed.
            </p>
          )}
          {fundingStatus === "payout_released" && (
            <p className="text-xs text-success mt-1">
              ✓ Payout has been released to your account.
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Price has not been agreed yet.
        </p>
      )}
    </div>
  );
}

function Clock({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
