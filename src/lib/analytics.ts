import { supabase } from "@/integrations/supabase/client";

/**
 * Marketing & analytics tracking helpers.
 *
 * All inserts are best-effort and silently ignored on failure so they
 * never block UX. Call sites should not await them in critical paths.
 */

export type UserEventType =
  | "signup_completed"
  | "onboarding_completed"
  | "first_job_posted"
  | "first_quote_submitted"
  | "job_funded"
  | "job_funding_initiated"
  | "stripe_connect_completed"
  | "first_payout_received";

/** Fire-and-forget page view insert. Caller must pass a user id. */
export function trackPageView(params: {
  userId: string;
  path: string;
  referrer?: string | null;
  userAgent?: string | null;
}) {
  void supabase
    .from("page_views")
    .insert({
      user_id: params.userId,
      path: params.path,
      referrer: params.referrer ?? null,
      user_agent: params.userAgent ?? null,
    })
    .then(() => {});
}

/** Fire-and-forget event insert. */
export function trackEvent(
  userId: string,
  eventType: UserEventType,
  eventData: Record<string, unknown> = {},
) {
  void supabase
    .from("user_events")
    .insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData as any,
    })
    .then(() => {});
}

/**
 * Track an event only the first time it ever happens for this user.
 * Used for "first_*" milestone events.
 */
export async function trackFirstTimeEvent(
  userId: string,
  eventType: UserEventType,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { count, error } = await supabase
      .from("user_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", eventType);
    if (error) return;
    if ((count ?? 0) > 0) return;
    await supabase.from("user_events").insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData as any,
    });
  } catch {
    // best-effort
  }
}

/** Read UTM/referral params from a URL search string. */
export function readUtmParams(search: string = window.location.search) {
  const params = new URLSearchParams(search);
  return {
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    referral_source: params.get("ref") || params.get("referral") || null,
  };
}
