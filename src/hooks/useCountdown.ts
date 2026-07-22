"use client";

import { useEffect, useState } from "react";

/**
 * A live countdown to a target instant, broken into days/hours/minutes/seconds.
 * Powers the sale card on the customer home (C-10→C-12). A `null` target (no
 * sale window set) reads as a finished countdown of zeros — the card still
 * renders its shape without ticking.
 *
 * The countdown is derived on render from a `now` clock that only advances
 * inside the interval callback, so it stays correct when the target changes
 * without setting state synchronously in the effect.
 */
export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isDone: boolean;
}

function compute(target: number | null, now: number): Countdown {
  if (target == null) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isDone: true };
  }
  const diff = Math.max(0, target - now);
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    isDone: diff <= 0,
  };
}

export function useCountdown(targetIso: string | null): Countdown {
  const target = targetIso ? new Date(targetIso).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (target == null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);

  return compute(target, now);
}
