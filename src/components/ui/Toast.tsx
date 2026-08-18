"use client";

import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import type { ToastData, ToastType } from "@/hooks/useToast";

/**
 * A single toast. Presentational only — the store decides when it appears and
 * disappears. Tap anywhere to dismiss (no small close button — hard to hit while
 * standing over a scale). Icon on the right, text on the left (RTL), min 56px.
 */

const STYLES: Record<ToastType, { box: string; icon: string; name: IconName }> =
  {
    success: {
      box: "bg-success-surface border-success/25",
      icon: "text-success",
      name: "success",
    },
    error: {
      box: "bg-error-surface border-error/25",
      icon: "text-error",
      name: "error",
    },
    warning: {
      box: "bg-warning-surface border-warning/30",
      icon: "text-warning",
      name: "warning",
    },
    info: {
      box: "bg-info-surface border-info/30",
      icon: "text-info",
      name: "info",
    },
  };

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: number) => void;
}) {
  const style = STYLES[toast.type];
  return (
    <button
      type="button"
      onClick={() => onDismiss(toast.id)}
      className={`pointer-events-auto flex min-h-14 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-right shadow-card [animation:toast-in_150ms_ease-out] ${style.box}`}
    >
      <Icon name={style.name} size={24} className={`shrink-0 ${style.icon}`} />
      <span className="flex-1 text-base font-bold text-heading">
        {toast.message}
      </span>
    </button>
  );
}
