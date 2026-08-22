"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/components/ui";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { closeOverlay, openOverlay } from "@/lib/overlayStack";
import { cn } from "@/lib/utils";

/** Long enough that the screen is read first, short enough to still belong to it. */
const APPEAR_AFTER_MS = 1200;
/** Matches `install-crumble` in globals.css — the banner leaves before it unmounts. */
const CRUMBLE_MS = 620;

/**
 * `C-Comp_PWA_InstallBanner` (Figma 3799:4013) — the banner that offers to put
 * the app on the home screen (FR-2).
 *
 * One component for both halves of the site. They are two installed apps with
 * two manifests and two icons, and the banner says different things about each,
 * so every word arrives as a prop — nothing about «لوحة التحكم» is written into
 * a component the customer app also renders.
 *
 * **Two states, because the phones differ.** Chrome hands over an install prompt
 * and «تحميل» opens it. iOS has no such API — Safari installs from its own share
 * menu — so there «تحميل» turns the second line into the way to do it by hand.
 * The design draws one banner; this is the same banner saying something else,
 * which is the only shape it has for a thing it cannot do. It never appears on a
 * browser that can do neither, so «تحميل» never lies.
 *
 * **It arrives slowly and leaves in pieces.** Everything else in the app appears
 * because a finger asked for it, in 200–300ms. This appears on its own, a beat
 * after the screen has settled, and rises at half that speed — something that
 * arrives at the pace of an answer, when nothing was asked, reads as a fault.
 * «لاحقا» crumbles it rather than sliding it back down, so dismissing looks like
 * an end rather than a retreat (Khaled, 2026-08-22).
 *
 * It dims and blurs the screen behind it like every other popup in the app. It
 * is small and sits low, and without the scrim it read as part of the page it
 * had landed on rather than something asking a question (Khaled, 2026-08-22).
 * The scrim is the `Modal` treatment — dim plus a light blur — because this is a
 * popup, not the sheet the first version made it. **It is the one overlay here
 * that a tap outside does not close**: the banner asks a question with its two
 * answers written on it, and a tap on the dimmed page is neither.
 *
 * **«لاحقا» is for this visit only.** Nothing is written to the device: open the
 * app again and the banner is there again (Khaled, 2026-08-22). It stops for good
 * only when the app is actually installed, which `appinstalled` and the
 * standalone check both catch.
 */
export function InstallPrompt({
  app,
  title,
  body,
  manualBody,
  installLabel,
  laterLabel,
}: {
  app: "admin" | "customer";
  /** Bold first line — «لسهولة الوصول للوحة التحكم». */
  title: string;
  /** The line under it — what installing gets you. */
  body: string;
  /** Replaces `body` on iOS, where installing is done by hand. */
  manualBody: string;
  installLabel: string;
  laterLabel: string;
}) {
  const hydrated = useIsHydrated();
  const { offer, dismiss } = useInstallPrompt(app);

  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showingHow, setShowingHow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A beat after the screen has settled. Straight away and it competes with the
  // page loading; much later and it interrupts something already being read.
  useEffect(() => {
    if (!offer) return;
    const id = setTimeout(() => setShown(true), APPEAR_AFTER_MS);
    return () => clearTimeout(id);
  }, [offer]);

  // Held in a ref so the overlay registration below can call the current one
  // without re-registering the banner every render.
  const leave = useRef(() => {});
  leave.current = () => {
    if (leaving) return;
    setLeaving(true);
    timer.current = setTimeout(() => {
      setShown(false);
      setLeaving(false);
      dismiss();
    }, CRUMBLE_MS);
  };

  // The back gesture dismisses it like any other overlay (T-55).
  useEffect(() => {
    if (!shown) return;
    const id = openOverlay(() => leave.current());
    return () => closeOverlay(id);
  }, [shown]);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  if (!hydrated || !shown || !offer) return null;

  function onInstall() {
    // iOS has nothing to open, so the banner explains instead.
    if (offer?.kind === "manual") {
      setShowingHow(true);
      return;
    }
    void offer?.install();
  }

  return createPortal(
    <>
      {/* Same dim + blur as `Modal`, but **it does not close on a tap** — unlike
          every other overlay here (Khaled, 2026-08-22). The others are things
          the admin opened and can wave away; this one arrived on its own and
          asks a question with two answers on it. A tap on the dimmed page is
          neither of them, and dismissing on one would spend «لاحقا» for a finger
          that was reaching for the screen underneath.

          It fades rather than crumbling: the specks belong to the thing that
          came apart, not to the room behind it. */}
      <div
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]",
          leaving
            ? "opacity-0 transition-opacity duration-500"
            : "opacity-100 [animation:install-scrim_620ms_ease-out]",
        )}
      />

      {/* Above the tab bar rather than over it: the banner interrupts, it does
          not take the screen, and where it sits is where the design puts it. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "fixed inset-x-0 z-50 mx-auto w-full max-w-[430px] px-screen",
          leaving
            ? "install-crumbling"
            : "[animation:install-rise_620ms_cubic-bezier(0.16,1,0.3,1)]",
        )}
        style={{ bottom: "calc(84px + env(safe-area-inset-bottom))" }}
      >
        <div className="flex flex-col gap-3 rounded-[10px] border-2 border-border bg-surface-page px-4 py-4 shadow-[0px_4px_12px_2px_rgba(63,98,70,0.4)]">
          {/* Logo on the inline-end, words on the inline-start — in RTL the
              first child lands on the right, and the design puts the text
              there. */}
          <div className="flex items-center gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3 text-right">
              <p className="text-base font-bold leading-tight text-primary-foreground">
                {title}
              </p>
              <p className="text-sm leading-tight text-foreground">
                {offer.kind === "manual" && showingHow ? manualBody : body}
              </p>
            </div>

            <div className="flex size-13 shrink-0 items-center justify-center rounded-[14px] border border-border bg-white shadow-[0px_4px_8px_0px_rgba(63,98,70,0.18)]">
              <Image
                src="/images/logo-primary.png"
                alt=""
                width={36}
                height={38}
                className="h-[38px] w-9 object-contain"
              />
            </div>
          </div>

          {/* «تحميل» first so it lands on the right, the divider between them. */}
          <div className="flex items-center justify-around">
            <button
              type="button"
              onClick={onInstall}
              className="flex min-h-11 items-center gap-0.5 text-base font-bold text-foreground"
            >
              {installLabel}
              <Icon name="download" size={18} aria-hidden />
            </button>

            <span aria-hidden className="h-5 w-px shrink-0 bg-foreground/85" />

            <button
              type="button"
              onClick={() => leave.current()}
              className="flex min-h-11 items-center text-base font-bold text-foreground"
            >
              {laterLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
