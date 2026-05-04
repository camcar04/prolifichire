import type { AuthError } from "@supabase/supabase-js";

export interface ResendErrorInfo {
  /** User-facing message safe to surface in a toast. */
  message: string;
  /** Should the resend cooldown still be applied? True for rate-limit cases. */
  applyCooldown: boolean;
  /** If the server tells us to wait N seconds, surface it for caller-driven cooldown. */
  retryAfterSeconds?: number;
  /** Stable category for logging / analytics. */
  category:
    | "rate_limited"
    | "invalid_email"
    | "already_confirmed"
    | "user_not_found"
    | "network"
    | "unknown";
}

/**
 * Map a Supabase auth error from `supabase.auth.resend(...)` (or similar) into
 * an actionable, user-facing message. Detects rate-limit / invalid-email /
 * already-confirmed cases by code first, then falls back to message-substring
 * matching for older Supabase versions that don't populate `code`.
 */
export function interpretResendError(error: AuthError | Error | null | undefined): ResendErrorInfo {
  if (!error) {
    return { message: "Unknown error.", applyCooldown: false, category: "unknown" };
  }

  const anyErr = error as any;
  const code: string = (anyErr.code || anyErr.error_code || "").toString().toLowerCase();
  const status: number | undefined = anyErr.status;
  const raw = (error.message || "").toLowerCase();

  // Try to extract a "retry after N seconds" hint if the server sent one.
  const retryMatch = raw.match(/(?:after|in)\s+(\d+)\s*(?:second|sec|s)\b/);
  const retryAfterSeconds = retryMatch ? parseInt(retryMatch[1], 10) : undefined;

  // Rate limited
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    status === 429 ||
    raw.includes("rate limit") ||
    raw.includes("too many requests")
  ) {
    return {
      message: retryAfterSeconds
        ? `Too many resend attempts. Try again in ${retryAfterSeconds}s.`
        : "Too many resend attempts. Please wait a moment and try again.",
      applyCooldown: true,
      retryAfterSeconds,
      category: "rate_limited",
    };
  }

  // Invalid email format / address rejected
  if (
    code === "validation_failed" ||
    code === "email_address_invalid" ||
    raw.includes("invalid email") ||
    raw.includes("email address") && raw.includes("invalid")
  ) {
    return {
      message: "That email address looks invalid. Double-check and try again.",
      applyCooldown: false,
      category: "invalid_email",
    };
  }

  // Account already confirmed — resend is a no-op
  if (
    code === "email_address_already_confirmed" ||
    code === "user_already_confirmed" ||
    raw.includes("already confirmed") ||
    raw.includes("already verified")
  ) {
    return {
      message: "This email is already confirmed. Try signing in.",
      applyCooldown: false,
      category: "already_confirmed",
    };
  }

  // No such user
  if (
    code === "user_not_found" ||
    raw.includes("user not found") ||
    raw.includes("no user")
  ) {
    return {
      message: "No account found for that email. Check the address or sign up.",
      applyCooldown: false,
      category: "user_not_found",
    };
  }

  // Network / fetch failure
  if (raw.includes("failed to fetch") || raw.includes("network") || anyErr.name === "TypeError") {
    return {
      message: "Network error. Check your connection and try again.",
      applyCooldown: false,
      category: "network",
    };
  }

  return {
    message: "Could not resend. Try again in a moment.",
    applyCooldown: false,
    category: "unknown",
  };
}