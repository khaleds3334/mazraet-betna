/**
 * Shared look for the cycle-dashboard action pills (تسجيل نافق · تسجيل مصاريف ·
 * سحب شكارة). Single-sourced so the placeholder buttons and the real ones (e.g.
 * the mortality launcher) stay identical. Height ≥44px (admin touch target).
 */
export const actionPillBase =
  "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-base shadow-card transition-transform active:scale-[0.99]";

export const actionPillVariant = {
  danger: "border-error bg-error-surface text-error",
  outline: "border-brand-olive bg-surface-page text-foreground",
} as const;

export type ActionPillVariant = keyof typeof actionPillVariant;
