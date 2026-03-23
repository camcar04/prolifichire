import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import {
  deriveAgreedPrice,
  calculatePlatformFee,
  useFundJob,
  isFundingRequired,
} from "@/hooks/usePaymentFlow";
import { FundingStatusBadge } from "./FundingStatusBadge";
import { DollarSign, Shield, CreditCard, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FundingPromptProps {
  job: any;
  isGrowerView: boolean;
}

export function FundingPrompt({ job, isGrowerView }: FundingPromptProps) {
  const fundJob = useFundJob();
  const [confirming, setConfirming] = useState(false);

  const fundingStatus = (job as any).funding_status || "unfunded";
  const agreedPrice = deriveAgreedPrice(job);
  const needsFunding = isFundingRequired(job);

  // Only growers see the funding prompt
  if (!isGrowerView) {
    return <OperatorFundingView job={job} />;
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

  const { platformFee, operatorPayout, total } = calculatePlatformFee(
    agreedPrice,
    Number((job as any).platform_fee_rate || 0.05)
  );

  return (
    <div className="rounded border border-warning/30 bg-warning/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} className="text-warning" />
        <span className="text-sm font-semibold">Funding Required</span>
        <FundingStatusBadge status={fundingStatus} />
      </div>

      <p className="text-xs text-muted-foreground">
        Fund this job so the operator can begin work. Funds are held securely until work is completed and approved.
      </p>

      <div className="space-y-1 text-[13px]">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Agreed Price</span>
          <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform Fee (5%)</span>
          <span className="tabular-nums text-muted-foreground">{formatCurrency(platformFee)}</span>
        </div>
        <div className="border-t pt-1 flex justify-between font-semibold">
          <span>Operator Payout</span>
          <span className="tabular-nums">{formatCurrency(operatorPayout)}</span>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-start gap-2 text-[11px] text-muted-foreground">
          <Shield size={12} className="shrink-0 mt-0.5" />
          <span>Funds are held until you approve completed work. Full refund if job is cancelled before work begins.</span>
        </div>

        {!confirming ? (
          <Button
            className="w-full gap-2"
            onClick={() => setConfirming(true)}
          >
            <CreditCard size={14} />
            Fund Job — {formatCurrency(total)}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-medium text-center">
              Confirm funding of {formatCurrency(total)}?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1"
                disabled={fundJob.isPending}
                onClick={() =>
                  fundJob.mutate({ jobId: job.id, amount: total })
                }
              >
                <DollarSign size={12} />
                {fundJob.isPending ? "Processing…" : "Confirm & Fund"}
              </Button>
            </div>
          </div>
        )}
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
        <div className="space-y-1 text-[13px]">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Agreed Price</span>
            <span className="font-semibold tabular-nums">{formatCurrency(agreedPrice)}</span>
          </div>
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
