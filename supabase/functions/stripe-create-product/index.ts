/**
 * stripe-create-product
 *
 * Creates a product + default price on the PLATFORM Stripe account.
 * Stores a mapping to the user's connected account ID in platform_products.
 *
 * ── Product Creation ──
 * Uses stripeClient.products.create() with default_price_data to create
 * both the product and its price in a single API call.
 *
 * The product is created on the PLATFORM account (not the connected account).
 * The connected_account_id is stored in both Stripe metadata and our DB
 * to link the product to the operator who will receive funds.
 *
 * POST body: {
 *   name: string,
 *   description?: string,
 *   amount_cents: number,     // price in cents (e.g. 5000 = $50.00)
 *   currency?: string,        // defaults to "usd"
 *   pricing_type?: "one_time" | "recurring"
 * }
 *
 * Response: { product: { id, stripe_product_id, stripe_price_id, ... } }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@20.4.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Environment checks ──
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

    // ── Authenticate user ──
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

    // ── Parse + validate body ──
    const body = await req.json();
    const { name, description, amount_cents, currency, pricing_type } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Product name is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (!amount_cents || typeof amount_cents !== "number" || amount_cents < 50) {
      return new Response(
        JSON.stringify({
          error: "Amount must be at least 50 cents ($0.50).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const validCurrency = (currency || "usd").toLowerCase();
    const validPricingType =
      pricing_type === "recurring" ? "recurring" : "one_time";

    // ── Look up user's connected account ID (for mapping only) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    const connectedAccountId = profile?.stripe_account_id || null;

    // ── Create the Stripe Client ──
    const stripeClient = new Stripe(stripeKey);

    /**
     * Create product on the PLATFORM account with default_price_data.
     *
     * Using default_price_data creates both the product and its default
     * price in a single API call (instead of two separate calls).
     *
     * The product is on the platform account, NOT the connected account.
     * When a checkout session is created, we use destination charges
     * to route funds to the connected account.
     *
     * Metadata stores:
     * - created_by: the user ID in our system
     * - connected_account_id: the operator's Stripe account that will receive funds
     */
    const defaultPriceData: Record<string, any> = {
      unit_amount: amount_cents,
      currency: validCurrency,
    };

    // For recurring pricing, add the billing interval
    if (validPricingType === "recurring") {
      defaultPriceData.recurring = { interval: "month" };
    }

    const stripeProduct = await stripeClient.products.create({
      name: name.trim(),
      description: description?.trim() || undefined,
      default_price_data: defaultPriceData,
      metadata: {
        created_by: user.id,
        connected_account_id: connectedAccountId || "none",
      },
    });

    // The default price ID is returned on the product object
    const stripePriceId =
      typeof stripeProduct.default_price === "string"
        ? stripeProduct.default_price
        : stripeProduct.default_price?.id || null;

    // ── Store mapping in platform_products table ──
    const { data: product, error: insertError } = await supabase
      .from("platform_products")
      .insert({
        created_by: user.id,
        connected_account_id: connectedAccountId,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePriceId,
        name: name.trim(),
        description: description?.trim() || null,
        amount_cents,
        currency: validCurrency,
        pricing_type: validPricingType,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to store product mapping:", insertError);
      throw new Error("Product created in Stripe but failed to save locally.");
    }

    return new Response(JSON.stringify({ product }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-create-product error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
