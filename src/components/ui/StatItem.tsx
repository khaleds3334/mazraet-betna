import { cn } from "@/lib/utils";

/**
 * A labeled stat card (Figma "Stat Item"): a small centered tile with a muted
 * caption on top and a bold value below. Used for read-only computed figures
 * (e.g. "العلف المطلوب", "المصاريف المتوقعة"). `valueClassName` recolors the
 * value — e.g. red for an expense.
 */
export function StatItem({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-1 rounded-xl border-2 border-border bg-surface-page px-2 py-3 text-center">
      <span className="whitespace-pre-line text-sm text-muted">{label}</span>
      {/* Color comes from valueClassName so it can override the default cleanly —
          cn() is a plain join, so two color classes would otherwise both apply. */}
      <span
        className={cn("text-h4 font-bold", valueClassName ?? "text-foreground")}
      >
        {value}
      </span>
    </div>
  );
}
