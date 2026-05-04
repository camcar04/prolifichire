import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResendConfirmationButtonHandle {
  /** Start the cooldown externally (e.g. after an external send succeeded). */
  startCooldown: (seconds?: number) => void;
}

interface Props {
  /** Async resend handler. Should throw / return false on failure to skip cooldown. */
  onResend: () => Promise<boolean | void>;
  /** Cooldown length in seconds. Default 30. */
  cooldownSeconds?: number;
  /** Idle button label. */
  label?: string;
  /** Tailwind className overrides for the Button. */
  className?: string;
  /** Button variant. */
  variant?: React.ComponentProps<typeof Button>["variant"];
  /** Disable independently of the cooldown (e.g. while parent is busy). */
  disabled?: boolean;
  /**
   * Optional storage key. When provided, the cooldown's expiry timestamp is
   * persisted to localStorage so a page refresh keeps the button disabled
   * for the remaining time. Use a stable, per-context key (e.g. an email).
   */
  storageKey?: string;
}

/**
 * Shared "Resend confirmation email" button with a built-in countdown.
 * Used by both Login (post-failed-signin) and Signup (post-signup confirmation pending).
 */
export const ResendConfirmationButton = forwardRef<ResendConfirmationButtonHandle, Props>(
  function ResendConfirmationButton(
    { onResend, cooldownSeconds = 30, label = "Resend confirmation email", className, variant = "outline", disabled = false, storageKey },
    ref
  ) {
    const [busy, setBusy] = useState(false);
    const fullStorageKey = storageKey ? `ph_resend_cooldown:${storageKey}` : null;

    const readPersistedRemaining = (): number => {
      if (!fullStorageKey || typeof window === "undefined") return 0;
      try {
        const raw = window.localStorage.getItem(fullStorageKey);
        if (!raw) return 0;
        const expiresAt = parseInt(raw, 10);
        if (!Number.isFinite(expiresAt)) return 0;
        const remaining = Math.ceil((expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      } catch {
        return 0;
      }
    };

    const [cooldown, setCooldown] = useState<number>(() => readPersistedRemaining());

    // Re-sync from storage on key change (e.g. user typed a different email).
    useEffect(() => {
      setCooldown(readPersistedRemaining());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullStorageKey]);

    useEffect(() => {
      if (cooldown <= 0) return;
      const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }, [cooldown]);

    const persistCooldown = (seconds: number) => {
      if (!fullStorageKey || typeof window === "undefined") return;
      try {
        if (seconds > 0) {
          window.localStorage.setItem(
            fullStorageKey,
            String(Date.now() + seconds * 1000)
          );
        } else {
          window.localStorage.removeItem(fullStorageKey);
        }
      } catch {
        // ignore storage errors (private mode, quota, etc.)
      }
    };

    // Clear persisted entry once countdown naturally hits 0.
    useEffect(() => {
      if (cooldown === 0) persistCooldown(0);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cooldown]);

    useImperativeHandle(ref, () => ({
      startCooldown: (seconds?: number) => {
        const s = seconds ?? cooldownSeconds;
        setCooldown(s);
        persistCooldown(s);
      },
    }));

    const handleClick = async () => {
      if (busy || cooldown > 0) return;
      setBusy(true);
      try {
        const result = await onResend();
        if (result !== false) {
          setCooldown(cooldownSeconds);
          persistCooldown(cooldownSeconds);
        }
      } finally {
        setBusy(false);
      }
    };

    return (
      <Button
        type="button"
        variant={variant}
        className={cn("w-full", className)}
        onClick={handleClick}
        disabled={busy || cooldown > 0 || disabled}
      >
        {busy && <Loader2 size={16} className="animate-spin mr-2" />}
        {cooldown > 0 ? `Resend in ${cooldown}s` : label}
      </Button>
    );
  }
);