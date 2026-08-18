import { cn } from "@/lib/utils";

/**
 * Tone of a badge, straight from the Figma "Badge" component:
 *   primary → lime  (البيع متوفر)
 *   accent  → orange (the kilo price)
 *   danger  → red    (the flock's age)
 *   success → soft green pill, borderless (the cycle phase on A-11)
 */
export type BadgeTone = "primary" | "accent" | "danger" | "success";

const TONE: Record<BadgeTone, string> = {
  primary: "bg-primary border-primary-hover text-primary-foreground",
  accent: "bg-accent-orange border-accent-tan text-primary-foreground",
  danger: "bg-error-soft border-error text-white",
  success: "bg-success-surface border-transparent text-success",
};

/** `md` is the headline badge row; `sm` is the small pill next to a title. */
const SIZE = {
  sm: "px-2 py-1 text-xs",
  md: "px-4 py-2 text-h6 font-bold",
} as const;

/**
 * A rounded status pill. Read-only by design — it reports state (sale open, age,
 * price), it is never a control, so it carries no tap target.
 */
export function Badge({
  children,
  tone = "primary",
  size = "md",
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full border",
        TONE[tone],
        SIZE[size],
        className,
      )}
    >
      {/* Almarai's unused ascent makes centred text read as sitting low — the
          inner span lifts the ink without changing the pill's height. */}
      <span className="optical-center">{children}</span>
    </span>
  );
}
