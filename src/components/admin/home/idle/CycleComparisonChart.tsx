"use client";

import { useState } from "react";
import {
  formatArabicNumber,
  formatCurrency,
  formatWeight,
} from "@/lib/format";
import type { CycleListItem } from "@/lib/queries/cycles";
import { CycleSummaryDialog } from "./CycleSummaryDialog";

/** The three things a cycle is compared on, and the colour each one wears. */
const SERIES = [
  {
    key: "averageWeight",
    label: "متوسط الاوزان",
    bar: "bg-accent-orange",
    read: (cycle: CycleListItem) => cycle.averageWeight,
    describe: (value: number) => formatWeight(value),
  },
  {
    key: "netProfit",
    label: "الربح",
    bar: "bg-success",
    read: (cycle: CycleListItem) => cycle.netProfit,
    describe: (value: number) => formatCurrency(value),
  },
  {
    key: "expensesTotal",
    label: "المصاريف",
    bar: "bg-error",
    read: (cycle: CycleListItem) => cycle.expensesTotal,
    describe: (value: number) => formatCurrency(value),
  },
] as const;

/** Plot height in px — the design's grid box, minus its labels. */
const PLOT_HEIGHT = 160;
/** A bar that exists but is tiny still gets a visible stub. */
const MIN_BAR = 3;

/**
 * How tall a bar stands, as a share of the tallest bar **in its own series**.
 *
 * Each series is measured against itself, not against the others, because they
 * are not the same kind of number: an average weight is ~٢ and a cycle's
 * expenses are ~٢٢٠٠٠. On one shared scale the weight bar would be a fraction of
 * a pixel — present in the data and invisible on the screen. Scaled per series,
 * every colour answers the question the chart is actually for: *which cycle did
 * better at this?* (Khaled, 2026-08-20.)
 */
function barHeight(value: number, seriesMax: number): number {
  if (seriesMax <= 0 || value <= 0) return 0;
  return Math.max(MIN_BAR, (value / seriesMax) * PLOT_HEIGHT);
}

/**
 * The cycle comparison on the idle home (A-21): one group of three bars per
 * cycle — average weight, profit, expenses — oldest on the inline-start so the
 * groups read forward in time, right to left.
 *
 * The bars carry no printed numbers, exactly as the design draws them. Tapping a
 * group opens that cycle's summary (A-22), which is where the shapes become
 * figures; the screen-reader caption carries the same numbers, so they are never
 * only a shape.
 */
export function CycleComparisonChart({ cycles }: { cycles: CycleListItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const maxima = SERIES.map((series) =>
    Math.max(...cycles.map((cycle) => series.read(cycle)), 0),
  );

  return (
    <figure className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        {/* Plot: four hairlines behind the bars, the way the design rules it. */}
        <div
          className="relative flex items-end justify-between gap-2 rounded-md border border-border px-3 pt-3"
          style={{ height: PLOT_HEIGHT + 12 }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 inset-y-3 flex flex-col justify-between"
          >
            {[0, 1, 2, 3].map((line) => (
              <span key={line} className="block h-px w-full bg-border" />
            ))}
          </div>

          {/* The whole group is the tap target — three thin bars are not, and
              this one is used standing up. */}
          {cycles.map((cycle) => (
            <button
              type="button"
              key={cycle.cycleId}
              onClick={() => setOpenId(cycle.cycleId)}
              aria-label={`ملخص ${cycle.name ?? `دورة ${formatArabicNumber(cycle.seq)}`}`}
              className="relative flex h-full min-w-0 flex-1 items-end justify-center gap-1.5 rounded-sm transition-opacity active:opacity-70"
            >
              {SERIES.map((series, index) => (
                <span
                  key={series.key}
                  className={`block w-full max-w-4.5 rounded-t-sm ${series.bar}`}
                  style={{
                    height: barHeight(series.read(cycle), maxima[index]),
                  }}
                />
              ))}
            </button>
          ))}
        </div>

        {/* One label per group, under it. */}
        <div className="flex items-start justify-between gap-2">
          {cycles.map((cycle) => (
            <p
              key={cycle.cycleId}
              className="min-w-0 flex-1 text-center text-sm text-heading"
            >
              {cycle.name ?? `دورة ${formatArabicNumber(cycle.seq)}`}
            </p>
          ))}
        </div>
      </div>

      {/* Legend — a swatch on the inline-start of each name, as designed. */}
      <div className="flex items-center justify-between gap-2">
        {SERIES.map((series) => (
          <span
            key={series.key}
            className="flex min-w-0 items-center gap-1.5 text-xs text-heading"
          >
            <span
              aria-hidden
              className={`size-3 shrink-0 rounded-xs ${series.bar}`}
            />
            {series.label}
          </span>
        ))}
      </div>

      <figcaption className="sr-only">
        مقارنة آخر الدورات:{" "}
        {cycles
          .map((cycle) =>
            [
              cycle.name ?? `دورة ${formatArabicNumber(cycle.seq)}`,
              ...SERIES.map(
                (series) =>
                  `${series.label} ${series.describe(series.read(cycle))}`,
              ),
            ].join("، "),
          )
          .join(". ")}
      </figcaption>

      <CycleSummaryDialog
        cycle={cycles.find((cycle) => cycle.cycleId === openId) ?? null}
        onClose={() => setOpenId(null)}
      />
    </figure>
  );
}
