import {
  useEffect,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ResendConfirmationButtonHandle {
  /** Start the cooldown externally (e.g. after an external send succeeded). */
  startCooldown: (seconds?: number) => void;
}

/**
 * Localizable string set for the countdown UI. Every entry is either a plain
 * string or a formatter that receives the remaining seconds, so callers can
 * supply translations (and language-appropriate plural rules) from any i18n
 * library (react-intl, i18next, lingui, etc.).
 *
 * Defaults are English and preserve the current copy.
 */
export interface ResendConfirmationMessages {
  /** Button label while counting down. */
  buttonCountdown: (seconds: number) => string;
  /** Helper line under the button while counting down. */
  helper: (seconds: number) => string;
  /** Tooltip shown over the disabled button while counting down. */
  tooltip: (seconds: number) => string;
  /** Announced to screen readers while counting down (throttled). */
  ariaCountdown: (seconds: number) => string;
  /** Announced to screen readers when the cooldown ends. */
  ariaAvailable: string;
}

const defaultMessages: ResendConfirmationMessages = {
  buttonCountdown: (s) => `Resend in ${s}s`,
  helper: (s) => `Resend available in ${s} second${s === 1 ? "" : "s"}.`,
  tooltip: (s) =>
    `To prevent spam, you can resend in ${s} second${s === 1 ? "" : "s"}.`,
  ariaCountdown: (s) =>
    `Resend available in ${s} second${s === 1 ? "" : "s"}.`,
  ariaAvailable: "Resend is now available.",
};

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
   * When true (default), show a "Resend available in Xs" helper line under
   * the button while the cooldown is active.
   */
  showHelperText?: boolean;
  /**
   * Optional storage key. When provided, the cooldown's expiry timestamp is
   * persisted to localStorage so a page refresh keeps the button disabled
   * for the remaining time. Use a stable, per-context key (e.g. an email).
   */
  storageKey?: string;
  /**
   * Optional translated/overridden copy for the countdown UI. Any keys you
   * omit fall back to the English defaults.
   */
  messages?: Partial<ResendConfirmationMessages>;
}

/**
 * Shared "Resend confirmation email" button with a built-in countdown.
 * Used by both Login (post-failed-signin) and Signup (post-signup confirmation pending).
 */
