/**
 * stripe-checkout
 *
 * Creates a Stripe Checkout Session using PLATFORM-HELD CHARGES (escrow model)
 * with a TRANSPARENT SPLIT FEE.
 *
 * ── Fee math (canonical) ──
 *   growerPlatformFeeCents     = jobTotal × 7.5%
 *   operatorPlatformFeeCents   = jobTotal × 7.5%
 *   growerChargeCents          = jobTotal + growerPlatformFeeCents
 *   stripeFeeCents             = round(growerChargeCents × 2.9%) + 30
 *   operatorPayoutCents        = jobTotal − operatorPlatformFeeCents
 *   platformRevenueCents       = grower fee + operator fee − stripeFee
 *
 * The grower pays the platform fee + Stripe processing on top of the job total.
 * The operator receives the job total minus their 7.5% fee. Stripe processing
 * is absorbed by the platform from the grower's gross payment.
 *
 * ── Two flows ──
 *  1. JOB FUNDING (preferred for marketplace work):
 *     POST { job_id: string }
 *     - Creates a PaymentIntent for `growerChargeCents` on the platform balance
 *     - Stores all fee numbers + payment_intent_id on the job row
 *     - Returns the PaymentIntent client_secret so the client can confirm payment
 *
 *  2. PRODUCT CHECKOUT (legacy storefront flow, retained):
 *     POST { product_id: string }
 *     - Creates a Stripe Checkout Session for a one-off platform_products row
 *     - Returns { url } for redirect
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@20.4.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Split-fee constants (must match src/components/payments/FeeBreakdown.tsx) ──
const PLATFORM_FEE_RATE = 0.075;       // 7.5% per side
const STRIPE_PERCENT_FEE = 0.029;      // 2.9%
const STRIPE_FIXED_FEE_CENTS = 30;     // $0.30

/**
 * DEFAULT_FEE_PERCENT — global fallback when no per-product or per-type fee is set.
 * Override with the PLATFORM_FEE_PERCENT env var (e.g. "0.10" for 10%).
 */
const DEFAULT_FEE_PERCENT = parseFloat(
  Deno.env.get("PLATFORM_FEE_PERCENT") || "0.10"
);

/**
 * OPERATION_FEE_SCHEDULE — platform commission rates by operation type.
 *
 * Adjust these percentages to control how much the platform earns
 * on each type of agricultural service. Any operation type not listed
 * here falls back to DEFAULT_FEE_PERCENT.
 *
 * To change rates: edit this map or move to a database table for
 * runtime configurability.
 */
const OPERATION_FEE_SCHEDULE: Record<string, number> = {
  // ── Field Operations ──
  spraying:      0.12,   // 12% — specialized equipment, higher value
  fertilizing:   0.12,   // 12% — chemical handling premium
  planting:      0.10,   // 10% — standard rate
  seeding:       0.10,   // 10% — standard rate
  harvest:       0.10,   // 10% — standard rate
  tillage:       0.08,   // 8%  — commodity service, volume play

  // ── Hauling ──
  hauling:       0.08,   // 8%  — high volume, thin margins
  grain_hauling: 0.08,   // 8%  — same as hauling

  // ── Specialty ──
  scouting:      0.15,   // 15% — data/advisory premium
  soil_sampling: 0.15,   // 15% — data/advisory premium
  drainage:      0.10,   // 10% — standard rate

  // ── General ──
  mowing:        0.10,   // 10%
  baling:        0.10,   // 10%
  rock_picking:  0.08,   // 8%
  other:         0.10,   // 10% — fallback for unlisted types
};

/**
 * Resolve the platform fee rate for a given product.
 *
 * Priority:
 * 1. Product-level override (platform_fee_percent column)
 * 2. Operation-type schedule (OPERATION_FEE_SCHEDULE)
 * 3. Global default (DEFAULT_FEE_PERCENT)
 */
