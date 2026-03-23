/**
 * stripe-checkout
 *
 * Creates a Stripe Checkout Session using DESTINATION CHARGES.
 *
 * ── How destination charges work ──
 * 1. The customer pays the PLATFORM account.
 * 2. Stripe automatically transfers funds to the CONNECTED account (the operator).
 * 3. The platform keeps an application_fee_amount (commission).
 *
 * Flow:
 *   Customer clicks "Buy" → frontend calls this function →
 *   returns Checkout Session URL → customer is redirected to Stripe-hosted page →
 *   on success, Stripe moves funds minus fee to connected account.
 *
 * POST body: {
 *   product_id: string   // platform_products.id (our DB id, not Stripe id)
 * }
 *
 * Response: { url: string }  // Stripe Checkout Session URL
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * PLATFORM_FEE_PERCENT — the percentage the platform keeps on every sale.
 * Example: 0.10 = 10%.  Change this constant to adjust commission.
 *
 * In production you might read from Deno.env.get("PLATFORM_FEE_PERCENT")
 * so it can be changed without redeploying.
 */
const PLATFORM_FEE_PERCENT = parseFloat(
  Deno.env.get("PLATFORM_FEE_PERCENT") || "0.10"
);

serve(async (req) => {
  // ── CORS preflight ──
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
            "This product has no connected account. The seller must complete Stripe onboarding.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Calculate the platform fee ──
    // application_fee_amount is what the PLATFORM keeps.
    // The rest is automatically transferred to the connected account.
    const applicationFee = Math.round(
      product.amount_cents * PLATFORM_FEE_PERCENT
    );

    // ── Build the success/cancel URLs ──
    // Use the Origin header so it works in any environment (preview, prod, etc.)
    const origin =
      req.headers.get("origin") || req.headers.get("referer") || "";
    const successUrl = `${origin}/storefront?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = `${origin}/storefront?status=cancelled`;

    // ── Create the Stripe Checkout Session ──
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    /**
     * Destination charge params:
     * - payment_intent_data.transfer_data.destination → the connected account
     * - payment_intent_data.application_fee_amount    → what platform keeps
     *
     * The customer pays the full price.  Stripe splits: fee → platform, rest → operator.
     */
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode:
        product.pricing_type === "recurring" ? "subscription" : "payment",
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        platform_product_id: product.id,
        buyer_id: user.id,
        seller_connected_account: product.connected_account_id,
      },
    };

    // Destination charges are configured via payment_intent_data for one-time,
    // or subscription_data for recurring.
    if (product.pricing_type === "recurring") {
      sessionParams.subscription_data = {
        application_fee_percent: PLATFORM_FEE_PERCENT * 100, // Stripe wants a percentage for subscriptions
        transfer_data: {
          destination: product.connected_account_id,
        },
      };
    } else {
      sessionParams.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: product.connected_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // ── Return the hosted checkout URL ──
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
