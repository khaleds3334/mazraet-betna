import type { ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The action strip at the foot of an order card (A-50): 40px tall, no shadow,
 * and the icon in a small round chip beside the word. One card carries two —
 * the one that moves the order on, which takes the width (`grow`), and the
 * lesser one beside it.
 *
 * A sibling of `ActionButton`, not a variant of it. That one is the record
 * action of the home screen (تسجيل نافق · سحب شكارة): taller, shadowed, and its
 * icon rides bare at 20px. Folding the two together would mean six props of
 * exceptions to pretend that two designs are one.
 */
const VARIANT = {
  /** The lime step — weigh these birds, mark them ready. */
  primary: {
    box: "border-primary bg-primary text-foreground",
    chip: "size-5",
  },
  /** The dark-green last step: collected. Heavy on purpose — it ends the order. */
  brand: {
    box: "border-brand bg-brand text-surface-page",
    chip: "size-5 rounded-full bg-primary text-foreground",
  },
  /** The lesser action beside the step (الفاتورة). */
  outline: {
    box: "border-brand-olive bg-surface-page text-foreground",
    chip: "size-5",
  },
  danger: {
    box: "border-error text-error",
    chip: "size-4 rounded-full bg-error text-white",
  },
  /** The action you take by *not* doing the main one (لم يدفع). */
  muted: {
    box: "border-control-border bg-control-border text-foreground",
    chip: "size-5",
  },
} as const;

type CardActionProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANT;
  /** Optional: some of these carry a word alone. */
  icon?: IconName;
  /** Takes the leftover width; the other action on the row keeps its size. */
  grow?: boolean;
  /** Spins in place of the icon while the action is in flight. */
  isLoading?: boolean;
  /**
   * Renders the same shape as a plain box instead of a control — for an action
   * whose screen is designed but not built yet. Something that looks tappable
   * and isn't is worse than something that plainly waits.
   */
  interactive?: boolean;
};

export function CardAction({
  variant = "primary",
  icon,
  grow = false,
  isLoading = false,
  interactive = true,
  className,
  children,
  type = "button",
  disabled,
  ...props
}: CardActionProps) {
  const style = VARIANT[variant];
  const shape = cn(
    "flex min-h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-base",
    grow ? "flex-1" : "shrink-0",
    style.box,
    className,
  );

  const content = (
    <>
      {icon && (
        <span className={cn("flex items-center justify-center", style.chip)}>
          <Icon name={icon} size={14} />
        </span>
      )}
      <span className="optical-center">{children}</span>
    </>
  );

  if (!interactive) return <div className={shape}>{content}</div>;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(shape, "relative disabled:opacity-60")}
      {...props}
    >
      {/* While it saves, the label is hidden rather than removed and the spinner
          floats over it. Two of these share a row and one is sized by its own
          text, so swapping the content out would resize the button under the
          finger that just pressed it. */}
      <span
        className={cn(
          "flex items-center justify-center gap-1.5",
          isLoading && "invisible",
        )}
      >
        {content}
      </span>

      {isLoading && (
        <span
          aria-hidden
          className="absolute size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
    </button>
  );
}
