"use client";

import { useState } from "react";
import {
  CycleStatCard,
  type CycleStatCardProps,
} from "../shared/CycleStatCard";

/**
 * A stat tile whose value stays hidden behind a blur until the admin taps it
 * (A-20's "اجمالي الدخل"). The whole tile is the tap target, so it comfortably
 * clears the 44px minimum, and tapping again hides the figure back.
 */
export function RevealableStatCard(
  props: Omit<CycleStatCardProps, "blurred">,
) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((shown) => !shown)}
      aria-label={revealed ? `إخفاء ${props.label}` : `إظهار ${props.label}`}
      aria-pressed={revealed}
      className="flex w-full"
    >
      <CycleStatCard {...props} blurred={!revealed} />
    </button>
  );
}
