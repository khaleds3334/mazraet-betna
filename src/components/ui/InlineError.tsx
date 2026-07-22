"use client";

import { Icon } from "./Icon";

/**
 * A persistent error that stays on screen next to what failed — never a toast.
 * Used for CRITICAL actions (weighing, payment, cancelling an order, ending a
 * cycle): the admin works standing over a scale with his hands busy and may not
 * see a toast before it auto-dismisses, so a silent failure there loses money
 * (T-09). Optional retry button.
 */
export function InlineError({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex items-center gap-3 rounded-2xl border border-error/25 bg-error-surface px-4 py-3 ${className}`}
    >
      <Icon name="error" size={24} className="shrink-0 text-error" />
      <span className="flex-1 text-base font-bold text-heading">{message}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold text-error underline-offset-4 hover:underline"
        >
          حاول تاني
        </button>
      )}
    </div>
  );
}
