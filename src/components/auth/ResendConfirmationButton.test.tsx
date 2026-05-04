import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { ResendConfirmationButton } from "./ResendConfirmationButton";

/**
 * Verifies the screen-reader live region:
 *  - announces on cooldown start
 *  - announces every 5s
 *  - announces every second in the final 3s
 *  - announces "available" on end, then stays silent
 */

const liveRegion = () => {
  const node = screen.getByRole("status");
  return (node.textContent || "").trim();
};

const advance = (seconds: number) => {
  act(() => {
    vi.advanceTimersByTime(seconds * 1000);
  });
};

describe("ResendConfirmationButton aria-live announcements", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces start, 5s intervals, final 3s, and end", async () => {
    const onResend = vi.fn().mockResolvedValue(true);
    render(
      <ResendConfirmationButton
        onResend={onResend}
        cooldownSeconds={10}
        label="Resend"
      />
    );

    // Idle: live region holds the "available" text (no countdown leaking in).
    expect(liveRegion()).toBe("Resend is now available.");

    // Start the cooldown by clicking.
    const btn = screen.getByRole("button", { name: "Resend" });
    await act(async () => {
      fireEvent.click(btn);
      await Promise.resolve(); // flush onResend microtask
    });

    // t=10 (start): announced.
    expect(liveRegion()).toBe("Resend available in 10 seconds.");

    advance(1); // t=9 — silent (not 5x, >3)
    expect(liveRegion()).toBe("");
    advance(1); // t=8 — silent
    expect(liveRegion()).toBe("");
    advance(1); // t=7 — silent
    expect(liveRegion()).toBe("");
    advance(1); // t=6 — silent
    expect(liveRegion()).toBe("");
    advance(1); // t=5 — 5-multiple, announced
    expect(liveRegion()).toBe("Resend available in 5 seconds.");
    advance(1); // t=4 — silent
    expect(liveRegion()).toBe("");
    advance(1); // t=3 — final 3
    expect(liveRegion()).toBe("Resend available in 3 seconds.");
    advance(1); // t=2
    expect(liveRegion()).toBe("Resend available in 2 seconds.");
    advance(1); // t=1 (singular)
    expect(liveRegion()).toBe("Resend available in 1 second.");
    advance(1); // t=0 — end
    expect(liveRegion()).toBe("Resend is now available.");

    // Cooldown stopped: further time passes without re-announcing countdowns.
    advance(5);
    expect(liveRegion()).toBe("Resend is now available.");
  });

  it("uses translated messages when provided", async () => {
    const onResend = vi.fn().mockResolvedValue(true);
    render(
      <ResendConfirmationButton
        onResend={onResend}
        cooldownSeconds={5}
        label="Renvoyer"
        messages={{
          ariaCountdown: (s) => `Renvoi disponible dans ${s} s.`,
          ariaAvailable: "Renvoi disponible.",
        }}
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Renvoyer" }));
      await Promise.resolve();
    });

    expect(liveRegion()).toBe("Renvoi disponible dans 5 s.");
    for (let i = 0; i < 5; i++) advance(1);
    expect(liveRegion()).toBe("Renvoi disponible.");
  });
});
