"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { cn } from "@/lib/utils";

/**
 * A centered dialog over a dimmed, blurred scrim — the popup treatment (A-14
 * record-mortality and similar confirm dialogs), as opposed to the `BottomSheet`
 * that slides up from the bottom. The page behind stays mounted; tapping the
 * scrim or pressing Escape dismisses. The caller renders the card's contents.
 *
 * `header` is pinned to the top of the card while the body scrolls under it —
 * same contract as `BottomSheet`. The close button belongs there: a dialog whose
 * only way out has scrolled off the card is a dialog with no way out. The card
 * never grows past 85svh, so on a short phone (or with the keyboard up) the
 * content scrolls inside it instead of running off the screen.
 *
 * Sits on the dialog tier (z-55) of the layer ladder in globals.css — above the
 * sheets, below the toasts. Above the sheets because a dialog is opened *from*
 * one: the split dialog comes out of the weighing sheet and has to be answerable
 * over it. Never share a tier with another overlay — equal z-index is not a tie
 * the browser breaks by intent, it falls back to DOM order (T-40).
 */
export function Modal({
  open,
  onClose,
  label,
  header,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  /** Stays put while the body scrolls. Padding is supplied by the Modal. */
  header?: React.ReactNode;
  children: React.ReactNode;
}) {
  const hydrated = useIsHydrated();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Rendered into <body> for the same reason as `BottomSheet` — an overlay must
  // not be ranked inside whatever positioned ancestor its trigger happens to
  // live in, or the bottom nav ends up painting over it.
  if (!hydrated) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-55 flex items-center justify-center px-screen",
        open ? "" : "pointer-events-none",
      )}
    >
      {/* Scrim owns the dim + blur AND its own opacity transition, so the two
          fade in together as one layer (animating opacity on a parent while the
          blur lives on a child makes the blur snap in out of sync). */}
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "relative flex max-h-[85svh] w-full max-w-[360px] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-modal transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {header && <div className="shrink-0 px-4 pt-4">{header}</div>}
        {/* The card's side padding lives on the scroller, not on the card, so a
            focused field's glow has room inside it — a scroll container clips
            anything that reaches its edge. */}
        <div
          className={cn(
            // Sideways never — see the note in BottomSheet for why the x axis has to be
            // said out loud.
            "min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4",
            // With a header the caller owns the gap under it; without one the
            // body is the top of the card and needs the card's own padding.
            !header && "pt-4",
          )}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
