import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, CheckCircle2, AlertTriangle, ExternalLink, Loader2, XCircle,
} from "lucide-react";

/**
 * Stripe Connect account status — returned by stripe-account-status edge function.
 *
 * V2 fields:
 * - ready_to_receive_payments: true when stripe_transfers capability is active
 * - onboarding_complete: true when no currently_due or past_due requirements
 * - transfers_status: "active" | "pending" | etc.
 * - requirements_status: "currently_due" | "past_due" | "met" | etc.
 *
 * Legacy V1 compatibility fields (always present for backwards compat):
 * - charges_enabled, payouts_enabled, details_submitted
 */
interface StripeStatus {
  has_account: boolean;
  account_id?: string;
  // V2 status fields
  ready_to_receive_payments: boolean;
  onboarding_complete: boolean;
  transfers_status?: string;
  requirements_status?: string;
  // Requirements detail
  requirements?: {
    currently_due: string[];
    past_due: string[];
  } | null;
  // Legacy V1 compat
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
}

export function StripeConnectOnboarding() {
  const { session } = useAuth();
  const [starting, setStarting] = useState(false);

  /**
   * Fetch live status from Stripe via our edge function.
   * The function uses V2 API: stripeClient.v2.core.accounts.retrieve()
   * with include: ["configuration.recipient", "requirements"]
   * to get real-time onboarding status without database caching.
   */
  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery<StripeStatus>({
    queryKey: ["stripe-account-status"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "stripe-account-status"
      );
      if (error) throw error;
      return data as StripeStatus;
    },
    refetchOnWindowFocus: true,
  });

  /**
   * Start onboarding — creates V2 account + generates V2 account link.
   * The edge function uses:
   * - stripeClient.v2.core.accounts.create() for account creation
   * - stripeClient.v2.core.accountLinks.create() for onboarding link
   */
  const handleOnboard = async () => {
    setStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "stripe-connect-onboard",
        {
          body: {
            return_url: `${window.location.origin}/settings?tab=profile&stripe=complete`,
            refresh_url: `${window.location.origin}/settings?tab=profile&stripe=refresh`,
          },
        }
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Onboarding error:", err);
    } finally {
      setStarting(false);
    }
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <section className="rounded bg-card border p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <CreditCard size={14} /> Payment Setup
        </h2>
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-40 mt-2" />
        </div>
      </section>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <section className="rounded bg-card border p-4">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <CreditCard size={14} /> Payment Setup
        </h2>
        <div className="rounded border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-[13px] text-destructive flex items-center gap-1.5">
            <XCircle size={13} /> Failed to load payment status
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {(error as Error).message || "Please try again."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs mt-2"
            onClick={() => refetch()}
          >
            Retry
          </Button>
        </div>
      </section>
    );
  }

  /**
   * Determine overall onboarding state using V2 fields.
   *
   * isFullyOnboarded: account exists AND can receive payments AND onboarding is complete
   * hasPendingRequirements: there are currently_due or past_due items
   */
  const isFullyOnboarded =
    status?.has_account &&
    status.ready_to_receive_payments &&
    status.onboarding_complete;

  const hasPendingRequirements =
    status?.requirements &&
    ((status.requirements.currently_due?.length ?? 0) > 0 ||
      (status.requirements.past_due?.length ?? 0) > 0);

  return (
    <section className="rounded bg-card border p-4">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <CreditCard size={14} /> Payment Setup
      </h2>

      {/* ── No account yet ── */}
      {!status?.has_account && (
        <>
          <p className="text-[13px] text-muted-foreground mb-3">
            Connect a payment account to receive payouts for completed jobs or
            fund jobs you post.
          </p>
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleOnboard}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Setting up…
              </>
            ) : (
              <>
                <CreditCard size={12} /> Onboard to collect payments
              </>
            )}
          </Button>
        </>
      )}

      {/* ── Fully onboarded ── */}
      {isFullyOnboarded && (
        <div className="space-y-2">
          <div className="rounded border border-primary/20 bg-primary/5 p-3">
            <p className="text-[13px] font-medium text-primary flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Payment account active
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              You can receive payouts and process payments.
            </p>
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-primary" /> Transfers{" "}
              {status.transfers_status}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-primary" /> Requirements
              met
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={handleOnboard}
            disabled={starting}
          >
            {starting ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                <ExternalLink size={11} /> Manage payment account
              </>
            )}
          </Button>
        </div>
      )}

      {/* ── Partial / pending onboarding ── */}
      {status?.has_account && !isFullyOnboarded && (
        <div className="space-y-2">
          <div className="rounded border border-accent/20 bg-accent/5 p-3">
            <p className="text-[13px] font-medium flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-accent" /> Onboarding
              incomplete
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {status.onboarding_complete
                ? "Your details have been submitted but transfers are not yet active."
                : "Complete the onboarding process to start receiving payments."}
            </p>
          </div>

          {/* Show specific pending requirements */}
          {hasPendingRequirements && (
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              {(status.requirements?.past_due?.length ?? 0) > 0 && (
                <p className="text-destructive">
                  ⚠ {status.requirements!.past_due.length} past-due
                  requirement(s)
                </p>
              )}
              {(status.requirements?.currently_due?.length ?? 0) > 0 && (
                <p>
                  {status.requirements!.currently_due.length} item(s) currently
                  due
                </p>
              )}
            </div>
          )}

          {/* Status indicators */}
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              {status.ready_to_receive_payments ? (
                <CheckCircle2 size={10} className="text-primary" />
              ) : (
                <XCircle size={10} className="text-muted-foreground" />
              )}{" "}
              Transfers
            </span>
            <span className="flex items-center gap-1">
              {status.onboarding_complete ? (
                <CheckCircle2 size={10} className="text-primary" />
              ) : (
                <XCircle size={10} className="text-muted-foreground" />
              )}{" "}
              Requirements
            </span>
          </div>

          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleOnboard}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Loading…
              </>
            ) : (
              <>
                <ExternalLink size={12} /> Continue onboarding
              </>
            )}
          </Button>
        </div>
      )}
    </section>
  );
}
