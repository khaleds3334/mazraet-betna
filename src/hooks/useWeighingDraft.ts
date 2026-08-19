"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearStoredDraft,
  readStoredDraft,
  writeStoredDraft,
} from "./weighingDraftStorage";

/** One bird while it is being weighed — a row on screen, an `order_line` on save. */
export type WeighingDraft = {
  /** Unique inside this order; a bird added on the sheet has no database row. */
  key: string;
  id?: string;
  /** Which bag this bird goes in (FR-14ب). 1 until the order is split. */
  batchNo: number;
  approxWeight: number | null;
  actualWeight: number | null;
};

/** One bag as the split dialog defines it: how many birds, at what asked weight. */
export type WeighingBatch = { count: number; weight: number };

export interface WeighingState {
  cleaning: boolean;
  lines: WeighingDraft[];
}

/**
 * The bags the lines currently form — what the split dialog opens on. Read off
 * the lines rather than stored beside them, so the two can never drift apart.
 */
function toBatches(lines: WeighingDraft[]): WeighingBatch[] {
  const bags = [...new Set(lines.map((line) => line.batchNo))].sort(
    (a, b) => a - b,
  );
  return bags.map((batchNo) => {
    const inBag = lines.filter((line) => line.batchNo === batchNo);
    return { count: inBag.length, weight: inBag[0]?.approxWeight ?? 0 };
  });
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
  if (typeof window === "undefined")
    return { state: fromServer, restored: false };
  const stored = readStoredDraft(orderId);
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
    writeStoredDraft(orderId, { cleaning, lines });
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
        // A bird added at the end joins the last bag — that is where the admin
        // is standing when he adds it.
        batchNo: current.at(-1)?.batchNo ?? 1,
        approxWeight: current.at(-1)?.approxWeight ?? null,
        actualWeight: null,
      },
    ]);
  }, []);

  const removeLast = useCallback(() => {
    setLines((current) => current.slice(0, -1));
  }, []);

  /**
   * Deal the birds into bags (FR-14ب). The same birds in the same order — only
   * which bag they belong to and what was asked for them changes, so a weight
   * already read off the scale survives being re-bagged.
   */
  const split = useCallback((batches: WeighingBatch[]) => {
    setLines((current) => {
      const dealt = batches.flatMap((batch, index) =>
        Array.from({ length: batch.count }, () => ({
          batchNo: index + 1,
          approxWeight: batch.weight,
        })),
      );
      return current.map((line, position) => ({
        ...line,
        ...(dealt[position] ?? { batchNo: 1 }),
      }));
    });
  }, []);

  /** Called once the weights are safely on the server. */
  const clear = useCallback(() => clearStoredDraft(orderId), [orderId]);

  return {
    lines,
    batches: toBatches(lines),
    cleaning,
    setCleaning,
    restored: opening.restored,
    weigh,
    addBird,
    removeLast,
    split,
    clear,
  };
}
