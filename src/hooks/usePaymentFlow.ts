import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

// ── Funding status constants ──
export const FUNDING_LABELS: Record<string, string> = {
  not_required: "No Funding Required",
  unfunded: "Unfunded",
  funding_required: "Funding Required",
  funded: "Funded",
  payout_ready: "Payout Ready",
  payout_released: "Payout Released",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

export const FUNDING_COLORS: Record<string, string> = {
  not_required: "text-muted-foreground",
  unfunded: "text-muted-foreground",
  funding_required: "text-warning",
  funded: "text-success",
  payout_ready: "text-info",
  payout_released: "text-success",
  disputed: "text-destructive",
  refunded: "text-muted-foreground",
  cancelled: "text-muted-foreground",
};

// ── Derive agreed price from job data ──
export function deriveAgreedPrice(job: any): number | null {
  // If explicitly set, use it
  if (job.agreed_price != null && Number(job.agreed_price) > 0) {
    return Number(job.agreed_price);
  }
  // If approved_total is set (from accepted quote), use that
  if (job.approved_total != null && Number(job.approved_total) > 0) {
    return Number(job.approved_total);
  }
  // For fixed price jobs, use estimated_total
  if (job.contract_mode === "fixed_price" && Number(job.estimated_total) > 0) {
    return Number(job.estimated_total);
  }
  return null;
}

// ── Calculate platform fee ──
export function calculatePlatformFee(amount: number, rate: number = 0.05): {
  platformFee: number;
  operatorPayout: number;
  total: number;
} {
  const platformFee = Math.round(amount * rate * 100) / 100;
  return {
    platformFee,
    operatorPayout: amount - platformFee,
    total: amount,
  };
}

// ── Can job start execution? ──
export function canStartExecution(job: any): { allowed: boolean; reason?: string } {
  const fundingStatus = job.funding_status || "unfunded";
  const status = job.status;

  if (status === "cancelled") return { allowed: false, reason: "Job is cancelled" };
  if (!["accepted", "scheduled"].includes(status)) {
    return { allowed: false, reason: "Job must be accepted before starting" };
  }
  if (fundingStatus === "funded") return { allowed: true };
  if (fundingStatus === "not_required") return { allowed: true };

  return { allowed: false, reason: "Job must be funded before work can begin" };
}

// ── Is funding required for this job to proceed? ──
export function isFundingRequired(job: any): boolean {
  const fs = job.funding_status || "unfunded";
  return ["unfunded", "funding_required"].includes(fs);
}

// ── Hook: Set agreed price after quote acceptance ──
export function useSetAgreedPrice() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      jobId,
      agreedPrice,
      quoteId,
    }: {
      jobId: string;
      agreedPrice: number;
      quoteId?: string;
    }) => {
      const feeRate = 0.05;
      const feeAmount = Math.round(agreedPrice * feeRate * 100) / 100;

      const { error } = await supabase
        .from("jobs")
        .update({
          agreed_price: agreedPrice,
          approved_total: agreedPrice,
          platform_fee_amount: feeAmount,
          funding_status: "funding_required" as any,
        } as any)
        .eq("id", jobId);

      if (error) throw error;

      // Log to quote history if applicable
      if (quoteId && user) {
        await supabase.from("quote_history" as any).insert({
          quote_id: quoteId,
          job_id: jobId,
          actor_id: user.id,
          action: "price_agreed",
          amount: agreedPrice,
        } as any);
      }
    },
    onSuccess: (_, { jobId }) => {
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to set agreed price"),
  });
}

// ── Hook: Mark job as funded (simulated — will use Stripe in Phase 1) ──
export function useFundJob() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ jobId, amount }: { jobId: string; amount: number }) => {
      // TODO: Phase 1 — Create Stripe PaymentIntent here
      // For now, simulate funding by updating status
      const { error } = await supabase
        .from("jobs")
        .update({
          funding_status: "funded" as any,
          funded_amount: amount,
          funded_at: new Date().toISOString(),
        } as any)
        .eq("id", jobId);

      if (error) throw error;
    },
    onSuccess: (_, { jobId, amount }) => {
      toast.success("Job funded successfully! Work can now begin.");
      if (user) {
        trackEvent(user.id, "job_funded", { job_id: jobId, amount });
      }
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to fund job"),
  });
}

// ── Hook: Release payout via the stripe-release-payout edge function ──
// Caller must be the grower (jobs.requested_by) and the job must be in
// `approved` status with `approved_by = caller`. The edge function performs
// the Stripe Transfer from the platform balance to the operator's connected
// account, deducts the platform fee, and marks the job paid.
export function useReleasePayout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId }: { jobId: string }) => {
      const { data, error } = await supabase.functions.invoke(
        "stripe-release-payout",
        { body: { job_id: jobId } }
      );
      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: (_, { jobId }) => {
      toast.success("Payout released to operator.");
      qc.invalidateQueries({ queryKey: ["job", jobId] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to release payout"),
  });
}

// ── Hook: Log quote negotiation action ──
export function useLogQuoteAction() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      quoteId,
      jobId,
      action,
      amount,
      notes,
    }: {
      quoteId: string;
      jobId: string;
      action: string;
      amount: number;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("quote_history" as any).insert({
        quote_id: quoteId,
        job_id: jobId,
        actor_id: user.id,
        action,
        amount,
        notes: notes || null,
      } as any);
      if (error) throw error;
    },
  });
}
