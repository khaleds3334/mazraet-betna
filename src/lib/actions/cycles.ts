"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getCycleEstimateBasis, hasActiveCycle } from "@/lib/queries/cycles";
import { estimatedCycleExpenses } from "@/lib/calculations/cycle";
import {
  bagsByPhase,
  expectedFeedBags,
  feedBagsAvailable,
} from "@/lib/calculations/feed";
import { countOpenCycleOrders } from "@/lib/queries/orders";
import { countAvailableChickens } from "@/lib/queries/selling";
import { pluralizeBags, pluralizeChicken, pluralizeOrder } from "@/lib/format";
import { SALE_WINDOW_DAYS } from "@/lib/constants";

/**
 * Cycle actions (admin only). Writes go through the RLS-bound client — the
 * cycle_write policy allows only the farm owner (is_admin), so a non-admin
 * request can't create a cycle even if it reached here.
 */

export type CreateCycleInput = {
  name: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (may be empty)
  chickCount: number;
  chickPrice: number;
};

export type CreateCycleResult = { ok: false; error: string } | { ok: true };

/**
 * Register a new cycle (FR-4): chick count, start date/time, chick price. Creates
 * the farm's single active cycle. Only one cycle can be active at a time, so this
 * refuses if one is already running rather than hit the DB unique-index error.
 */
export async function createCycle(
  input: CreateCycleInput,
): Promise<CreateCycleResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const chickCount = Math.trunc(input.chickCount);
  const chickPrice = input.chickPrice;
  if (!Number.isFinite(chickCount) || chickCount <= 0) {
    return { ok: false, error: "اكتب عدد الكتاكيت صح." };
  }
  if (!Number.isFinite(chickPrice) || chickPrice < 0) {
    return { ok: false, error: "اكتب سعر الكتكوت صح." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) {
    return { ok: false, error: "اختار تاريخ بداية الدورة." };
  }

  if (await hasActiveCycle(farm.farmId)) {
    return { ok: false, error: "فيه دورة شغالة بالفعل، لازم تخلّصها الأول." };
  }

  const name = input.name.trim();
  const startTime = input.startTime.trim();

  // The same forecast the sheet was showing him, recomputed here from the same
  // reads rather than trusted from the form — and kept, so the expenses tile has
  // a line to cross later (D-46). Recomputed server-side and stored once: a
  // forecast that is re-derived mid-cycle moves every time he buys feed at a new
  // price, and «فوق المتوقع» would then mean the market moved, not that he spent.
  const basis = await getCycleEstimateBasis(farm.farmId);
  const forecast = estimatedCycleExpenses(chickCount, chickPrice, basis);

  const supabase = await createClient();
  const { error } = await supabase.from("cycle").insert({
    farm_id: farm.farmId,
    chick_count: chickCount,
    chick_price: chickPrice,
    start_date: input.startDate,
    start_time: startTime || null,
    name: name || null,
    estimated_expenses: forecast.total,
    is_active: true,
  });

  if (error) {
    return { ok: false, error: "مقدرناش نسجّل الدورة، حاول تاني." };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/cycles");
  return { ok: true };
}

export type ActionResult = { ok: false; error: string } | { ok: true };

/**
 * Record dead birds on the active cycle (FR-23, A-14). The live count and the
 * mortality rate on the dashboard drop automatically because both derive from
 * the mortality rows on read. Admin-only via RLS (mortality_all → is_admin).
 */
export async function recordMortality(count: number): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const n = Math.trunc(count);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "اكتب عدد النافق صح." };
  }

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const { error } = await supabase
    .from("mortality")
    .insert({ farm_id: farm.farmId, cycle_id: cycle.id, count: n });

  if (error) return { ok: false, error: "مقدرناش نسجّل النفوق، حاول تاني." };

  revalidatePath("/admin");
  return { ok: true };
}

/**
 * Open the selling phase on the active cycle (A-11 "بدء مرحلة البيع" → the
 * confirm dialog, node 3608:3838). Sets the kilo price the cycle sells at and
 * flips `sale_open` on, which moves the admin home to the selling dashboard and
 * lets customers order (FR-11).
 *
 * The price lands on `settings.sale_price`, so the admin can change it later from
 * Settings without touching this cycle — and an already-weighed order keeps its
 * own snapshotted price, so past invoices never move (T-15, FR-5).
 *
 * The price is written first: if that succeeds but the flip fails, the sale stays
 * closed and the admin simply retries. The reverse order could open the sale at
 * the old price, which is the expensive mistake.
 */
export async function startSelling(salePrice: number): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (!Number.isFinite(salePrice) || salePrice <= 0) {
    return { ok: false, error: "اكتب سعر كيلو الفراخ الأول." };
  }

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  const { error: priceError } = await supabase
    .from("settings")
    .update({ sale_price: salePrice })
    .eq("farm_id", farm.farmId);
  if (priceError) {
    return { ok: false, error: "مقدرناش نحفظ السعر، حاول تاني." };
  }

  const { error } = await supabase
    .from("cycle")
    .update({
      sale_open: true,
      // The window the customer's home counts down to. Dated here so the sale
      // never opens without an end — the admin can move it from settings, but
      // he should not have to before customers can be told anything.
      sale_closes_at: addDays(new Date(), SALE_WINDOW_DAYS).toISOString(),
    })
    .eq("id", cycle.id);

  if (error) return { ok: false, error: "مقدرناش نفتح البيع، حاول تاني." };

  revalidatePath("/admin");
  revalidatePath("/"); // opening the sale changes the customer home too
  return { ok: true };
}

