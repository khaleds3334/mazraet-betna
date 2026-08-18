import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { actionBase, actionOutline, actionPrimary } from "./buttonStyles";

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
};

export function Button({
  className,
  isLoading = false,
  variant = "primary",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        actionBase,
        VARIANT[variant],
        "disabled:pointer-events-none disabled:opacity-60",
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
