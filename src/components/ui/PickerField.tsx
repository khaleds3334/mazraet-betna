import type { IconName } from "@/lib/icons";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";
import { FIELD_ACTIVE_SHADOW_WITHIN, FIELD_ERROR_SHADOW } from "./fieldShadows";

/**
 * A select-style field that opens the OS date/time picker: a labeled box showing
 * the icon (right) + the chosen value or a placeholder, with a transparent native
 * `<input>` on top driving the value. Same active (focus) and error glows as
 * InputField, so it reads as one family. The icon comes from the central map
 * (/lib/icons.ts), like everywhere else.
 */
export function PickerField({
  id,
  label,
  placeholder,
  icon,
  display,
  type,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  placeholder: string;
  icon: IconName;
  display: string;
  type: "date" | "time";
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="flex w-full flex-col">
      <label htmlFor={id} className="mb-2 text-right text-base text-foreground">
        {label}
      </label>

      <div
        className={cn(
          "relative flex h-12 items-center rounded-lg border-2 bg-surface-page transition-shadow",
          error ? FIELD_ERROR_SHADOW : cn("border-border", FIELD_ACTIVE_SHADOW_WITHIN),
        )}
      >
        {/* Icon on the right (leading edge in RTL), value/placeholder beside it. */}
        <div className="flex h-full w-full items-center gap-2 px-3">
          <Icon name={icon} size={24} className="shrink-0 text-foreground" />
          <span
            className={cn(
              "flex-1 truncate text-right text-sm",
              display ? "text-foreground" : "text-disabled",
            )}
          >
            {display || placeholder}
          </span>
        </div>

        <input
          id={id}
          type={type}
          aria-label={label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {error && (
        <p id={errorId} className="mt-2 text-right text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
