"use client";

import { formatArabicNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * One choice in the "اختار الوزن المطلوب" row: a kettlebell glyph with the weight
 * printed inside it, filled lime once picked (Figma component 2668:1440).
 *
 * The glyph is a bespoke design SVG rather than a Hugeicons name — the library
 * has nothing like it, and it needs a fill that follows the selected state
 * (same rationale as T-19). Drawn in a 70-unit box: a circle handle over the
 * body, both traced straight from the Figma export.
 *
 * The badge is a whole 70px control, so it clears the 44px touch rule on its own.
 */
export function WeightBadge({
  weight,
  selected,
  onSelect,
}: {
  weight: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className="relative size-[70px] shrink-0"
    >
      <svg
        viewBox="0 0 70 70"
        fill="none"
        aria-hidden
        className={cn(
          "size-full transition-colors",
          selected ? "text-primary-hover" : "text-control-border",
        )}
      >
        <g transform="translate(25.25 7.75)">
          <path
            d="M9.75 18.5C14.5826 18.5 18.5 14.5825 18.5 9.75C18.5 4.91752 14.5826 1 9.75 1C4.91737 1 1 4.91752 1 9.75C1 14.5825 4.91737 18.5 9.75 18.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
        <g transform="translate(7.75 25.25)">
          <path
            d="M36.2063 1H18.2934C14.2952 1 12.2961 1 10.7911 2.1011C9.28605 3.20217 8.65389 5.12738 7.38955 8.97738L3.5583 20.644C1.25717 27.6513 0.1066 31.1548 1.82676 33.5774C3.54695 36 7.18535 36 14.4622 36H40.0373C47.3141 36 50.9527 36 52.6729 33.5774C54.3929 31.1548 53.2425 27.6513 50.9413 20.644L47.11 8.97738C45.8456 5.12738 45.2135 3.20217 43.7085 2.1011C42.2035 1 40.2045 1 36.2063 1Z"
            className={selected ? "fill-primary" : "fill-transparent"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>

      {/* Sits over the body of the kettlebell, not the whole badge. */}
      <span className="absolute inset-x-0 top-[47.5%] text-base font-bold text-heading">
        {formatArabicNumber(weight)}
      </span>
    </button>
  );
}
