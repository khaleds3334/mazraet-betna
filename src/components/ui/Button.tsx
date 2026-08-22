import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import {
  actionBase,
  actionLocked,
  actionOutline,
  actionPrimary,
} from "./buttonStyles";

/**
 * Full-width action button from the design. `primary` is the lime
 * (Surface/action) fill; `outline` is the bordered version that sits under it
 * when a screen offers a second, lesser action (A-56). ≥56px tall (comfortably
 * above the 44px touch-target rule), with a spinner while an action is in flight
 * so the user never taps twice.
 */
const VARIANT = {
  primary: actionPrimary,
  outline: actionOutline,
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  variant?: keyof typeof VARIANT;
  /**
   * On screen but with nothing to do — blurred and inert rather than greyed.
   * A plain `disabled` is for an action that is momentarily unavailable; this is
   * for one that is waiting on the user to give it something to do.
   */
  locked?: boolean;
};

export function Button({
  className,
  isLoading = false,
  variant = "primary",
  locked = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading || locked}
      aria-busy={isLoading || undefined}
      className={cn(
        actionBase,
        VARIANT[variant],
        // Not `disabled:` variants when locked: the two would set opacity at the
        // same specificity and `cn` is a plain joiner, so which one won would
        // depend on the order Tailwind happened to emit them in.
        locked ? actionLocked : "disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : (
        children
      )}
    </button>
  );
}
