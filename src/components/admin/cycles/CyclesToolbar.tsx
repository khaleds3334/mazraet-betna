import { Icon } from "@/components/ui";
import type { CycleEstimateBasis } from "@/lib/calculations/cycle";
import { CreateCycleLauncher } from "./CreateCycleLauncher";

/**
 * Top row of the cycles screen (A-42): «انشاء دورة جديدة» on the inline-start and
 * the filter on the inline-end — the same arrangement as the orders and customers
 * screens.
 *
 * It appears only while no cycle is running. A farm raises one flock at a time
 * (FR-4), so offering to start a second one mid-cycle would be offering something
 * the app must then refuse; the design leaves the row out entirely (A-43).
 *
 * The funnel is drawn but inert, as on the orders screen — it will scope the list
 * to a stretch of time, and that picker has no design yet (Khaled, 2026-08-18).
 */
export function CyclesToolbar({ basis }: { basis?: CycleEstimateBasis }) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <CreateCycleLauncher label="انشاء دورة جديدة" basis={basis} compact />

      {/* 2px is the weight Figma draws it at; the icon's own stroke scales with
          `size`, so at 42px it would render ~2.6px and read heavy. */}
      <Icon
        name="filter"
        size={42}
        strokeWidth={2}
        absoluteStrokeWidth
        className="shrink-0 text-foreground"
      />
    </div>
  );
}
