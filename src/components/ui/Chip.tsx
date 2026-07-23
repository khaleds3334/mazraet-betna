import { cn } from "@/lib/utils";

/**
 * A selectable pill chip (Figma "Chip") — a rounded outline that fills lime when
 * selected. The reusable primitive for single-select rows: expense categories,
 * order-status filters, pickup-time slots, and similar. Caller arranges a row of
 * them (usually in a horizontally scrollable flex) and tracks which is selected.
 */
export function Chip({
  label,
  selected = false,
  onClick,
  className,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-xl border border-brand px-2.5 py-1.5 text-base text-ink transition-colors",
        selected ? "bg-primary" : "bg-transparent",
        className,
      )}
    >
      {label}
    </button>
  );
}