export const ResendConfirmationButton = forwardRef<ResendConfirmationButtonHandle, Props>(
  function ResendConfirmationButton(
    {
      onResend,
      cooldownSeconds = 30,
      label = "Resend confirmation email",
      className,
      variant = "outline",
      disabled = false,
      showHelperText = true,
      storageKey,
      messages,
    },
    ref
  ) {
    const t: ResendConfirmationMessages = { ...defaultMessages, ...messages };
    const [busy, setBusy] = useState(false);
    const fullStorageKey = storageKey ? `ph_resend_cooldown:${storageKey}` : null;

    // Anchor the countdown to an absolute wall-clock deadline (ms) instead of
    // a decrementing counter. We re-derive the remaining seconds on every
    // tick from `Date.now()`, so React re-renders, slow timers, throttled
    // background tabs, and refresh-from-storage all read the same source of
    // truth and never drift off-by-one from the real time remaining.
    const readPersistedDeadline = (): number | null => {
      if (!fullStorageKey || typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(fullStorageKey);
        if (!raw) return null;
        const expiresAt = parseInt(raw, 10);
        if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
        return expiresAt;
      } catch {
        return null;
      }
    };

    const [deadline, setDeadline] = useState<number | null>(() =>
      readPersistedDeadline()
    );
    // `now` is bumped on a sub-second interval so the derived `cooldown`
    // value updates as the wall clock advances.
    const [now, setNow] = useState<number>(() => Date.now());

    const computeRemaining = (d: number | null, n: number): number =>
      d ? Math.max(0, Math.ceil((d - n) / 1000)) : 0;

    const cooldown = computeRemaining(deadline, now);

    // Re-sync from storage on key change (e.g. user typed a different email).
    useEffect(() => {
      setDeadline(readPersistedDeadline());
      setNow(Date.now());
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullStorageKey]);

    // Drive the visible countdown. We tick every 250ms so the second-boundary
    // transition is captured promptly even if a tick is delayed; remaining is
    // always recomputed from `Date.now()`, so no decrement drift is possible.
    useEffect(() => {
      if (!deadline) return;
      const id = window.setInterval(() => {
        const n = Date.now();
        setNow(n);
        if (n >= deadline) {
          setDeadline(null);
          if (fullStorageKey) {
            try {
              window.localStorage.removeItem(fullStorageKey);
            } catch {
              /* ignore */
            }
          }
        }
      }, 250);
      return () => window.clearInterval(id);
    }, [deadline, fullStorageKey]);

    // Re-sync when the tab becomes visible again — `setInterval` is throttled
    // in background tabs, so without this the displayed seconds could lag the
    // real wall clock for a beat after returning.
    useEffect(() => {
      if (typeof document === "undefined") return;
      const onVisible = () => {
        if (document.visibilityState === "visible") {
          setDeadline(readPersistedDeadline() ?? deadline);
          setNow(Date.now());
        }
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => document.removeEventListener("visibilitychange", onVisible);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullStorageKey, deadline]);

    const startCooldownAt = useCallback(
      (seconds: number) => {
        if (seconds <= 0) {
          setDeadline(null);
          if (fullStorageKey && typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(fullStorageKey);
            } catch {
              /* ignore */
            }
          }
          return;
        }
        const d = Date.now() + seconds * 1000;
        setDeadline(d);
        setNow(Date.now());
        if (fullStorageKey && typeof window !== "undefined") {
          try {
            window.localStorage.setItem(fullStorageKey, String(d));
          } catch {
            /* ignore storage errors (private mode, quota, etc.) */
          }
        }
      },
      [fullStorageKey]
    );

    useImperativeHandle(ref, () => ({
      startCooldown: (seconds?: number) => {
        startCooldownAt(seconds ?? cooldownSeconds);
      },
    }));

    const handleClick = async () => {
      if (busy || cooldown > 0) return;
      setBusy(true);
      try {
        const result = await onResend();
        if (result !== false) {
          startCooldownAt(cooldownSeconds);
        }
      } finally {
        setBusy(false);
      }
    };

    // Track the "starting" second so the SR live region announces on start
    // regardless of cooldownSeconds (otherwise a deadline-derived value may
    // skip the first equality with cooldownSeconds).
    const startSecondRef = useRef<number | null>(null);
    useEffect(() => {
      if (deadline) {
        startSecondRef.current = computeRemaining(deadline, Date.now());
      } else {
        startSecondRef.current = null;
      }
    }, [deadline]);

    const onCooldown = cooldown > 0;
    const tooltipMessage = onCooldown ? t.tooltip(cooldown) : "";

    // Throttle screen-reader announcements: announce on start, every 5s,
    // and for each of the final 3 seconds. Avoids per-second SR spam while
    // still reliably updating assistive tech.
    const shouldAnnounce =
      onCooldown &&
      (cooldown <= 3 ||
        cooldown % 5 === 0 ||
        cooldown === startSecondRef.current);
    const announcement = shouldAnnounce
      ? t.ariaCountdown(cooldown)
      : !onCooldown
        ? t.ariaAvailable
        : "";

    const button = (
      <Button
        type="button"
        variant={variant}
        className={cn("w-full", className)}
        onClick={handleClick}
        disabled={busy || onCooldown || disabled}
      >
        {busy && <Loader2 size={16} className="animate-spin mr-2" />}
        {onCooldown ? t.buttonCountdown(cooldown) : label}
      </Button>
    );

    return (
      <div className="w-full">
        {onCooldown ? (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              {/* asChild lets the disabled button still trigger the tooltip */}
              <TooltipTrigger asChild>
                <span className="inline-block w-full">{button}</span>
              </TooltipTrigger>
              <TooltipContent side="top">{tooltipMessage}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          button
        )}
        {showHelperText && onCooldown && (
          <div
            className="mt-2 flex items-center justify-center gap-1.5 text-muted-foreground"
            aria-hidden="true"
          >
            <Clock size={11} className="shrink-0" />
            <span className="text-[11px] leading-none tabular-nums truncate">
              {t.helper(cooldown)}
            </span>
          </div>
        )}
        {/* Screen-reader-only live region with throttled updates. */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
      </div>
    );
  }
);