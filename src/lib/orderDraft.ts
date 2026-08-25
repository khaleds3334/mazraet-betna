"use client";

import { bookableSlots } from "@/lib/pickupSlots";
import type { OrderForm } from "@/lib/queries/ordering";

/**
 * The order the customer is part-way through, kept alive while the app is open
 * (Khaled, 2026-08-25).
 *
 * He picks seven birds at two kilos, thumbs «الرئيسية» to check something, comes
 * back — and answers all of it again. The tabs navigate, and navigating unmounts
 * the form, so its state is gone with nothing having been wrong. This is the
 * memory that survives that trip.
 *
 * **A module variable, not `sessionStorage`.** The tabs move between pages
 * without reloading the document, so a module lives exactly as long as the trip
 * it has to survive — and dies on a genuine reload, which is where a customer
 * *does* expect a clean form. Storage would have outlived the intent and needed
 * its own expiry.
 *
 * **Never read on the server.** A module variable there belongs to the process,
 * not to a request: one customer's half-written order would open on the next
 * customer's screen. Every entry point below returns nothing when there is no
 * `window`, which also keeps the server-rendered form and its first client
 * render identical.
 *
 * Cleared when an order is actually sent — the next one starts from what the
 * farm suggests (`OrderForm.defaultCount` / `defaultWeight`), not from the one
 * already placed.
 */
export interface OrderDraft {
  count: number;
  /** The chosen approximate weight (kg), or null before one is picked. */
  weight: number | null;
  cleaning: boolean;
  /** Pickup day, `YYYY-MM-DD`. */
  date: string;
  /** Pickup slot, `HH:mm`. */
  time: string;
  notes: string;
}

let draft: OrderDraft | null = null;

export function saveDraft(next: OrderDraft): void {
  if (typeof window === "undefined") return;
  draft = next;
}

export function clearDraft(): void {
  draft = null;
}

/**
 * What the form should open on: the customer's unfinished order where it still
 * holds, and the farm's own suggestion everywhere it does not.
 *
 * Every remembered field is checked against what the farm offers *now*, because
 * the draft was made against an older answer and the screen it opens is live.
 * Birds can be booked out from under him, a weight can be taken off the row, and
 * a pickup slot passes on its own — a form that opened on any of those would be
 * a form whose confirm button refuses for a reason he cannot see.
 */
export function openingValues(data: OrderForm): OrderDraft {
  const fresh: OrderDraft = {
    count: data.defaultCount,
    weight: data.defaultWeight,
    cleaning: data.defaultCleaning,
    date: data.defaultDate,
    time: data.defaultTime,
    notes: "",
  };

  // Pinned to a const so the checks below read one value — `draft` is a module
  // variable and could in principle be replaced between them.
  const held = typeof window === "undefined" ? null : draft;
  if (!held) return fresh;

  const date = data.days.includes(held.date) ? held.date : fresh.date;
  const open = bookableSlots(data.slots, date);

  return {
    count: Math.min(held.count, data.available),
    weight:
      held.weight != null && data.weights.includes(held.weight)
        ? held.weight
        : fresh.weight,
    cleaning: held.cleaning,
    date,
    time: open.some((slot) => slot.time === held.time)
      ? held.time
      : (open[0]?.time ?? ""),
    notes: held.notes,
  };
}
