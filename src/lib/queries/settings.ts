/**
 * Farm settings — the values the admin controls once and the whole app reads:
 * the kilo price, the cleaning fee, the weights and pickup slots a customer may
 * pick, and how long a cycle is raised (FR-5, FR-26).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
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
  /** Pickup slots, stored as `HH:mm`. */
  pickupTimes: string[];
  /** Days a cycle is raised before it may be sold. */
  raisingPeriodDays: number;
}

/** Sensible values when a farm has no settings row yet — the UI never shows NaN. */
const FALLBACK: FarmSettings = {
  salePrice: 0,
  cleaningPrice: 0,
  defaultCleaning: true,
  availableWeights: [],
  pickupTimes: [],
  raisingPeriodDays: RAISING_PERIOD_DAYS,
};

/**
 * The farm's settings row. Wrapped in React `cache` so several components in one
 * request (e.g. the header price badge and the order form) share a single read.
 */
export const getFarmSettings = cache(
  async (farmId: string): Promise<FarmSettings> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("settings")
      .select(
        "sale_price, cleaning_price, default_cleaning, available_weights, pickup_times, raising_period_days",
      )
      .eq("farm_id", farmId)
      .maybeSingle();
    if (!data) return FALLBACK;

    return {
      salePrice: Number(data.sale_price),
      cleaningPrice: Number(data.cleaning_price),
      defaultCleaning: data.default_cleaning,
      availableWeights: data.available_weights.map(Number),
      pickupTimes: data.pickup_times,
      raisingPeriodDays: data.raising_period_days,
    };
  },
);
