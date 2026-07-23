/**
 * Shared visual recipe for the primary action look, single-sourced so a real
 * <Button> and action *links* that must look identical (e.g. the customer-home
 * CTAs, which are <Link>s not <button>s) never drift apart when the design
 * changes. `actionBase` is the shape + typography; the variants add border + fill.
 */
export const actionBase =
  "flex min-h-14 w-full items-center justify-center rounded-[10px] border-2 px-6 py-4 text-h6 font-bold text-foreground shadow-card transition-transform active:scale-[0.99]";

/** Lime primary — the default Button fill. */
export const actionPrimary = "border-primary-hover bg-primary";

/** Outline on the page surface — the secondary action. */
export const actionOutline = "border-brand bg-surface-page";
