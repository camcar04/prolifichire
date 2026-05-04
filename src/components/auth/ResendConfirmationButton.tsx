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
}

/**
 * Shared "Resend confirmation email" button with a built-in countdown.
 * Used by both Login (post-failed-signin) and Signup (post-signup confirmation pending).
 */
export const ResendConfirmationButton = forwardRef<ResendConfirmationButtonHandle, Props>(
  function ResendConfirmationButton(
    { onResend, cooldownSeconds = 30, label = "Resend confirmation email", className, variant = "outline", disabled = false },
    ref
  ) {
    const [busy, setBusy] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
      if (cooldown <= 0) return;
      const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
      return () => clearTimeout(t);
    }, [cooldown]);

    useImperativeHandle(ref, () => ({
      startCooldown: (seconds?: number) => setCooldown(seconds ?? cooldownSeconds),
    }));

    const handleClick = async () => {
      if (busy || cooldown > 0) return;
      setBusy(true);
      try {
        const result = await onResend();
        if (result !== false) setCooldown(cooldownSeconds);
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