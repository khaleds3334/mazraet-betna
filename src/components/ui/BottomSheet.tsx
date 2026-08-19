"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { cn } from "@/lib/utils";

/**
 * A sheet that slides up from the bottom over a dimmed, blurred scrim — the same
 * backdrop treatment as the customer sidebar (bg-black/20 + backdrop-blur). The
 * page behind stays mounted and is tapped to dismiss. The sheet supplies the
 * frame and mechanics; the caller renders its own header/body as children.
 *
 * Both layers set `pointer-events` explicitly rather than inheriting it: sheets get
 * mounted next to whatever opens them, and `pointer-events` is an inherited
 * property — a sheet opened from inside a pass-through layer (e.g. the pen on a
 * customer row) would otherwise render fully but ignore every tap.
 *
 * `size` sets how tall it comes up:
 *   • "auto" — content-driven, up to 90% of the viewport, then it scrolls.
 *   • "full" — covers the screen. A sheet that reads as a page (A-56), so it
 *     drops the rounded top edge that marks a partial sheet.
 *
 * Sits on the overlay tier (z-50) of the layer ladder in globals.css — above
 * the sidebar drawer, below the toasts. Never share a tier with another
 * overlay: equal z-index falls back to DOM order (T-40).
 */
export function BottomSheet({
  open,
  onClose,
  label,
  size = "auto",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  size?: "auto" | "full";
  children: React.ReactNode;
}) {
  const hydrated = useIsHydrated();

  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Rendered into <body>, never where it was written. A sheet is opened from
  // whatever button happens to need it, and a `z-index` only ranks against
  // siblings inside the same stacking context — so a sheet whose button sits in
  // a positioned ancestor (the sticky header on the list screens, T-35) had its
  // z-50 measured inside that header and came out *underneath* the bottom nav.
  // The portal takes it out of every ancestor's ranking, which is the only way
  // an overlay can be reliably on top. There is no <body> to portal into while
  // rendering on the server, hence the hydration check.
  if (!hydrated) return null;

  return createPortal(
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/25 transition-opacity duration-200",
          open
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[430px] flex-col overflow-y-auto border-border bg-background transition-transform duration-300",
          size === "full"
            ? "top-0 border-x"
            : "max-h-[90svh] rounded-t-xl border-t-2",
          open
            ? "pointer-events-auto translate-y-0"
            : "pointer-events-none translate-y-full",
        )}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}
