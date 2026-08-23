/**
 * Farm settings — the values the admin controls once and the whole app reads:
 * the kilo price, the cleaning fee, the weights and pickup slots a customer may
 * pick, and how long a cycle is raised (FR-5, FR-26).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { expectedSaleDate } from "@/lib/calculations/cycle";
import { isSellingPhase } from "@/lib/cyclePhase";
import { parsePickupSlots, type PickupSlot } from "@/lib/pickupSlots";
import { RAISING_PERIOD_DAYS } from "@/lib/constants";

export interface FarmSettings {
  /** Price of one kilo, live — snapshotted onto an order at weighing (T-15). */
  salePrice: number;
  /** Fee for cleaning one bird. */
  cleaningPrice: number;
  /** Cleaning is on by default when a customer places an order. */
  defaultCleaning: boolean;
  /** The approximate weights a customer may choose from (kg). */
  availableWeights: number[];
  /** The pickup slots a customer may choose from, in order (C-24). */
  pickupSlots: PickupSlot[];
  /** Days a cycle is raised before it may be sold. */
  raisingPeriodDays: number;
  /**
   * The admin's own answer to «فترة البيع تبدء في» (A-70), ISO — or null to let
   * the app work it out. Only consulted between cycles: while one is running,
   * the cycle itself dates the sale.
   */
  saleStartsAt: string | null;
  /**
   * The admin's answer to «فترة البيع تنتهي في» — when the sale is expected to
   * stop taking orders. Dated five days out when the sale opens and moved freely
   * from here; a forecast, not a record (migration 024). What actually happened
   * is `cycle.selling_ended_at`.
   */
  saleClosesAt: string | null;
}

/**
 * What a farm looks like before its settings row is written. Reached only when
 * there genuinely is no row — never when the read itself failed, which is a
 * different thing and throws (see `getFarmSettings`).
 */
const FALLBACK: FarmSettings = {
  salePrice: 0,
  cleaningPrice: 0,
  defaultCleaning: true,
  availableWeights: [],
  pickupSlots: [],
  raisingPeriodDays: RAISING_PERIOD_DAYS,
  saleStartsAt: null,
  saleClosesAt: null,
};

/**
 * What the sale switch on A-70 is allowed to do, and what the date field means.
 *
 * There are three states, and only the last one can be switched:
 *   • no active cycle       — nothing to sell;
 *   • active, never opened  — the flock is still being raised, and the selling
 *     phase is started from the cycle, not from here;
 *   • selling               — the switch closes and re-opens orders.
 *
 * Whether a cycle counts as selling is `lib/cyclePhase`'s answer, not this
 * file's: `selling_started_at` says so and keeps saying so through every close
 * and re-open (migration 023).
 */
export interface SaleControlState {
  /** Orders are being taken right now. */
  open: boolean;
  /** The switch has a cycle to act on. */
  canToggle: boolean;
  /** The line under the heading, saying what the switch will do or why it won't. */
  hint: string;
  /** True while a sale is open — the date field then edits its *end*. */
  editingSaleEnd: boolean;
  /** The date the field starts on, `YYYY-MM-DD`, or "" when none is set. */
  date: string;
  /**
   * The earliest day «فترة البيع تبدء في» may name, `YYYY-MM-DD` — the day this
   * flock is ready, i.e. its start date plus the raising period. "" when there
   * is no flock to be early for.
   *
   * A sale date before the birds are ready is a promise on the customer's home
   * that the farm cannot keep on the day it comes due (Khaled, 2026-08-22). The
   * field caps at it and `saveSettings` refuses past it.
   */
  minDate: string;
}

