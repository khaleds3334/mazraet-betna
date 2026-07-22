import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { FIELD_ACTIVE_SHADOW_WITHIN, FIELD_ERROR_SHADOW } from "./fieldShadows";

/**
 * Labeled text input with active + error states (matches the Figma effect
 * styles). The 2px border stays at all times (transparent when a glow shows) so
 * the field never shifts by a pixel.
 *
 * Form-field validation always renders inline here — never a toast (rule 11).
 */

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string | null;
  /** Where the error line sits — right by default (RTL), centered on login. */
  errorAlign?: "right" | "center";
};

export function InputField({
  id,
  label,
  error,
  errorAlign = "right",
  className,
  ...props
}: InputFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex w-full flex-col">
      <label htmlFor={id} className="mb-2 text-right text-lg text-foreground">
        {label}
      </label>

      <div
        className={cn(
          "flex min-h-14 items-center rounded-[10px] border-2 bg-surface-page px-4 transition-shadow",
          error
            ? FIELD_ERROR_SHADOW
            : cn("border-border", FIELD_ACTIVE_SHADOW_WITHIN),
        )}
      >
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full bg-transparent text-right text-lg text-primary-foreground outline-none",
            "placeholder:text-sm placeholder:text-disabled",
            className,
          )}
          {...props}
        />
      </div>

      {error && (
        <p
          id={errorId}
          className={cn(
            "mt-4 text-sm text-error",
            errorAlign === "center" ? "text-center" : "text-right",
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
}
