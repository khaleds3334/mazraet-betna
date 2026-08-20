import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Tone of a figure on a cycle row — the icon and the value always share it, the
 * way the design draws them: green for what the cycle earned, red for what it
 * cost, tan for what it lost.
 */
export type CycleStatTone = "brand" | "danger" | "tan";

const TONE: Record<CycleStatTone, string> = {
  brand: "text-foreground",
  danger: "text-error",
  tan: "text-accent-tan",
};

/**
 * One headline figure on a cycle row (A-42): a muted caption with its glyph on
 * the inline-start, and the value under it. Flat — no tile, no border — because
 * a row already sits on its own surface; that is what separates it from the
 * raised {@link CycleStatCard} on the dashboards.
 */
export function CycleRowStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone: CycleStatTone;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 text-center">
      <span className="flex items-center gap-1 text-sm text-muted">
        <Icon name={icon} size={18} className={TONE[tone]} aria-hidden />
        {label}
      </span>
      <span className={cn("text-h4 font-bold", TONE[tone])}>{value}</span>
    </div>
  );
}
