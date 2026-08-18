import { Icon } from "./Icon";
import { FIELD_ACTIVE_SHADOW_WITHIN } from "./fieldShadows";
import { cn } from "@/lib/utils";

/**
 * The search box every list screen draws the same way (A-30 · A-50) and that the
 * add-order sheet reuses for its customer picker (A-56): a rounded tile with the
 * magnifier on the right and the query to its left.
 *
 * One shape, two modes. Pass `onChange` and it renders a real input — the caller
 * must then be a client component. Leave it out and it renders the placeholder
 * as static text, which is what a screen whose list isn't built yet needs: the
 * box looks right without opening a keyboard that leads nowhere.
 */
export function SearchField({
  placeholder,
  label,
  value,
  onChange,
  disabled = false,
  className,
}: {
  placeholder: string;
  /** Accessible name, when the placeholder isn't a good one. */
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-13 items-center gap-4 rounded-lg border border-border bg-surface px-4 transition-shadow",
        // The same green glow every other field gets while it's being typed in.
        // Harmless on the static box — it holds no input, so it never focuses.
        FIELD_ACTIVE_SHADOW_WITHIN,
        disabled && "opacity-60",
        className,
      )}
    >
      {/* The live box carries the full-strength glyph; the static one is muted,
          so a box that can't be typed into doesn't read as the primary action. */}
      <Icon
        name="search"
        size={32}
        className={cn("shrink-0", onChange ? "text-foreground" : "text-muted")}
      />

      {onChange ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={label ?? placeholder}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-right text-sm text-primary-foreground outline-none placeholder:text-disabled"
        />
      ) : (
        <p className="truncate text-sm text-disabled">{placeholder}</p>
      )}
    </div>
  );
}
