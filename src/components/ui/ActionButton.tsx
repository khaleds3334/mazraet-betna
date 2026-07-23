import type { ButtonHTMLAttributes } from "react";
import { Icon } from "./Icon";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * A compact, bordered action button (Figma "Button" pill) — smaller than the
 * full-width primary <Button>. Used for the record/quick actions that recur
 * across the admin app (تسجيل نافق · تسجيل مصاريف · سحب شكارة …). Auto-width with
 * an optional leading icon; ≥44px tall for the admin touch-target rule. Behaviour
 * (what it opens/does) is the caller's — this is the look only.
 */
type Variant = "danger" | "outline" | "primary";

const VARIANT: Record<Variant, string> = {
  danger: "border-error bg-error-surface text-error",
  outline: "border-brand-olive bg-surface-page text-foreground",
  primary: "border-primary-hover bg-primary text-foreground",
};

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  icon?: IconName;
  isLoading?: boolean;
};

export function ActionButton({
  variant = "outline",
  icon,
  isLoading = false,
  className,
  children,
  type = "button",
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-md border px-3 text-base shadow-card transition-transform active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60",
        VARIANT[variant],
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
        <>
          {icon && <Icon name={icon} size={20} aria-hidden />}
          {children}
        </>
      )}
    </button>
  );
}
