import type { WeighingState } from "./useWeighingDraft";

/**
 * Where an unfinished weigh-out is kept between openings of the sheet (T-43),
 * and the checking that a stored one is still shaped like our data.
 *
 * Separate from the hook because it answers a different question: the hook is
 * how a weigh-out behaves, this is only how it survives. Every call here is
 * wrapped — storage can be full, blocked, or hold something another version of
 * the app wrote, and none of that should stop the admin weighing.
 */
const storageKey = (orderId: string) => `mazraa:weighing:${orderId}`;

/** A weight is a number or "not taken yet"; anything else is not our data. */
const isWeight = (value: unknown) =>
  value === null || typeof value === "number";

function isDraft(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.key === "string" &&
    (line.id === undefined || typeof line.id === "string") &&
    typeof line.batchNo === "number" &&
    isWeight(line.approxWeight) &&
    isWeight(line.actualWeight)
  );
}

/** Reads back a stored weigh-out, or null if there isn't a usable one. */
export function readStoredDraft(orderId: string): WeighingState | null {
  try {
    const raw = window.localStorage.getItem(storageKey(orderId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const state = parsed as Record<string, unknown>;
    if (typeof state.cleaning !== "boolean") return null;
    if (!Array.isArray(state.lines) || !state.lines.every(isDraft)) return null;
    return state as unknown as WeighingState;
  } catch {
    return null;
  }
}

/**
 * Keeps the draft only while it holds a weight worth keeping — an untouched
 * sheet leaves nothing behind for the next opening to restore.
 */
export function writeStoredDraft(orderId: string, state: WeighingState) {
  try {
    if (state.lines.some((line) => line.actualWeight != null)) {
      window.localStorage.setItem(storageKey(orderId), JSON.stringify(state));
    } else {
      window.localStorage.removeItem(storageKey(orderId));
    }
  } catch {
    // Storage full or blocked: weighing carries on, it just won't survive.
  }
}

/** Called once the weights are safely on the server. */
export function clearStoredDraft(orderId: string) {
  try {
    window.localStorage.removeItem(storageKey(orderId));
  } catch {
    // Nothing to do — the draft is only a convenience.
  }
}
