"use client";

/**
 * useToast — the trigger screens call to show feedback (BUILD-WORKFLOW §5).
 * We own this instead of importing a library (T-08): RTL, Arabic text, ≥56px
 * height and slow durations are non-default everywhere.
 *
 * A tiny module-level pub/sub store backs it, so any client component can fire a
 * toast without a context provider; <Toaster /> subscribes and renders. At most
 * two toasts are visible at once — the rest queue (§5).
 */

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: number;
  type: ToastType;
  message: string;
  duration: number; // ms; 0 = stays until dismissed
}

const MAX_VISIBLE = 2;
const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 4000,
  error: 6000, // errors read slower — give them longer (§5)
};

const EMPTY: ToastData[] = [];
let queue: ToastData[] = EMPTY;
let counter = 0;
const timers = new Map<number, ReturnType<typeof setTimeout>>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

/** Give the (up to) two visible toasts an auto-dismiss timer. */
function scheduleVisible() {
  queue.slice(0, MAX_VISIBLE).forEach((t) => {
    if (t.duration > 0 && !timers.has(t.id)) {
      timers.set(
        t.id,
        setTimeout(() => dismissToast(t.id), t.duration),
      );
    }
  });
}

function push(type: ToastType, message: string, duration?: number) {
  const toast: ToastData = {
    id: ++counter,
    type,
    message,
    duration: duration ?? DEFAULT_DURATION[type],
  };
  queue = [...queue, toast];
  scheduleVisible();
  emit();
}

export function dismissToast(id: number) {
  const timer = timers.get(id);
  if (timer) clearTimeout(timer);
  timers.delete(id);
  queue = queue.filter((t) => t.id !== id);
  if (queue.length === 0) queue = EMPTY;
  scheduleVisible(); // promote a queued toast into the visible slot
  emit();
}

// Consumed by <Toaster /> via useSyncExternalStore.
export function subscribeToasts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function getToastsSnapshot() {
  return queue;
}
export const VISIBLE_TOASTS = MAX_VISIBLE;

interface ToastOptions {
  duration?: number;
}

// Stable across renders — safe to call from anywhere.
const api = {
  success: (message: string, o?: ToastOptions) =>
    push("success", message, o?.duration),
  error: (message: string, o?: ToastOptions) =>
    push("error", message, o?.duration),
  warning: (message: string, o?: ToastOptions) =>
    push("warning", message, o?.duration),
  info: (message: string, o?: ToastOptions) =>
    push("info", message, o?.duration),
  dismiss: dismissToast,
};

export function useToast() {
  return api;
}
