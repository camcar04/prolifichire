/**
 * stripe-checkout
 *
 * Creates a Stripe Checkout Session using DESTINATION CHARGES.
 *
 * ── Destination Charges Flow ──
 * 1. Customer clicks "Buy" on the storefront.
 * 2. Frontend calls this function with the platform_products.id.
 * 3. We create a Checkout Session with:
 *    - price_data (inline pricing, not a stored price reference)
 *    - payment_intent_data.transfer_data.destination → connected account
 *    - payment_intent_data.application_fee_amount → platform commission
 * 4. Customer is redirected to Stripe's hosted checkout page.
 * 5. On success, Stripe automatically:
 *    - Charges the customer on the platform account
 *    - Retains the application_fee_amount for the platform
 *    - Transfers the remaining amount to the connected account
 *
 * ── Commission ──
 * PLATFORM_FEE_PERCENT controls the platform's take (default 10%).
 * Can be overridden via environment variable.
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
 * PLATFORM_FEE_PERCENT — the percentage the platform keeps on every sale.
 *
 * Default: 0.10 (10%).  Override with the PLATFORM_FEE_PERCENT env var.
 * Example: 0.10 on a $100 product → platform keeps $10, operator gets $90.
 */
const PLATFORM_FEE_PERCENT = parseFloat(
  Deno.env.get("PLATFORM_FEE_PERCENT") || "0.10"
);

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

    // ── Calculate the platform fee ──
    // application_fee_amount = what the PLATFORM keeps
    // The remaining amount is auto-transferred to the connected account
    const applicationFee = Math.round(
      product.amount_cents * PLATFORM_FEE_PERCENT
    );

    // ── Build return URLs ──
    const origin =
      req.headers.get("origin") || req.headers.get("referer") || "";
    const successUrl = `${origin}/storefront?session_id={CHECKOUT_SESSION_ID}&status=success`;
    const cancelUrl = `${origin}/storefront?status=cancelled`;

    // ── Create the Stripe Client ──
    const stripeClient = new Stripe(stripeKey);

    /**
     * Create Checkout Session with destination charges.
     *
     * Using price_data (inline) instead of a stored price reference.
     * This approach:
     * - Doesn't require a pre-created Price object
     * - Allows dynamic pricing per session if needed
     * - Still creates a real PaymentIntent on the platform account
     *
     * payment_intent_data configures the destination charge:
     * - application_fee_amount: cents the platform keeps
     * - transfer_data.destination: connected account receiving the rest
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
      payment_intent_data: {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: product.connected_account_id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        platform_product_id: product.id,
        buyer_id: user.id,
        seller_connected_account: product.connected_account_id,
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
