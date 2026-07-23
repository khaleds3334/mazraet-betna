"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A centered dialog over a dimmed, blurred scrim — the popup treatment (A-14
 * record-mortality and similar confirm dialogs), as opposed to the `BottomSheet`
 * that slides up from the bottom. The page behind stays mounted; tapping the
 * scrim or pressing Escape dismisses. The caller renders the card's contents.
 */
export function Modal({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center px-6",
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
          "relative w-full max-w-[360px] rounded-xl border border-border bg-white p-4 shadow-modal transition-all duration-200",
          open ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {children}
      </div>
    </div>
  );
}
