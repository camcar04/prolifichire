import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, CheckCircle2, AlertTriangle, ExternalLink, Loader2, XCircle,
} from "lucide-react";

interface StripeStatus {
  has_account: boolean;
  account_id?: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  } | null;
}

export function StripeConnectOnboarding() {
  const { session } = useAuth();
  const [starting, setStarting] = useState(false);

  // Fetch live status from Stripe via edge function
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

  // Start onboarding — creates account + redirects to Stripe
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

  // ── Determine overall status ──
  const isFullyOnboarded =
    status?.has_account &&
    status.charges_enabled &&
    status.payouts_enabled &&
    status.details_submitted;

  const isPartial =
    status?.has_account && status.details_submitted && !isFullyOnboarded;

  const hasPendingRequirements =
    status?.requirements &&
    (status.requirements.currently_due.length > 0 ||
      status.requirements.past_due.length > 0);

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
          <div className="rounded border border-success/20 bg-success/5 p-3">
            <p className="text-[13px] font-medium text-success flex items-center gap-1.5">
              <CheckCircle2 size={13} /> Payment account active
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              You can receive payouts and process payments.
            </p>
          </div>
          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-success" /> Charges
              enabled
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 size={10} className="text-success" /> Payouts
              enabled
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

      {/* ── Partial / pending ── */}
      {status?.has_account && !isFullyOnboarded && (
        <div className="space-y-2">
          <div className="rounded border border-warning/20 bg-warning/5 p-3">
            <p className="text-[13px] font-medium text-warning-foreground flex items-center gap-1.5">
              <AlertTriangle size={13} className="text-warning" /> Onboarding
              incomplete
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {isPartial
                ? "Your details have been submitted but some capabilities are not yet enabled."
                : "Complete the Stripe onboarding process to start receiving payments."}
            </p>
          </div>

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

          <div className="flex gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              {status.charges_enabled ? (
                <CheckCircle2 size={10} className="text-success" />
              ) : (
                <XCircle size={10} className="text-muted-foreground" />
              )}{" "}
              Charges
            </span>
            <span className="flex items-center gap-1">
              {status.payouts_enabled ? (
                <CheckCircle2 size={10} className="text-success" />
              ) : (
                <XCircle size={10} className="text-muted-foreground" />
              )}{" "}
              Payouts
            </span>
            <span className="flex items-center gap-1">
              {status.details_submitted ? (
                <CheckCircle2 size={10} className="text-success" />
              ) : (
                <XCircle size={10} className="text-muted-foreground" />
              )}{" "}
              Details
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
