import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Labeled text input with active + error states (matches the Figma effect
 * styles). These focus/error glows are one-off field effects, so they live here
 * on the component — not as global tokens. The 2px border stays at all times
 * (transparent when a glow shows) so the field never shifts by a pixel.
 *
 * Form-field validation always renders inline here — never a toast (rule 11).
 */

// Green glow while the field is focused (Figma "active shadow", #AEC77E).
const ACTIVE_SHADOW =
  "focus-within:border-transparent focus-within:shadow-[0px_0px_4px_0px_rgba(174,199,126,0.2),0px_0px_0px_1px_rgba(174,199,126,0.6),0px_0px_1px_1px_rgba(174,199,126,0.5),0px_0px_0px_4px_rgba(174,199,126,0.2)]";

// Red glow when the field is in error (Figma "active3" effect, #F87171).
const ERROR_SHADOW =
  "border-transparent shadow-[0px_4px_4px_0px_rgba(248,113,113,0.08),0px_0px_0px_4px_rgba(248,113,113,0.08),0px_0px_1px_1px_rgba(248,113,113,0.15),0px_0px_0px_1px_rgba(248,113,113,0.4),0px_0px_4px_0px_rgba(248,113,113,0.1)]";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string | null;
};

export function InputField({
  id,
  label,
  error,
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
          error ? ERROR_SHADOW : cn("border-border", ACTIVE_SHADOW),
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
        <p id={errorId} className="mt-4 text-center text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