/**
 * End the active cycle — «انتهاء فترة البيع» on the running cycle's row (A-44).
 * The flock is sold, so the cycle closes for good: the sale shuts, the cycle
 * stops being the farm's active one, and `ended_at` records when. From here it is
 * history — a row in the list with its final profit — and the farm is free to
 * register the next one (FR-4).
 *
 * **Refused while any order is still open** (D-36). An order that has been
 * weighed but not handed over belongs to a cycle the admin can still act on; once
 * the cycle closes, the orders screen looks at the *next* one and that order is
 * stranded. So he finishes them first, and the message says how many.
 *
 * There is no undo. The confirm dialog is where that is made clear.
 */
/**
 * What the admin says about feed still sitting in the store when he ends a cycle
 * (FR-22). Bags left over mean one of exactly two things, and only he knows
 * which — see `endCycle`.
 */
export type LeftoverFeedAnswer =
  /** They were opened and he forgot to log them. Record the withdrawals. */
  | "withdrawn"
  /** They were never taken for this flock. Take them off its expenses. */
  | "not-taken";

export async function endCycle(
  leftoverFeed?: LeftoverFeedAnswer,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, chick_count")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();
  if (!cycle) return { ok: false, error: "مفيش دورة شغالة دلوقتي." };

  // Both checks run again here, never only in the dialog: the counts the screen
  // was rendered with can be minutes old, and a customer can order in between.
  const openOrders = await countOpenCycleOrders(cycle.id);
  if (openOrders > 0) {
    return {
      ok: false,
      error: `فيه ${pluralizeOrder(openOrders)} لسه مفتوحة في الدورة، خلّصها الأول.`,
    };
  }

  // A cycle that closes over unsold birds walks the flock into history (D-49).
  // Read after the order check, so «متوفرة» here can only mean birds nobody has
  // asked for.
  const available = await countAvailableChickens(cycle.id, cycle.chick_count);
  if (available > 0) {
    return {
      ok: false,
      error: `لسه فيه ${pluralizeChicken(available)} متوفرة في الدورة، بيعها او سجّلها نافق الأول.`,
    };
  }

  // **Feed still in the store** (FR-22). Bags bought and never opened are not a
  // mistake in themselves — he buys a little over, or the flock eats less than
  // the forecast — but they cannot follow the cycle into history unexplained.
  // Left alone they are either work he forgot to log, or money charged to a
  // flock that never ate it, and both are invisible once the cycle closes
  // (Khaled, 2026-08-22).
  //
  // Only he knows which, so the cycle will not close until he says. Unlike the
  // two checks above this is a question, not a wall: either answer lets him
  // through.
  const [{ data: purchases }, { data: withdrawals }] = await Promise.all([
    supabase
      .from("feed")
      // Newest first: the bags still in the store are the ones bought last.
      .select("id, bags, phase, purchased_on, created_at")
      .eq("cycle_id", cycle.id)
      .order("purchased_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("feed_withdrawal").select("bags, phase").eq("cycle_id", cycle.id),
  ]);
  const bought = purchases ?? [];
  const opened = withdrawals ?? [];
  const leftover = feedBagsAvailable(bought, opened);

  if (leftover > 0) {
    if (!leftoverFeed) {
      return {
        ok: false,
        error: `لسه فيه ${pluralizeBags(leftover)} علف في المخزن، قوللي اتعملت ايه الأول.`,
      };
    }

    const failed = {
      ok: false,
      error: "مقدرناش نظبّط العلف المتبقي، حاول تاني.",
    } as const;

    if (leftoverFeed === "withdrawn") {
      // Logged as opened today, split the way the store actually holds them —
      // the two piles are counted apart (D-43), so one lump row would leave
      // بادي and نامي disagreeing with the grid they draw.
      const requiredBadi = expectedFeedBags(cycle.chick_count).badi;
      const boughtByPhase = bagsByPhase(bought, requiredBadi);
      const openedByPhase = bagsByPhase(opened, requiredBadi);
      const today = new Date().toISOString().slice(0, 10);

      const rows = (["badi", "nami"] as const)
        .map((phase) => ({
          phase,
          bags: Math.max(0, boughtByPhase[phase] - openedByPhase[phase]),
        }))
        .filter((row) => row.bags > 0)
        .map((row) => ({
          farm_id: farm.farmId,
          cycle_id: cycle.id,
          bags: row.bags,
          phase: row.phase,
          withdrawn_on: today,
        }));

      if (rows.length > 0) {
        const { error } = await supabase.from("feed_withdrawal").insert(rows);
        if (error) return failed;
      }
    } else {
      // Never taken, so it was never this cycle's cost. `bought` arrives newest
      // first, and that order is the point: the bags still in the store are the
      // ones bought last, so their own price is what comes off. Averaging it
      // across the cycle would charge this flock for feed at a price it never
      // paid.
      let remaining = leftover;

      for (const row of bought) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, row.bags);
        remaining = Math.round((remaining - take) * 100) / 100;

        const rest = Math.round((row.bags - take) * 100) / 100;
        const { error } =
          rest > 0
            ? await supabase.from("feed").update({ bags: rest }).eq("id", row.id)
            : await supabase.from("feed").delete().eq("id", row.id);
        if (error) return failed;
      }
    }
  }

  const { error } = await supabase
    .from("cycle")
    .update({
      is_active: false,
      sale_open: false,
      ended_at: new Date().toISOString(),
    })
    .eq("id", cycle.id);

  if (error) return { ok: false, error: "مقدرناش ننهي الدورة، حاول تاني." };

  revalidatePath("/admin/cycles");
  revalidatePath("/admin");
  revalidatePath("/"); // the customer home stops offering a sale that ended
  return { ok: true };
}
