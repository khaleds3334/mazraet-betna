"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Icon } from "@/components/ui";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { closeOverlay, openOverlay } from "@/lib/overlayStack";
import { cn } from "@/lib/utils";

/** Long enough that the screen is read first, short enough to still belong to it. */
const APPEAR_AFTER_MS = 1200;
/** Matches `install-crumble` in globals.css — the sheet leaves before it unmounts. */
const CRUMBLE_MS = 620;

/**
 * «ثبّت التطبيق على موبايلك» — the sheet that offers to put the app on the home
 * screen (FR-2).
 *
 * One component for both halves of the site. They are two installed apps with
 * two manifests and two icons, and the sheet says different things about each,
 * so every word it shows arrives as a prop — nothing about «لوحة التحكم» is
 * written into a component the customer app also renders.
 *
 * **Two states, because the phones differ.** Chrome hands over an install prompt
 * and the button opens it. iOS has no such API at all — Safari installs from its
 * own share menu — so there the sheet stops offering and starts explaining, and
 * `manualSteps` is what it says. It is never shown on a browser that can do
 * neither (`useInstallPrompt` returns nothing), so there is no third state where
 * the button lies.
 *
 * **It arrives slowly and leaves in pieces.** Everything else in the app appears
 * because a finger asked for it, in 200–300ms. This one appears on its own, a
 * beat after the screen has settled, and rises at half that speed — a thing that
 * arrives at the pace of an answer, when nothing was asked, reads as a fault.
 * «لاحقا» crumbles it rather than sliding it back down, so dismissing looks like
 * an end rather than a retreat (Khaled, 2026-08-22).
 *
 * «لاحقا» means later: it stays away for a week, not forever.
 */
export function InstallPrompt({
  app,
  title,
  body,
  installLabel,
  laterLabel,
  manualSteps,
}: {
  app: "admin" | "customer";
  title: string;
  body: string;
  /** The button that opens the phone's own install prompt. */
  installLabel: string;
  laterLabel: string;
  /** What to do instead, on iOS — one line per step, in order. */
  manualSteps: string[];
}) {
  const hydrated = useIsHydrated();
  const { offer, snooze } = useInstallPrompt(app);

  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // A beat after the screen has settled. Straight away and it competes with the
  // page loading; much later and it interrupts something already being read.
  useEffect(() => {
    if (!offer) return;
    const id = setTimeout(() => setShown(true), APPEAR_AFTER_MS);
    return () => clearTimeout(id);
  }, [offer]);

  // The back gesture dismisses it like any other overlay (T-55) — and dismissing
  // is «لاحقا», not "never", so it goes through the same exit.
  const dismiss = useRef(() => {});
  dismiss.current = () => {
    if (leaving) return;
    setLeaving(true);
    const id = setTimeout(() => {
      setShown(false);
      setLeaving(false);
      snooze();
    }, CRUMBLE_MS);
    timers.current.push(id);
  };

  useEffect(() => {
    if (!shown) return;
    const id = openOverlay(() => dismiss.current());
    return () => closeOverlay(id);
  }, [shown]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  if (!hydrated || !shown || !offer) return null;

  return createPortal(
    <>
      {/* Dimmed, not blurred: the sheet interrupts a screen the admin may be
          halfway through reading, and it should stay readable behind it. */}
      <div
        aria-hidden
        onClick={() => dismiss.current()}
        className={cn(
          "fixed inset-0 z-50 bg-black/25 transition-opacity duration-500",
          leaving ? "opacity-0" : "opacity-100",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] flex-col gap-5",
          "rounded-t-xl border-t-2 border-border bg-background px-screen pt-6",
          leaving
            ? "install-crumbling"
            : "[animation:install-rise_620ms_cubic-bezier(0.16,1,0.3,1)]",
        )}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon name="add" size={44} className="text-brand" aria-hidden />
          <p className="text-h6 font-bold text-heading">{title}</p>
          <p className="text-base text-foreground">{body}</p>
        </div>

        {offer.kind === "manual" ? (
          // Nothing to press: iOS installs from Safari's own share menu, so the
          // sheet stops offering and says where to go.
          <ol className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3">
            {manualSteps.map((step, index) => (
              <li
                key={step}
                className="flex items-start gap-2 text-right text-base text-foreground"
              >
                <span className="font-bold text-brand">{index + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <Button onClick={() => void offer.install()}>{installLabel}</Button>
        )}

        <button
          type="button"
          onClick={() => dismiss.current()}
          className="flex min-h-11 items-center justify-center text-base text-muted"
        >
          {laterLabel}
        </button>
      </div>
    </>,
    document.body,
  );
}
