/**
 * stripe-webhooks
 *
 * Receives and processes Stripe webhook events using THIN EVENT parsing.
 *
 * ── Thin Events (V2 Connect) ──
 * V2 connected accounts send "thin" events — small payloads containing
 * only the event type and ID, not the full object data.  After verifying
 * the signature and parsing the thin event, we must fetch the full event
 * data using stripeClient.v2.core.events.retrieve(thinEvent.id).
 *
 * ── Handled Event Types ──
 *   • v2.core.account[requirements].updated
 *     → Requirements changed on a connected account
 *   • v2.core.account[configuration.recipient].capability_status_updated
 *     → Capability status changed (e.g., transfers became active)
 *   • checkout.session.completed (V1 event, still sent normally)
 *     → Payment completed through hosted checkout
 *
 * ── Webhook Verification ──
 * Uses stripeClient.parseThinEvent() which handles both signature
 * verification and thin event deserialization in one step.
 *
 * ── Security ──
 * This function does NOT verify JWTs — Stripe sends raw HTTP POSTs.
 * Authentication is handled entirely via webhook signature verification.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@20.4.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // ── CORS preflight ──
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
          "Add it in project secrets. Find it in Stripe Dashboard → Developers → Webhooks."
      );
      return new Response("Server misconfigured", { status: 500 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables.");
      return new Response("Server misconfigured", { status: 500 });
    }

    // ── Read raw body and signature for verification ──
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.warn("Webhook received without stripe-signature header.");
      return new Response("Missing stripe-signature", { status: 400 });
    }

    // ── Create the Stripe Client (used for ALL Stripe requests) ──
    const stripeClient = new Stripe(stripeKey);

    // ── Initialize Supabase client (service role for DB writes) ──
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    /**
     * ── Parse Thin Event ──
     *
     * stripeClient.parseThinEvent() does two things:
     * 1. Verifies the webhook signature (prevents forged events)
     * 2. Parses the thin event payload into a typed object
     *
     * Thin events contain:
     * - id: the event ID (used to fetch full data)
     * - type: the event type string
     * - created: timestamp
     * - context: account ID and other context
     *
     * They do NOT contain the full object data — that must be
     * fetched separately using v2.core.events.retrieve().
     */
    let thinEvent: Stripe.ThinEvent;
    try {
      thinEvent = stripeClient.parseThinEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown";
      console.error(`Thin event parsing/verification failed: ${msg}`);
      return new Response(`Webhook verification failed: ${msg}`, {
        status: 400,
      });
    }

    console.log(
      `[stripe-webhooks] Thin event received: type=${thinEvent.type}, id=${thinEvent.id}`
    );

    // ── Route by event type ──
    switch (thinEvent.type) {
      /**
       * v2.core.account[requirements].updated
       * ─────────────────────────────────────────────────────
       * Fired when requirements change on a connected account.
       * This happens when:
       * - Stripe needs additional information (regulatory changes)
       * - The account owner provides requested information
       * - Verification checks complete or fail
       *
       * We fetch the full event to get the account ID, then
       * retrieve the full account to update our local records.
       */
      case "v2.core.account_requirements.updated":
      case "v2.core.account[requirements].updated": {
        console.log(
          `[requirements.updated] Fetching full event ${thinEvent.id}...`
        );

        // Fetch the full event data from Stripe
        const fullEvent = await stripeClient.v2.core.events.retrieve(
          thinEvent.id
        );

        // Extract the account ID from the event's related object
        const accountId =
          (fullEvent as any).data?.account_id ||
          (fullEvent as any).related_object?.id ||
          (fullEvent as any).context;

        if (accountId) {
          console.log(
            `[requirements.updated] Account: ${accountId}`
          );

          // Fetch current account status with recipient config
          try {
            const account = await stripeClient.v2.core.accounts.retrieve(
              accountId,
              { include: ["configuration.recipient", "requirements"] }
            );

            // Check if the account can now receive payments
            const transfersStatus =
              account?.configuration?.recipient?.capabilities?.stripe_balance
                ?.stripe_transfers?.status;
            const isActive = transfersStatus === "active";

            // Check requirements status
            const reqStatus =
              account?.requirements?.summary?.minimum_deadline?.status;

            console.log(
              `[requirements.updated] transfers=${transfersStatus}, ` +
                `requirements=${reqStatus}, active=${isActive}`
            );

            // Update local profile record
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ stripe_onboarded: isActive })
              .eq("stripe_account_id", accountId);

            if (updateError) {
              console.error(
                `[requirements.updated] DB update failed:`,
                updateError
              );
            }
          } catch (retrieveErr) {
            // V2 retrieve may fail for V1 accounts — try V1 fallback
            console.warn(
              `[requirements.updated] V2 retrieve failed, trying V1...`
            );
            const v1Account = await stripeClient.accounts.retrieve(accountId);
            await supabase
              .from("profiles")
              .update({ stripe_onboarded: v1Account.charges_enabled === true })
              .eq("stripe_account_id", accountId);
          }
        }
        break;
      }

      /**
       * v2.core.account[configuration.recipient].capability_status_updated
       * ─────────────────────────────────────────────────────
       * Fired when a capability status changes on a connected account.
       * Most importantly, this fires when the "stripe_transfers"
       * capability becomes "active", meaning the account can now
       * receive destination charge transfers.
       *
       * We fetch the full event, then retrieve the account to check
       * whether transfers are now active.
       */
      case "v2.core.account_configuration_recipient.capability_status_updated":
      case "v2.core.account[configuration.recipient].capability_status_updated": {
        console.log(
          `[capability.updated] Fetching full event ${thinEvent.id}...`
        );

        // Fetch the full event data
        const fullEvent = await stripeClient.v2.core.events.retrieve(
          thinEvent.id
        );

        const accountId =
          (fullEvent as any).data?.account_id ||
          (fullEvent as any).related_object?.id ||
          (fullEvent as any).context;

        if (accountId) {
          console.log(`[capability.updated] Account: ${accountId}`);

          try {
            // Retrieve the full account to get current capability status
            const account = await stripeClient.v2.core.accounts.retrieve(
              accountId,
              { include: ["configuration.recipient"] }
            );

            const transfersStatus =
              account?.configuration?.recipient?.capabilities?.stripe_balance
                ?.stripe_transfers?.status;
            const isActive = transfersStatus === "active";

            console.log(
              `[capability.updated] transfers_status=${transfersStatus}, ` +
                `active=${isActive}`
            );

            // Update local profile — operator can receive payments when active
            const { error: updateError } = await supabase
              .from("profiles")
              .update({ stripe_onboarded: isActive })
              .eq("stripe_account_id", accountId);

            if (updateError) {
              console.error(
                `[capability.updated] DB update failed:`,
                updateError
              );
            }
          } catch (retrieveErr) {
            console.warn(
              `[capability.updated] V2 retrieve failed, trying V1...`
            );
            const v1Account = await stripeClient.accounts.retrieve(accountId);
            await supabase
              .from("profiles")
              .update({ stripe_onboarded: v1Account.charges_enabled === true })
              .eq("stripe_account_id", accountId);
          }
        }
        break;
      }

      /**
       * checkout.session.completed (V1 event)
       * ─────────────────────────────────────────────────────
       * Standard V1 event — still comes as a full payload (not thin).
       * We handle it here for checkout completion tracking.
       *
       * For destination charges, at this point:
       * - Platform has collected the full payment
       * - application_fee_amount is retained by the platform
       * - Remaining funds are queued for transfer to connected account
       */
      case "checkout.session.completed": {
        // V1 events still carry full data — parse with constructEvent
        try {
          const v1Event = await stripeClient.webhooks.constructEventAsync(
            rawBody,
            signature,
            webhookSecret
          );
          const session = v1Event.data.object as Stripe.Checkout.Session;

          console.log(
            `[checkout.completed] Session ${session.id}: ` +
              `payment_status=${session.payment_status}, ` +
              `amount_total=${session.amount_total}`
          );

          const productId = session.metadata?.platform_product_id;
          const buyerId = session.metadata?.buyer_id;
          const sellerAccount = session.metadata?.seller_connected_account;
          const jobId = session.metadata?.job_id;
          const paymentIntentId =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id;

          if (productId) {
            console.log(
              `[checkout.completed] Product: ${productId}, ` +
                `Buyer: ${buyerId}, Seller: ${sellerAccount}`
            );
          }

          // ── Escrow flow: store the PaymentIntent on the job and mark funded ──
          // The funds now sit on the platform balance and will only be transferred
          // to the operator after the grower approves the work. The release is
          // performed by the `stripe-release-payout` edge function.
          if (jobId && paymentIntentId) {
            const amountDollars =
              typeof session.amount_total === "number"
                ? session.amount_total / 100
                : null;

            const { error: updErr } = await supabase
              .from("jobs")
              .update({
                payment_intent_id: paymentIntentId,
                funding_status: "funded",
                funded_amount: amountDollars,
                funded_at: new Date().toISOString(),
              } as any)
              .eq("id", jobId);

            if (updErr) {
              console.error(
                `[checkout.completed] Failed to mark job ${jobId} funded:`,
                updErr
              );
            } else {
              console.log(
                `[checkout.completed] Job ${jobId} → funded ` +
                  `(payment_intent=${paymentIntentId})`
              );
            }
          }
        } catch (v1Err) {
          console.error("[checkout.completed] V1 parse error:", v1Err);
        }
        break;
      }

      // ── Unhandled event types ──
      default:
        console.log(
          `[stripe-webhooks] Unhandled event type: ${thinEvent.type}`
        );
    }

    // ── Always return 200 to acknowledge receipt ──
    // Stripe retries events that don't get a 2xx response.
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // ── Catch-all — return 500 so Stripe retries ──
    console.error("[stripe-webhooks] Unhandled error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
