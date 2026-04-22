/**
 * stripe-checkout
 *
 * Creates a Stripe Checkout Session using PLATFORM-HELD CHARGES (escrow model).
 *
 * ── Why platform-held instead of destination charges? ──
 * Agricultural work has not happened yet at the time of payment.
 * If we used destination charges, funds would route to the operator's
 * connected account immediately — before any field work is done.
 * Instead, we charge the grower to the PLATFORM account and hold the funds
 * until the grower clicks "Approve Work". The payout to the operator is
 * then triggered by the `stripe-release-payout` edge function via a
 * Stripe Transfer from the platform balance.
 *
 * ── Fee Schedule ──
 * The platform takes a configurable percentage on each transaction.
 * Fee rates are determined in this priority order:
 *   1. Per-product override  → platform_products.platform_fee_percent
 *   2. Operation-type default → OPERATION_FEE_SCHEDULE map below
 *   3. Global fallback       → DEFAULT_FEE_PERCENT (10%)
 *
 * POST body: { product_id: string }
 * Response: { url: string }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@20.4.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
    const { product_id } = await req.json();
    if (!product_id) {
      return new Response(
        JSON.stringify({ error: "product_id is required." }),
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
