import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { actionBase, actionPrimary } from "./buttonStyles";

/**
 * Primary action button — the lime (Surface/action) button from the design.
 * Full width, ≥56px tall (comfortably above the 44px touch-target rule), with a
 * spinner while an action is in flight so the user never taps twice.
 */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
};

export function Button({
  className,
  isLoading = false,
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
        actionPrimary,
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
