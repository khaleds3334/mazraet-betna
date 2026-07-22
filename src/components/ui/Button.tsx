import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

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
        "flex min-h-14 w-full items-center justify-center rounded-[10px]",
        "border-2 border-primary-hover bg-primary px-6 py-4",
        "text-h6 font-bold text-foreground shadow-card",
        "transition-transform active:scale-[0.99]",
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
