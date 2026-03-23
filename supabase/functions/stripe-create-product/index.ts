/**
 * stripe-create-product
 *
 * Creates a product + default price on the PLATFORM Stripe account.
 * Stores a mapping to the user's connected account ID in platform_products.
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
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

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
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!amount_cents || typeof amount_cents !== "number" || amount_cents < 50) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least 50 cents ($0.50)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validCurrency = (currency || "usd").toLowerCase();
    const validPricingType = pricing_type === "recurring" ? "recurring" : "one_time";

    // ── Look up user's connected account ID (for mapping only) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    const connectedAccountId = profile?.stripe_account_id || null;

    // ── Create product on the PLATFORM account (not connected account) ──
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const stripeProduct = await stripe.products.create({
      name: name.trim(),
      description: description?.trim() || undefined,
      metadata: {
        created_by: user.id,
        connected_account_id: connectedAccountId || "none",
      },
    });

    // ── Create a default price for the product ──
    const priceParams: Stripe.PriceCreateParams = {
      product: stripeProduct.id,
      unit_amount: amount_cents,
      currency: validCurrency,
    };

    // For recurring products, add interval (default monthly)
    if (validPricingType === "recurring") {
      priceParams.recurring = { interval: "month" };
    }

    const stripePrice = await stripe.prices.create(priceParams);

    // ── Store mapping in platform_products ──
    const { data: product, error: insertError } = await supabase
      .from("platform_products")
      .insert({
        created_by: user.id,
        connected_account_id: connectedAccountId,
        stripe_product_id: stripeProduct.id,
        stripe_price_id: stripePrice.id,
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