/** `YYYY-MM-DD` in local time — what a native date input expects. */
function toDateInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function getSaleControlState(
  farmId: string,
): Promise<SaleControlState> {
  const supabase = await createClient();

  const [{ data: cycle }, settings] = await Promise.all([
    supabase
      .from("cycle")
      .select("id, sale_open, sale_auto_closed, selling_started_at, start_date")
      .eq("farm_id", farmId)
      .eq("is_active", true)
      .maybeSingle(),
    getFarmSettings(farmId),
  ]);

  // A date that has gone by is not in force any more — the countdown falls back
  // to the rolling estimate the moment it passes (`getActiveSaleState`). So the
  // field is empty rather than showing a day that has been and gone as though it
  // were still the answer (Khaled, 2026-08-22). Empty is what «اعمل انت حسابه»
  // looks like in this field, and it is the honest state.
  const chosenStart =
    settings.saleStartsAt &&
    new Date(settings.saleStartsAt).getTime() > Date.now()
      ? settings.saleStartsAt
      : null;
  const startDate = toDateInput(chosenStart);

  if (!cycle) {
    return {
      open: false,
      canToggle: false,
      hint: "لا توجد دورة بيع حاليا",
      editingSaleEnd: false,
      date: startDate,
      minDate: "",
    };
  }

  if (!isSellingPhase(cycle)) {
    return {
      open: false,
      canToggle: false,
      hint: "الدورة لسه في مرحلة التربية — ابدأ البيع من صفحة الدورات",
      editingSaleEnd: false,
      date: startDate,
      // He can still say when this flock's sale starts, and that date is what
      // the customer's home counts down to — the switch above is the only thing
      // the raising phase takes away from him.
      minDate: toDateInput(
        expectedSaleDate(
          cycle.start_date,
          settings.raisingPeriodDays,
        ).toISOString(),
      ),
    };
  }

  // The flock closed this one, not the admin (migration 025) — so the switch is
  // dead: there is nothing to sell, and it opens itself when birds come back.
  if (cycle.sale_auto_closed) {
    return {
      open: false,
      canToggle: false,
      hint: "الفراخ خلصت — البيع هيفتح لوحده لو رجعت فراخ",
      editingSaleEnd: false,
      date: startDate,
      minDate: "",
    };
  }

  return {
    open: cycle.sale_open,
    canToggle: true,
    hint: cycle.sale_open
      ? "البيع مفتوح — اقفله عشان توقف الطلبات مؤقتا"
      : "البيع مقفول مؤقتا — العملاء مش بيقدروا يطلبوا",
    editingSaleEnd: cycle.sale_open,
    // Both dates live in settings now (migration 024) — the field writes to one
    // table whichever it is showing.
    date: cycle.sale_open ? toDateInput(settings.saleClosesAt) : startDate,
    minDate: "",
  };
}

/**
 * The farm's settings row. Wrapped in React `cache` so several components in one
 * request (e.g. the header price badge and the order form) share a single read.
 */
export const getFarmSettings = cache(
  async (farmId: string): Promise<FarmSettings> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("settings")
      .select(
        "sale_price, cleaning_price, default_cleaning, available_weights, pickup_slots, raising_period_days, sale_starts_at, sale_closes_at",
      )
      .eq("farm_id", farmId)
      .maybeSingle();

    // **A failed read is not a farm that prices at zero.** This used to fall
    // through to FALLBACK along with every other empty answer, and the day the
    // two parted company it cost real money: migration 027 dropped
    // `pickup_times` while a build that still selected it was live, so every
    // read errored and A-70 came up «٠ جنيه» for the kilo, «٠ جنيه» for
    // cleaning, and no weights at all — with no error anywhere on the screen.
    // The admin saved over his own prices trying to fix it (Khaled, 2026-08-23).
    //
    // Throwing sends the screen to `error.tsx`, which says something is wrong
    // and offers to retry. That is worse than working and far better than a
    // price of zero that looks exactly like a price he set. A silent wrong
    // number has no error, no empty state, and no way to notice (T-58).
    if (error) {
      console.error("getFarmSettings failed", { farmId, error });
      throw new Error(`Could not read settings for farm ${farmId}`);
    }

    // No row is a different thing, and a real one: a farm created before its
    // settings were written. Zeros are honest there — nothing has been priced.
    if (!data) return FALLBACK;

    return {
      salePrice: Number(data.sale_price),
      cleaningPrice: Number(data.cleaning_price),
      defaultCleaning: data.default_cleaning,
      availableWeights: data.available_weights.map(Number),
      pickupSlots: parsePickupSlots(data.pickup_slots),
      raisingPeriodDays: data.raising_period_days,
      saleStartsAt: data.sale_starts_at,
      saleClosesAt: data.sale_closes_at,
    };
  },
);
