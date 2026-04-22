/**
 * stripe-release-payout
 *
 * Releases funds held on the platform balance to an operator's connected
 * account AFTER the grower has approved the work.
 *
 * ── Why a separate function? ──
 * `stripe-checkout` charges the grower into the PLATFORM Stripe balance
 * (no destination, no automatic transfer). Money sits in escrow until
 * the grower clicks "Approve Work". This function performs the manual
 * Transfer at that moment and not before.
 *
 * ── Authorization rules ──
 * The caller must be authenticated AND must be the grower who requested
 * the job (`jobs.requested_by`). The job must be in `approved` status
 * with `approved_by = caller`. We refuse to transfer in any other state.
 *
 * ── Side effects ──
 * - Creates a Stripe Transfer (platform_fee deducted) to the operator's
 *   connected account.
 * - Stores `stripe_transfer_id` on the job and sets `funding_status =
 *   payout_released`, `status = paid`, `paid_total`.
 * - Inserts an invoice row marking the transaction paid.
 *
 * POST body: { job_id: string }
 * Response: { transfer_id: string, amount_cents: number }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@20.4.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Environment ──
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    // ── Authenticate caller (grower) ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // ── Parse body ──
    const { job_id } = await req.json().catch(() => ({}));
    if (!job_id || typeof job_id !== "string") {
      return json({ error: "job_id is required" }, 400);
    }

    // ── Load job ──
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select(
        "id, status, requested_by, operator_id, approved_by, agreed_price, " +
          "approved_total, platform_fee_amount, platform_fee_rate, " +
          "payment_intent_id, stripe_transfer_id, funding_status, farm_id"
      )
      .eq("id", job_id)
      .maybeSingle();

    if (jobErr || !job) return json({ error: "Job not found" }, 404);

    // ── Authorization gate: only grower-of-record can release ──
    if (job.requested_by !== user.id) {
      return json({ error: "Only the grower who posted the job can release the payout" }, 403);
    }

    // ── Status gate: must be approved by the same grower ──
    if (job.status !== "approved") {
      return json(
        { error: `Job status must be 'approved' to release payout (current: ${job.status})` },
        400
      );
    }
    if (job.approved_by !== user.id) {
      return json({ error: "Job approval must be recorded by the grower before payout" }, 400);
    }

    // ── Idempotency ──
    if (job.stripe_transfer_id) {
      return json({
        transfer_id: job.stripe_transfer_id,
        already_released: true,
      });
    }

    if (!job.payment_intent_id) {
      return json(
        { error: "No payment_intent_id on job — funding has not been received" },
        400
      );
    }

    if (!job.operator_id) {
      return json({ error: "Job has no assigned operator" }, 400);
    }

    // ── Look up operator's connected account ──
    const { data: operatorProfile, error: opErr } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarded")
      .eq("user_id", job.operator_id)
      .maybeSingle();

    if (opErr || !operatorProfile?.stripe_account_id) {
      return json(
        { error: "Operator has no connected Stripe account" },
        400
      );
    }
    if (!operatorProfile.stripe_onboarded) {
      return json(
        { error: "Operator's payout account is not active yet" },
        400
      );
    }

    // ── Compute payout amount in cents ──
    const grossDollars = Number(
      job.approved_total || job.agreed_price || 0
    );
    if (!(grossDollars > 0)) {
      return json({ error: "Job has no agreed price" }, 400);
    }
    const grossCents = Math.round(grossDollars * 100);

    const feeDollars = Number(job.platform_fee_amount || 0);
    const feeRate = Number(job.platform_fee_rate || 0.05);
    const feeCents =
      feeDollars > 0
        ? Math.round(feeDollars * 100)
        : Math.round(grossCents * feeRate);

    const payoutCents = grossCents - feeCents;
    if (payoutCents <= 0) {
      return json({ error: "Computed payout is zero or negative" }, 400);
    }

    // ── Verify the source PaymentIntent succeeded ──
    const stripeClient = new Stripe(stripeKey);
    let pi: Stripe.PaymentIntent;
    try {
      pi = await stripeClient.paymentIntents.retrieve(job.payment_intent_id);
    } catch (e) {
      return json({ error: "Could not retrieve PaymentIntent" }, 400);
    }
    if (pi.status !== "succeeded") {
      return json(
        { error: `PaymentIntent is not succeeded (status: ${pi.status})` },
        400
      );
    }

    // ── Create the Transfer ──
    const transfer = await stripeClient.transfers.create(
      {
        amount: payoutCents,
        currency: pi.currency || "usd",
        destination: operatorProfile.stripe_account_id,
        transfer_group: `job_${job.id}`,
        source_transaction: typeof pi.latest_charge === "string"
          ? pi.latest_charge
          : undefined,
        metadata: {
          job_id: job.id,
          released_by: user.id,
          operator_id: job.operator_id,
          gross_cents: String(grossCents),
          fee_cents: String(feeCents),
        },
      },
      { idempotencyKey: `job-payout-${job.id}` }
    );

    console.log(
      `[stripe-release-payout] Transfer ${transfer.id} → ` +
        `${operatorProfile.stripe_account_id}: ${payoutCents}¢ ` +
        `(gross ${grossCents}¢, fee ${feeCents}¢)`
    );

    // ── Update job ──
    await supabase
      .from("jobs")
      .update({
        stripe_transfer_id: transfer.id,
        funding_status: "payout_released",
        status: "paid",
        paid_total: grossDollars,
      } as any)
      .eq("id", job.id);

    // ── Insert invoice record ──
    await supabase.from("invoices").insert({
      job_id: job.id,
      field_id: job.farm_id, // best-effort link; many jobs are multi-field
      issued_by: job.operator_id,
      issued_to: job.requested_by,
      subtotal: grossDollars,
      fees: feeCents / 100,
      tax: 0,
      total: grossDollars,
      due_date: new Date().toISOString().slice(0, 10),
      status: "paid",
      paid_at: new Date().toISOString(),
      stripe_invoice_id: transfer.id,
    } as any);

    return json({
      transfer_id: transfer.id,
      amount_cents: payoutCents,
      fee_cents: feeCents,
      gross_cents: grossCents,
    });
  } catch (error) {
    console.error("stripe-release-payout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});