function resolveFeeRate(product: any): number {
  // 1. Per-product override (explicitly set, not null, and > 0)
  if (
    product.platform_fee_percent != null &&
    Number(product.platform_fee_percent) > 0
  ) {
    return Number(product.platform_fee_percent);
  }

  // 2. Operation-type schedule
  const opType = (product.operation_type || "other").toLowerCase();
  if (OPERATION_FEE_SCHEDULE[opType] != null) {
    return OPERATION_FEE_SCHEDULE[opType];
  }

  // 3. Global default
  return DEFAULT_FEE_PERCENT;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Environment validation ──
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. Add it in project secrets."
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    // ── Authenticate the buyer ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ──
    const body = await req.json().catch(() => ({}));
    const { product_id, job_id } = body || {};

    // ─────────────────────────────────────────────────────────────
    // FLOW 1: Job funding with transparent split fee
    // ─────────────────────────────────────────────────────────────
    if (job_id) {
      // Load the job
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .select(
          "id, requested_by, operator_id, status, agreed_price, approved_total, " +
            "estimated_total, contract_mode, stripe_payment_intent_id, funding_status"
        )
        .eq("id", job_id)
        .maybeSingle();

      if (jobErr || !job) {
        return new Response(JSON.stringify({ error: "Job not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Authorization: only the grower (requester) can fund the job
      if (job.requested_by !== user.id) {
        return new Response(
          JSON.stringify({ error: "Only the grower who posted this job can fund it" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Idempotency: if a PaymentIntent already exists, return it
      const stripeClient = new Stripe(stripeKey);
      if (job.stripe_payment_intent_id) {
        const existing = await stripeClient.paymentIntents.retrieve(
          job.stripe_payment_intent_id
        );
        if (
          existing.status !== "canceled" &&
          existing.status !== "succeeded"
        ) {
          return new Response(
            JSON.stringify({
              payment_intent_id: existing.id,
              client_secret: existing.client_secret,
              amount_cents: existing.amount,
              already_created: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Resolve job total in dollars → cents (mirror of deriveAgreedPrice)
      const agreedTotal = Number(
        job.agreed_price ||
          job.approved_total ||
          (job.contract_mode === "fixed_price" ? job.estimated_total : 0) ||
          0
      );
      if (!(agreedTotal > 0)) {
        return new Response(
          JSON.stringify({ error: "Job has no agreed price to charge" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Canonical fee math (must match FeeBreakdown.tsx) ──
      const jobTotalCents = Math.round(agreedTotal * 100);
      const growerPlatformFeeCents = Math.round(jobTotalCents * PLATFORM_FEE_RATE);
      const operatorPlatformFeeCents = Math.round(jobTotalCents * PLATFORM_FEE_RATE);
      const growerChargeAmountCents = jobTotalCents + growerPlatformFeeCents;
      const stripeFeeCents =
        Math.round(growerChargeAmountCents * STRIPE_PERCENT_FEE) +
        STRIPE_FIXED_FEE_CENTS;
      const operatorPayoutCents = jobTotalCents - operatorPlatformFeeCents;

      console.log(
        `[stripe-checkout] job=${job.id} ` +
          `total=${jobTotalCents}¢ grower_fee=${growerPlatformFeeCents}¢ ` +
          `op_fee=${operatorPlatformFeeCents}¢ stripe_fee=${stripeFeeCents}¢ ` +
          `charge=${growerChargeAmountCents}¢ payout=${operatorPayoutCents}¢`
      );

      // Create a PaymentIntent on the PLATFORM balance — no transfer_data,
      // funds stay in escrow until stripe-release-payout fires on approval.
      const paymentIntent = await stripeClient.paymentIntents.create(
        {
          amount: growerChargeAmountCents,
          currency: "usd",
          automatic_payment_methods: { enabled: true },
          metadata: {
            flow: "job_split_fee_escrow",
            job_id: job.id,
            grower_id: job.requested_by,
            operator_id: job.operator_id || "",
            job_total_cents: String(jobTotalCents),
            grower_platform_fee_cents: String(growerPlatformFeeCents),
            operator_platform_fee_cents: String(operatorPlatformFeeCents),
            operator_payout_cents: String(operatorPayoutCents),
            stripe_fee_cents: String(stripeFeeCents),
            platform_fee_cents: String(
              growerPlatformFeeCents + operatorPlatformFeeCents
            ),
          },
        },
        { idempotencyKey: `job-fund-${job.id}` }
      );

      // Persist all fee numbers + funding status on the job row
      const { error: upErr } = await supabase
        .from("jobs")
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          payment_intent_id: paymentIntent.id, // legacy column kept in sync
          grower_charge_cents: growerChargeAmountCents,
          operator_payout_cents: operatorPayoutCents,
          platform_fee_cents:
            growerPlatformFeeCents + operatorPlatformFeeCents,
          stripe_fee_cents: stripeFeeCents,
          funding_status: "funded",
          funded_amount: growerChargeAmountCents / 100,
          funded_at: new Date().toISOString(),
        } as any)
        .eq("id", job.id);

      if (upErr) {
        console.error("[stripe-checkout] Failed to persist fee numbers:", upErr);
        return new Response(
          JSON.stringify({ error: "Could not save funding details" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          payment_intent_id: paymentIntent.id,
          client_secret: paymentIntent.client_secret,
          amount_cents: growerChargeAmountCents,
          job_total_cents: jobTotalCents,
          grower_platform_fee_cents: growerPlatformFeeCents,
          operator_platform_fee_cents: operatorPlatformFeeCents,
          stripe_fee_cents: stripeFeeCents,
          operator_payout_cents: operatorPayoutCents,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // FLOW 2: Legacy product checkout (storefront)
    // ─────────────────────────────────────────────────────────────
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "Either job_id or product_id is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Look up the product from our database ──
    const { data: product, error: prodError } = await supabase
      .from("platform_products")
      .select("*")
      .eq("id", product_id)
      .eq("is_active", true)
      .single();

    if (prodError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found or inactive." }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Require a connected account to receive funds ──
    if (!product.connected_account_id) {
      return new Response(
        JSON.stringify({
          error:
            "This product has no connected account. The seller must complete payment onboarding.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Calculate the platform fee using the fee schedule ──
    const feeRate = resolveFeeRate(product);
    const applicationFee = Math.round(product.amount_cents * feeRate);

    console.log(
      `[stripe-checkout] Product ${product.id}: ` +
        `type=${product.operation_type}, fee_rate=${(feeRate * 100).toFixed(1)}%, ` +
        `amount=${product.amount_cents}¢, app_fee=${applicationFee}¢`
    );

    // ── Build return URLs ──
    const origin =
      req.headers.get("origin") || req.headers.get("referer") || "";
    const successUrl = `${origin}/storefront?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = `${origin}/storefront?status=cancelled`;

    // ── Create the Stripe Client ──
    const stripeClient = new Stripe(stripeKey);

    /**
     * Create Checkout Session that charges the PLATFORM account directly.
     *
     * No `transfer_data` is set — funds remain in the platform Stripe balance
     * until `stripe-release-payout` issues a Transfer after work is approved.
     * The fee rate and seller account are stored in metadata so the payout
     * function knows where to send the operator's share later.
     */
    const session = await stripeClient.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: product.currency || "usd",
            product_data: {
              name: product.name,
              description: product.description || undefined,
            },
            unit_amount: product.amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        platform_product_id: product.id,
        buyer_id: user.id,
        seller_connected_account: product.connected_account_id,
        operation_type: product.operation_type || "other",
        fee_rate: String(feeRate),
        fee_amount_cents: String(applicationFee),
        flow: "platform_escrow",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-checkout error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
