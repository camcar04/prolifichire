/**
 * stripe-webhooks
 *
 * Receives Stripe webhook events and processes them.
 *
 * ── Thin Events (Stripe Connect V2) ──
 * Stripe Connect V2 sends "thin events" — small payloads containing only
 * the event type and a reference (account ID).  To get full details,
 * we fetch the account object from the Stripe API after verifying the event.
 *
 * Handled V2 event types:
 *   • account.updated                                        — classic Connect event
 *   • account.application.authorized / deauthorized          — app lifecycle
 *   • capability.updated                                     — capability changes
 *   • checkout.session.completed                             — payment completed
 *
 * The V2 thin-event equivalents we map to:
 *   • v2.account[requirements].updated
 *     → Stripe sends as `account.updated` with `requirements` changes
 *   • v2.account[configuration.recipient].capability_status_updated
 *     → Stripe sends as `capability.updated` on the connected account
 *
 * ── Webhook Verification ──
 * Every incoming request is verified using the STRIPE_WEBHOOK_SECRET
 * signing secret.  This prevents forged events from being processed.
 *
 * ── Security ──
 * This function must NOT verify JWTs — Stripe sends raw HTTP POSTs.
 * Authentication is handled entirely via webhook signature verification.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

/**
 * CORS headers — needed if the browser ever hits OPTIONS on this path,
 * though in practice webhooks come from Stripe servers, not browsers.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // ── CORS preflight (unlikely for webhooks, but safe) ──
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Environment validation ──
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is not configured.");
      return new Response("Server misconfigured", { status: 500 });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error(
        "STRIPE_WEBHOOK_SECRET is not configured. " +
          "Add it in project secrets. Find it in Stripe Dashboard → Webhooks."
      );
      return new Response("Server misconfigured", { status: 500 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables.");
      return new Response("Server misconfigured", { status: 500 });
    }

    // ── Read the raw body for signature verification ──
    // Stripe requires the EXACT raw body bytes to verify the signature.
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.warn("Webhook received without stripe-signature header.");
      return new Response("Missing stripe-signature", { status: 400 });
    }

    // ── Verify the webhook signature ──
    // This ensures the event actually came from Stripe and wasn't forged.
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        rawBody,
        signature,
        webhookSecret
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      console.error(`Webhook signature verification failed: ${msg}`);
      return new Response(`Webhook signature invalid: ${msg}`, { status: 400 });
    }

    // ── Initialize Supabase client (service role for DB writes) ──
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(
      `[stripe-webhooks] Received event: ${event.type} (${event.id})`
    );

    // ── Route by event type ──
    switch (event.type) {
      /**
       * account.updated
       * ─────────────────────────────────────────────────────
       * Fired whenever a connected account's details change.
       * This is the V2 thin-event equivalent of:
       *   v2.account[requirements].updated
       *
       * The thin event tells us "something changed on this account."
       * We fetch the full account to get current onboarding status
       * and update our local profile record.
       */
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        console.log(
          `[account.updated] Account ${account.id}: ` +
            `charges_enabled=${account.charges_enabled}, ` +
            `payouts_enabled=${account.payouts_enabled}, ` +
            `details_submitted=${account.details_submitted}`
        );

        // Log any outstanding requirements (these are what Stripe still needs)
        if (account.requirements) {
          const { currently_due, past_due, eventually_due } =
            account.requirements;
          if (past_due && past_due.length > 0) {
            console.warn(
              `[account.updated] PAST DUE requirements for ${account.id}:`,
              past_due
            );
          }
          if (currently_due && currently_due.length > 0) {
            console.log(
              `[account.updated] Currently due for ${account.id}:`,
              currently_due
            );
          }
          if (eventually_due && eventually_due.length > 0) {
            console.log(
              `[account.updated] Eventually due for ${account.id}:`,
              eventually_due
            );
          }
        }

        // ── Update local profile with latest onboarding status ──
        // We store stripe_onboarded = true only when charges are enabled,
        // meaning the operator can actually receive payments.
        const isOnboarded = account.charges_enabled === true;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ stripe_onboarded: isOnboarded })
          .eq("stripe_account_id", account.id);

        if (updateError) {
          console.error(
            `[account.updated] Failed to update profile for ${account.id}:`,
            updateError
          );
        } else {
          console.log(
            `[account.updated] Profile updated: stripe_onboarded=${isOnboarded}`
          );
        }
        break;
      }

      /**
       * capability.updated
       * ─────────────────────────────────────────────────────
       * Fired when a capability status changes on a connected account.
       * This is the V2 thin-event equivalent of:
       *   v2.account[configuration.recipient].capability_status_updated
       *
       * Capabilities include: card_payments, transfers, etc.
       * We log the status change and update onboarding if the key
       * "transfers" capability becomes active.
       */
      case "capability.updated": {
        const capability = event.data.object as Stripe.Capability;
        const acctId =
          typeof capability.account === "string"
            ? capability.account
            : capability.account?.id;

        console.log(
          `[capability.updated] Account ${acctId}: ` +
            `capability=${capability.id}, status=${capability.status}`
        );

        // ── If transfers capability is now active, the operator can receive payouts ──
        if (
          capability.id === "transfers" &&
          capability.status === "active" &&
          acctId
        ) {
          // Fetch the full account to confirm overall status
          const fullAccount = await stripe.accounts.retrieve(acctId);

          const isOnboarded = fullAccount.charges_enabled === true;

          const { error: updateError } = await supabase
            .from("profiles")
            .update({ stripe_onboarded: isOnboarded })
            .eq("stripe_account_id", acctId);

          if (updateError) {
            console.error(
              `[capability.updated] Failed to update profile for ${acctId}:`,
              updateError
            );
          } else {
            console.log(
              `[capability.updated] Profile updated after transfers active: ` +
                `stripe_onboarded=${isOnboarded}`
            );
          }
        }
        break;
      }

      /**
       * checkout.session.completed
       * ─────────────────────────────────────────────────────
       * Fired when a Checkout Session is successfully completed.
       * This confirms that the customer has paid.
       *
       * For destination charges, at this point:
       * - The platform has collected the full payment.
       * - The application_fee_amount is retained by the platform.
       * - The remaining funds are queued for transfer to the connected account.
       *
       * We log the completion for audit purposes.
       * In production, you would update order/invoice records here.
       */
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          `[checkout.session.completed] Session ${session.id}: ` +
            `payment_status=${session.payment_status}, ` +
            `amount_total=${session.amount_total}, ` +
            `customer=${session.customer}`
        );

        // Extract our custom metadata
        const productId = session.metadata?.platform_product_id;
        const buyerId = session.metadata?.buyer_id;
        const sellerAccount = session.metadata?.seller_connected_account;

        if (productId) {
          console.log(
            `[checkout.session.completed] Product: ${productId}, ` +
              `Buyer: ${buyerId}, Seller: ${sellerAccount}`
          );
        }

        // TODO: Create an order/transaction record in the database
        // TODO: Send confirmation notification to buyer and seller
        break;
      }

      /**
       * account.application.deauthorized
       * ─────────────────────────────────────────────────────
       * Fired when a connected account disconnects from the platform.
       * We should clear their Stripe data from our records.
       */
      case "account.application.deauthorized": {
        const application = event.data.object as { account?: string };
        const disconnectedAccountId = event.account || application?.account;

        if (disconnectedAccountId) {
          console.warn(
            `[account.application.deauthorized] Account ${disconnectedAccountId} ` +
              `disconnected from platform.`
          );

          // Clear Stripe references from the user's profile
          const { error: clearError } = await supabase
            .from("profiles")
            .update({
              stripe_account_id: null,
              stripe_onboarded: false,
            })
            .eq("stripe_account_id", disconnectedAccountId);

          if (clearError) {
            console.error(
              `[deauthorized] Failed to clear profile:`,
              clearError
            );
          }
        }
        break;
      }

      // ── Unhandled event types ──
      default:
        console.log(`[stripe-webhooks] Unhandled event type: ${event.type}`);
    }

    // ── Always return 200 to acknowledge receipt ──
    // Stripe will retry events that don't get a 2xx response,
    // so we return 200 even for unhandled types.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ── Catch-all error handler ──
    // Log the full error for debugging but return 500 so Stripe retries.
    console.error("[stripe-webhooks] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
