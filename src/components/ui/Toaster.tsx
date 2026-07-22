"use client";

import { useSyncExternalStore } from "react";
import { Toast } from "./Toast";
import {
  subscribeToasts,
  getToastsSnapshot,
  dismissToast,
  VISIBLE_TOASTS,
} from "@/hooks/useToast";

/**
 * Mounts ONCE per route group layout — (customer) and (admin). Never per screen.
 * Renders the visible toasts at the top of the screen (the bottom is taken by
 * BottomNav and the keyboard), respecting the notch safe area.
 */
export function Toaster() {
  const toasts = useSyncExternalStore(
    subscribeToasts,
    getToastsSnapshot,
    () => getToastsSnapshot(), // SSR: starts empty
  );

  const visible = toasts.slice(0, VISIBLE_TOASTS);
  if (visible.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-sm flex-col gap-2 px-4"
      style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      role="region"
      aria-live="polite"
    >
      {visible.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
