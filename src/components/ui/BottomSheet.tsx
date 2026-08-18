"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A sheet that slides up from the bottom over a dimmed, blurred scrim — the same
 * backdrop treatment as the customer sidebar (bg-black/20 + backdrop-blur). The
 * page behind stays mounted and is tapped to dismiss. The sheet supplies the
 * frame and mechanics; the caller renders its own header/body as children.
 *
 * `size` sets how tall it comes up:
 *   • "auto" — content-driven, up to 90% of the viewport, then it scrolls.
 *   • "full" — covers the screen. A sheet that reads as a page (A-56), so it
 *     drops the rounded top edge that marks a partial sheet.
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
  // Close on Escape while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-50 bg-black/25 transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
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
            : "max-h-[90dvh] rounded-t-xl border-t-2",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </>
  );
}
