import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Value colouring: red for the loss/cost figures, green for the neutral ones. */
type Tone = "danger" | "brand";

const TONE_TEXT: Record<Tone, string> = {
  danger: "text-error",
  brand: "text-foreground",
};

/**
 * A raised "hero" stat tile on the cycle dashboard (A-11): an icon and a muted
 * caption stacked on top, a big bold value below. Used for the three headline
 * cycle figures — mortality, expenses, and flock age. The tone tints both the
 * icon and the value (red for a loss/cost, green otherwise).
 */
export function CycleStatCard({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: IconName;
  label: string;
  value: string;
  /** Small unit shown under the big value (e.g. "جنيه") — keeps a long amount
   *  legible in the narrow tile while still showing its unit (rule 5). */
  unit?: string;
  tone: Tone;
}) {
  return (
    <div className="flex min-h-[100px] w-full flex-col items-center justify-between gap-2 rounded-xl border-2 border-disabled-soft bg-surface px-1 py-3 text-center shadow-stat">
      <div className="flex flex-col items-center gap-1">
        <Icon name={icon} size={24} className={TONE_TEXT[tone]} aria-hidden />
        <span className="text-sm leading-tight text-muted">{label}</span>
      </div>
      <div className="flex flex-col items-center leading-tight">
        <span className={cn("text-h4 font-bold", TONE_TEXT[tone])}>{value}</span>
        {unit && <span className={cn("text-xs", TONE_TEXT[tone])}>{unit}</span>}
      </div>
    </div>
  );
}
