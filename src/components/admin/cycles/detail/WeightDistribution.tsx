import { pluralizeChicken } from "@/lib/format";
import type { WeightBand } from "@/lib/calculations/cycle";

/** Radius and centre of the pie, in the SVG's own 100×100 box. */
const R = 46;
const C = 50;
/** A hair of empty space between neighbouring slices, in degrees. */
const GAP = 1.5;

const point = (angle: number): string => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return `${(C + R * Math.cos(radians)).toFixed(3)} ${(C + R * Math.sin(radians)).toFixed(3)}`;
};

/** The wedge from `from`° to `to`°, clockwise from 12 o'clock. */
function slice(from: number, to: number): string {
  // A band holding the whole flock has no two ends to join — draw the circle.
  if (to - from >= 360) {
    return `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`;
  }
  const large = to - from > 180 ? 1 : 0;
  return `M ${C} ${C} L ${point(from)} A ${R} ${R} 0 ${large} 1 ${point(to)} Z`;
}

/**
 * «توزيع الاوزان» on a finished cycle's page (A-45): every bird the cycle weighed,
 * sorted into four bands — a pie on the inline-start, its legend on the
 * inline-end, coloured from red (came in light) to dark green (heaviest).
 *
 * **The counts sit in the legend, not on the wedges** — a deliberate departure
 * from the mock. A band holding four birds out of three hundred is a sliver a few
 * pixels wide; «٤ فرخات» printed on it would be unreadable at best and clipped at
 * worst, and this admin is reading it standing up. In the legend every number is
 * the same size whatever the band is worth, and the wedge keeps its one job:
 * showing the shape at a glance.
 *
 * Empty bands stay in the legend with «٠ فرخة». They are part of the reading —
 * "nothing came in under a kilo and a half" is the sentence the first row says.
 */
export function WeightDistribution({ bands }: { bands: WeightBand[] }) {
  const total = bands.reduce((sum, band) => sum + band.count, 0);
  if (total === 0) return null;

  // Walk the bands once into wedges, before rendering: each one starts where the
  // last ended, and the gap is taken off its *end* so the wedges keep the order
  // the bands are listed in.
  const wedges: { label: string; slice: string; d: string }[] = [];
  let cursor = 0;
  for (const band of bands) {
    const sweep = (band.count / total) * 360;
    const from = cursor;
    cursor += sweep;
    if (band.count === 0) continue;
    const to = from + Math.max(sweep - (sweep < 360 ? GAP : 0), 0.5);
    wedges.push({ label: band.label, slice: band.slice, d: slice(from, to) });
  }

  return (
    <figure className="flex flex-wrap items-center justify-between gap-4">
      <svg
        viewBox="0 0 100 100"
        className="size-[135px] shrink-0"
        role="presentation"
      >
        {wedges.map((wedge) => (
          <path key={wedge.label} d={wedge.d} className={wedge.slice} />
        ))}
      </svg>

      <div className="flex min-w-[160px] flex-1 flex-col gap-2.5">
        {bands.map((band) => (
          <div
            key={band.label}
            className="flex items-center justify-between gap-2 text-xs text-heading"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className={`size-3 shrink-0 rounded-xs ${band.swatch}`}
              />
              {band.label}
            </span>
            <span className="shrink-0 font-bold">
              {pluralizeChicken(band.count)}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
