/**
 * stripe-connect-onboard
 *
 * Creates a Stripe Connect account using the V2 API and returns an
 * onboarding link via V2 Account Links.
 *
 * ── V2 Account Creation ──
 * Uses stripeClient.v2.core.accounts.create() with:
 *   - dashboard: 'express'
 *   - responsibilities: platform collects fees and covers losses
 *   - capabilities: stripe_balance.stripe_transfers requested
 *   - No top-level `type` parameter (V2 requirement)
 *
 * ── V2 Account Links ──
 * Uses stripeClient.v2.core.accountLinks.create() with:
 *   - use_case.type: 'account_onboarding'
 *   - configurations: ['recipient']
 *
 * POST body: { return_url?: string, refresh_url?: string }
 * Response:  { url: string, account_id: string }
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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Environment checks ──
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error(
        "STRIPE_SECRET_KEY is not configured. " +
          "Add it in project secrets (Dashboard → Settings → Secrets)."
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    // ── Authenticate the user via JWT ──
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

    // ── Parse optional body for return/refresh URLs ──
    let returnUrl = "";
    let refreshUrl = "";
    try {
      const body = await req.json();
      returnUrl = body.return_url || "";
      refreshUrl = body.refresh_url || "";
    } catch {
      // No body is fine — we'll use defaults
    }

    // ── Check if user already has a connected account ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    // ── Create the Stripe Client (used for ALL Stripe requests) ──
    const stripeClient = new Stripe(stripeKey);

    let accountId = profile?.stripe_account_id;

    // ── Create V2 connected account if none exists ──
    if (!accountId) {
      /**
       * V2 Account Creation
       *
       * Key differences from V1:
       * - No top-level `type` parameter (no 'express', 'standard', 'custom')
       * - Use `dashboard: 'express'` for express-like experience
       * - Platform responsibilities defined in `defaults.responsibilities`
       * - Capabilities requested in `configuration.recipient`
       *
       * The platform is responsible for:
       * - fees_collector: 'application' — platform sets and collects fees
       * - losses_collector: 'application' — platform covers negative balances
       */
      const account = await stripeClient.v2.core.accounts.create({
        display_name: user.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
          : user.email || "Operator",
        contact_email: user.email || undefined,
        identity: {
          country: "us",
        },
        dashboard: "express",
        defaults: {
          responsibilities: {
            fees_collector: "application",
            losses_collector: "application",
          },
        },
        configuration: {
          recipient: {
            capabilities: {
              stripe_balance: {
                stripe_transfers: {
                  requested: true,
                },
              },
            },
          },
        },
        metadata: {
          user_id: user.id,
        },
      });

      accountId = account.id;

      // Store the V2 account ID in the user's profile for future lookups
      await supabase
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("user_id", user.id);
    }

    // ── Generate V2 onboarding link ──
    /**
     * V2 Account Links
     *
     * Uses a structured `use_case` object instead of flat parameters.
     * - use_case.type: 'account_onboarding' — starts the onboarding flow
     * - configurations: ['recipient'] — onboard for the recipient configuration
     * - return_url: where user returns after completing onboarding
     * - refresh_url: where user goes if the link expires or they need to restart
     */
    const origin = req.headers.get("origin") || "";
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["recipient"],
          refresh_url:
            refreshUrl ||
            `${origin}/settings?tab=profile&stripe=refresh`,
          return_url:
            returnUrl ||
            `${origin}/settings?tab=profile&stripe=complete`,
        },
      },
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, account_id: accountId }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("stripe-connect-onboard error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
