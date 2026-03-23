/**
 * stripe-account-status
 *
 * Returns the live Stripe Connect onboarding status for the authenticated user.
 * Uses the V2 API with `include` to fetch recipient configuration and requirements.
 *
 * ── V2 Status Check ──
 * stripeClient.v2.core.accounts.retrieve(accountId, {
 *   include: ["configuration.recipient", "requirements"]
 * })
 *
 * The response includes:
 * - configuration.recipient.capabilities.stripe_balance.stripe_transfers.status
 *   → "active" means the account can receive transfers
 * - requirements.summary.minimum_deadline.status
 *   → "currently_due" or "past_due" means onboarding is incomplete
 *
 * GET (no body needed)
 * Response: {
 *   has_account: boolean,
 *   account_id?: string,
 *   ready_to_receive_payments: boolean,
 *   onboarding_complete: boolean,
 *   transfers_status?: string,
 *   requirements_status?: string,
 *   requirements?: { currently_due: string[], past_due: string[] }
 * }
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
    // ── Env checks ──
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    // ── Auth ──
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

    // ── Look up connected account ID from profile ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_account_id) {
      return new Response(
        JSON.stringify({
          has_account: false,
          ready_to_receive_payments: false,
          onboarding_complete: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Create the Stripe Client ──
    const stripeClient = new Stripe(stripeKey);

    /**
     * V2 Account Retrieval with includes
     *
     * The `include` parameter fetches additional data in a single call:
     * - "configuration.recipient" → capabilities and their statuses
     * - "requirements" → what Stripe still needs from the account
     *
     * This avoids multiple API calls to check different aspects of the account.
     */
    let account;
    try {
      account = await stripeClient.v2.core.accounts.retrieve(
        profile.stripe_account_id,
        {
          include: ["configuration.recipient", "requirements"],
        }
      );
    } catch (stripeErr: any) {
      // If the V2 retrieve fails (e.g., account was created with V1),
      // fall back to V1 retrieval for backwards compatibility
      console.warn(
        "V2 account retrieve failed, falling back to V1:",
        stripeErr.message
      );
      const v1Account = await stripeClient.accounts.retrieve(
        profile.stripe_account_id
      );

      return new Response(
        JSON.stringify({
          has_account: true,
          account_id: v1Account.id,
          ready_to_receive_payments: v1Account.charges_enabled === true,
          onboarding_complete: v1Account.details_submitted === true,
          transfers_status: v1Account.charges_enabled ? "active" : "pending",
          requirements_status: v1Account.details_submitted
            ? "met"
            : "currently_due",
          requirements: v1Account.requirements
            ? {
                currently_due: v1Account.requirements.currently_due || [],
                past_due: v1Account.requirements.past_due || [],
              }
            : null,
          // Legacy V1 fields for backwards compatibility
          charges_enabled: v1Account.charges_enabled,
          payouts_enabled: v1Account.payouts_enabled,
          details_submitted: v1Account.details_submitted,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /**
     * Extract V2 status fields:
     *
     * readyToReceivePayments — true when the "stripe_transfers" capability
     *   under the recipient configuration is "active".  This means the
     *   operator's account can actually receive destination charge transfers.
     *
     * onboardingComplete — true when the requirements summary does NOT show
     *   "currently_due" or "past_due" status.  This means Stripe has all
     *   the information it needs (for now).
     */
    const transfersStatus =
      account?.configuration?.recipient?.capabilities?.stripe_balance
        ?.stripe_transfers?.status;

    const readyToReceivePayments = transfersStatus === "active";

    const requirementsStatus =
      account?.requirements?.summary?.minimum_deadline?.status;

    const onboardingComplete =
      requirementsStatus !== "currently_due" &&
      requirementsStatus !== "past_due";

    // Extract any pending requirement entries for display
    const entries = account?.requirements?.entries || [];
    const currentlyDue = entries
      .filter((e: any) => e.status === "currently_due")
      .map((e: any) => e.title || e.type || "Unknown requirement");
    const pastDue = entries
      .filter((e: any) => e.status === "past_due")
      .map((e: any) => e.title || e.type || "Unknown requirement");

    return new Response(
      JSON.stringify({
        has_account: true,
        account_id: account.id,
        ready_to_receive_payments: readyToReceivePayments,
        onboarding_complete: onboardingComplete,
        transfers_status: transfersStatus || "pending",
        requirements_status: requirementsStatus || "met",
        requirements:
          currentlyDue.length > 0 || pastDue.length > 0
            ? { currently_due: currentlyDue, past_due: pastDue }
            : null,
        // Legacy V1 fields for backwards compatibility with existing UI
        charges_enabled: readyToReceivePayments,
        payouts_enabled: readyToReceivePayments,
        details_submitted: onboardingComplete,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("stripe-account-status error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
