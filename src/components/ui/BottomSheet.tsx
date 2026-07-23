"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * A sheet that slides up from the bottom over a dimmed, blurred scrim — the same
 * backdrop treatment as the customer sidebar (bg-black/20 + backdrop-blur). The
 * page behind stays mounted and is tapped to dismiss. Content-driven height, up
 * to 90% of the viewport, then it scrolls. The sheet supplies the frame and
 * mechanics; the caller renders its own header/body as children.
 */
export function BottomSheet({
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
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[430px] flex-col overflow-y-auto rounded-t-xl border-t-2 border-border bg-background transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
        style={{
          boxShadow: "0px 8px 16px 4px rgba(63,98,70,0.25)",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </div>
    </>
  );
}
