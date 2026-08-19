"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** One bird while it is being weighed — a row on screen, an `order_line` on save. */
export type WeighingDraft = {
  /** Unique inside this order; a bird added on the sheet has no database row. */
  key: string;
  id?: string;
  approxWeight: number | null;
  actualWeight: number | null;
};

export interface WeighingState {
  cleaning: boolean;
  lines: WeighingDraft[];
}

const storageKey = (orderId: string) => `mazraa:weighing:${orderId}`;

const isDraft = (value: unknown): value is WeighingDraft => {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.key === "string" &&
    (line.id === undefined || typeof line.id === "string") &&
    (line.approxWeight === null || typeof line.approxWeight === "number") &&
    (line.actualWeight === null || typeof line.actualWeight === "number")
  );
};

/** Reads back a stored weigh-out, or null if there isn't a usable one. */
function readStored(orderId: string): WeighingState | null {
  try {
    const raw = window.localStorage.getItem(storageKey(orderId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const state = parsed as Record<string, unknown>;
    if (typeof state.cleaning !== "boolean") return null;
    if (!Array.isArray(state.lines) || !state.lines.every(isDraft)) return null;
    return { cleaning: state.cleaning, lines: state.lines };
  } catch {
    // A full or blocked storage, or something else's key under ours — either
    // way the order still weighs fine from the server's values.
    return null;
  }
}

/** New birds are keyed `new-1`, `new-2`… — pick up after the restored ones. */
function lastAddedNumber(lines: WeighingDraft[]): number {
  return lines.reduce((highest, line) => {
    const match = /^new-(\d+)$/.exec(line.key);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
}

/**
 * The weigh-out this sheet starts from: whatever was left on the device if it
 * holds real weights, otherwise the order as the server has it.
 *
 * Read while the state initialises rather than in an effect, so the sheet never
 * renders the server's values first and then swaps them — the admin would see
 * his weights blink. That is safe here because the sheet renders no HTML on the
 * server at all: `BottomSheet` portals into `<body>` and yields nothing until
 * the page has hydrated, so there is nothing for a restored value to mismatch.
 */
function openingState(
  orderId: string,
  fromServer: WeighingState,
): { state: WeighingState; restored: boolean } {
  if (typeof window === "undefined") return { state: fromServer, restored: false };
  const stored = readStored(orderId);
  // Only worth restoring if a weight was actually entered — otherwise the
  // server's rows are the fresher copy of the very same thing.
  return stored?.lines.some((line) => line.actualWeight != null)
    ? { state: stored, restored: true }
    : { state: fromServer, restored: false };
}

/**
 * Holds a weigh-out while it is being entered, and keeps it on the device until
 * it is saved (A-52).
 *
 * Why it survives at all: the admin weighs four birds, the phone locks in his
 * pocket or he taps the wrong thing, and the four weights are gone — so he
 * reweighs birds already in the bag, or worse, guesses. The paper notebook this
 * app replaces never lost a line. Nothing is sent to the server until he saves
 * (an order half-priced is worse than one not yet priced), so the draft lives in
 * `localStorage` under the order's own id and is cleared the moment it saves.
 */
export function useWeighingDraft(orderId: string, fromServer: WeighingState) {
  const [opening] = useState(() => openingState(orderId, fromServer));
  const [lines, setLines] = useState<WeighingDraft[]>(opening.state.lines);
  const [cleaning, setCleaning] = useState(opening.state.cleaning);
  const added = useRef(lastAddedNumber(opening.state.lines));

  useEffect(() => {
    try {
      if (lines.some((line) => line.actualWeight != null)) {
        window.localStorage.setItem(
          storageKey(orderId),
          JSON.stringify({ cleaning, lines }),
        );
      } else {
        // Back to an untouched sheet — leave nothing behind to restore.
        window.localStorage.removeItem(storageKey(orderId));
      }
    } catch {
      // Storage full or blocked: weighing carries on, it just won't survive.
    }
  }, [orderId, cleaning, lines]);

  const weigh = useCallback((key: string, weight: number) => {
    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, actualWeight: weight } : line,
      ),
    );
  }, []);

  /** A new bird starts on the weight the rest of the order was booked at. */
  const addBird = useCallback(() => {
    setLines((current) => [
      ...current,
      {
        key: `new-${(added.current += 1)}`,
        approxWeight: current.at(-1)?.approxWeight ?? null,
        actualWeight: null,
      },
    ]);
  }, []);

  const removeLast = useCallback(() => {
    setLines((current) => current.slice(0, -1));
  }, []);

  /** Called once the weights are safely on the server. */
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey(orderId));
    } catch {
      // Nothing to do — the draft is only a convenience.
    }
  }, [orderId]);

  return {
    lines,
    cleaning,
    setCleaning,
    restored: opening.restored,
    weigh,
    addBird,
    removeLast,
    clear,
  };
}
