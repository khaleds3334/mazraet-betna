import { Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Value colouring. The icon and the value always share the tone, exactly as the
 * design does: green for a neutral figure, brown for money spent, red for
 * something that needs a decision, tan for something pending or owed, olive for
 * something finished.
 *
 * **Red is rationed** (D-47). It used to be the tone for any cost, which on the
 * raising dashboard put it on the expenses tile, on the mortality tile, and on
 * whichever feed figures had run out — three reds on one screen, and a colour
 * that appears everywhere stops meaning anything. It is now reserved for a figure
 * the admin has to do something about; ordinary spending is brown.
 */
export type StatTone = "brand" | "brown" | "danger" | "tan" | "olive";

const TONE_TEXT: Record<StatTone, string> = {
  brand: "text-foreground",
  brown: "text-accent-brown",
  danger: "text-error",
  tan: "text-accent-tan",
  olive: "text-brand-olive",
};

export interface CycleStatCardProps {
  icon: IconName;
  label: string;
  value: string;
  tone: StatTone;
  /** Raised tiles carry the design's drop shadow; flat ones don't (A-20's
   *  flock row is flat, every other tile is raised). */
  raised?: boolean;
  /** Hides the value behind a blur — the design's "locked" treatment. */
  blurred?: boolean;
  className?: string;
}

/**
 * A stat tile on the cycle dashboards: an icon and a muted caption stacked on
 * top, a big bold value below. Used for the headline figures on both the raising
 * dashboard (A-11) and the selling dashboard (A-20).
 */
export function CycleStatCard({
  icon,
  label,
  value,
  tone,
  raised = true,
  blurred = false,
  className,
}: CycleStatCardProps) {
  return (
    <div
      className={cn(
        "flex  w-full flex-col items-center justify-between gap-2 rounded-xl border-2 border-disabled-soft bg-surface px-1 py-2 text-center",
        raised && "shadow-stat",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <Icon name={icon} size={24} className={TONE_TEXT[tone]} aria-hidden />
        <span className="text-sm leading-tight text-muted">{label}</span>
      </div>
      {/* No unit line: the tile is ~104px wide and the section heading already
          says these are money (Khaled, 2026-08-18 — supersedes T-22). */}
      <span
        className={cn(
          "text-h4 font-bold leading-tight",
          TONE_TEXT[tone],
          blurred && "blur-[5px] select-none",
        )}
      >
        {value}
      </span>
    </div>
  );
}
