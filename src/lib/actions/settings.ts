"use server";

import { addDays } from "date-fns";
import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getFarmSettings } from "@/lib/queries/settings";
import { expectedSaleDate } from "@/lib/calculations/cycle";
import { isSellingPhase } from "@/lib/cyclePhase";
import { formatArabicDate } from "@/lib/format";
import { SALE_WINDOW_DAYS } from "@/lib/constants";
import { normalizePhone, phoneError } from "@/lib/phone";
import { adminCredentials } from "@/lib/auth/session";
import type { ActionResult } from "./cycles";

/**
 * Farm settings (A-70, FR-5 / FR-11). Two writes that behave differently on
 * purpose: the sale switch takes effect the instant it is tapped, because it is
 * visible to every customer and an admin who closed the sale and walked away
 * must not find it still open (Khaled, 2026-08-21). Everything else waits for
 * «حفظ الاعدادات».
 *
 * Both go through the RLS-bound client — `settings_write` and `cycle_write`
 * allow the farm owner only.
 */

/** Every screen that reads a price, the weights, or the sale state. */
function revalidateFarm(): void {
  revalidatePath("/admin/settings");
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/", "layout"); // the customer's home countdown and CTA
}

/**
 * Close or re-open the sale on the cycle that is currently selling (FR-11).
 *
 * This is not the cycle's selling *phase* — that is started and ended from the
 * cycle itself. This only answers "are we taking orders right now", so it
 * refuses when no cycle is selling: there would be nothing to take orders on,
 * and flipping the flag would put a sale on a flock that is still being raised.
 */
export async function setSaleOpen(open: boolean): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const supabase = await createClient();

  const { data: cycle } = await supabase
    .from("cycle")
    .select("id, sale_open, selling_started_at")
    .eq("farm_id", farm.farmId)
    .eq("is_active", true)
    .maybeSingle();

  if (!cycle) {
    return { ok: false, error: "مفيش دورة شغالة دلوقتي." };
  }
  // Re-opening is only ever un-doing a close: a flock still being raised has no
  // selling phase to be let back into (`lib/cyclePhase`).
  if (!isSellingPhase(cycle)) {
    return { ok: false, error: "ابدأ مرحلة البيع للدورة الأول." };
  }

  const { error } = await supabase
    .from("cycle")
    // The switch, and the record of when it moved. `selling_ended_at` is the
    // moment this flock actually stopped taking orders (migration 024) — the
    // forecast of when it would is in settings and is not touched here. Opening
    // again clears it: selling did not end after all.
    .update({
      sale_open: open,
      selling_ended_at: open ? null : new Date().toISOString(),
    })
    .eq("id", cycle.id);

  if (error) {
    return {
      ok: false,
      error: open ? "مقدرناش نفتح البيع، حاول تاني." : "مقدرناش نقفل البيع، حاول تاني.",
    };
  }

  revalidateFarm();
  return { ok: true };
}

export type SaveSettingsInput = {
  salePrice: number;
  cleaningPrice: number;
  availableWeights: number[];
  /**
   * `YYYY-MM-DD`, or "" to hand the date back to the app.
   *
   * Which date this *is* depends on what the farm is doing, because the screen
   * only ever shows one: while a sale is open it is when that sale ends
   * (`settings.sale_closes_at`); otherwise it is when the next one starts
   * (`settings.sale_starts_at`). Both are forecasts and both live here since
   * migration 024, so this writes one row either way. `editingSaleEnd` says
   * which column, rather than letting this action re-derive it — the admin saves
   * the field he was shown, even if the sale closed underneath him while he was
   * typing.
   */
  saleDate: string;
  editingSaleEnd: boolean;
  /**
   * The number customers ring (FR-30) — kept apart from `owner_phone`, which is
   * only how the admin's login is routed, so publishing a number never changes
   * the one he signs in with. Empty hands it back to the login number, which is
   * what a farm that has never set one already publishes.
   */
  contactPhone: string;
};

/**
 * Save the kilo price, the cleaning fee, the weights on offer, the date the next
 * sale starts, and the number customers ring.
 *
 * One button for the lot. The contact number used to have its own, on the
 * reasoning that a phone number can be wrong rather than merely different — but
 * a second save button on a screen that already has one only asks the admin
 * which of the two he needs (Khaled, 2026-08-22). It is refused the same way a
 * bad price is: inline, with nothing written.
 *
 * Changing a price here never touches an order already taken: an order stamps
 * `unit_price` and `cleaning_price` when it is booked (T-15 as amended), so the
 * new price meets the next order and nothing before it.
 *
 * Unticking a weight only stops it being *offered* — orders already placed at
 * that weight keep it, because the weight lives on the order line, not here.
 */
export async function saveSettings(
  input: SaveSettingsInput,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (!Number.isFinite(input.salePrice) || input.salePrice <= 0) {
    return { ok: false, error: "سعر الكيلو لازم يكون أكبر من صفر." };
  }
  if (!Number.isFinite(input.cleaningPrice) || input.cleaningPrice < 0) {
    return { ok: false, error: "سعر التنظيف مينفعش يكون بالسالب." };
  }
  if (input.availableWeights.length === 0) {
    return { ok: false, error: "سيب وزن واحد على الأقل، وإلا مفيش حاجة يطلبها." };
  }

  const contactPhone = normalizePhone(input.contactPhone);
  if (contactPhone) {
    const bad = phoneError(contactPhone);
    if (bad) return { ok: false, error: bad };
  }

  const supabase = await createClient();

  // An empty field is not "no sale ever" — it is "you work it out", which is
  // what null means to the countdown.
  const date = input.saleDate ? new Date(input.saleDate).toISOString() : null;

  // «فترة البيع تبدء في» is a promise on the customer's home, and a flock that
  // is still being raised cannot keep one made for a day before it is ready.
  // The field is capped at the same day; this is the half a stale form or a
  // replayed action cannot get around.
  if (!input.editingSaleEnd && date) {
    const { data: cycle } = await supabase
      .from("cycle")
      .select("start_date, sale_open, selling_started_at")
      .eq("farm_id", farm.farmId)
      .eq("is_active", true)
      .maybeSingle();

    // Raising — the same test every other screen reads the phase with.
    if (cycle && !isSellingPhase(cycle)) {
      const { raisingPeriodDays } = await getFarmSettings(farm.farmId);
      const ready = expectedSaleDate(cycle.start_date, raisingPeriodDays);
      if (new Date(date).getTime() < ready.getTime()) {
        return {
          ok: false,
          error: `الفراخ هتجهز يوم ${formatArabicDate(ready)} — مينفعش البيع يبدأ قبل كده.`,
        };
      }
    }
  }

  const { error } = await supabase
    .from("settings")
    .update({
      sale_price: input.salePrice,
      cleaning_price: input.cleaningPrice,
      // Stored smallest-first so every screen offering them reads one order,
      // whatever order they were tapped in.
      available_weights: [...input.availableWeights].sort((a, b) => a - b),
      // One field on the screen, one table underneath (migration 024). Which of
      // the two forecasts it is still rides along from the screen rather than
      // being re-derived — he saves the field he was shown, even if the sale
      // closed underneath him while he was typing.
      ...(input.editingSaleEnd
        ? { sale_closes_at: date }
        : { sale_starts_at: date }),
      updated_at: new Date().toISOString(),
    })
    .eq("farm_id", farm.farmId);

  if (error) return { ok: false, error: "مقدرناش نحفظ الاعدادات، حاول تاني." };

  // The number lives on the farm, not in its settings — it is who the farm is,
  // not how it sells. Written after the settings row so a refused price never
  // leaves a published number the admin did not get told about.
  //
  // Through the **service-role** client, not the request's. `farm` carries a
  // select policy and nothing else (002_rls), on purpose: an update policy there
  // would also let the browser's own token move `owner_phone` straight through
  // PostgREST, skipping the PIN and the auth-account move — the lockout
  // `changeLoginPhone` exists to make impossible. An RLS-bound update against a
  // table with no update policy matches no rows and reports no error, which is
  // how this number saved silently into nothing (Khaled, 2026-08-22).
  //
  // Reaching past RLS is only safe because the id is `getCurrentFarm`'s answer
  // about who is signed in — never one that arrived with the request. It is the
  // same route `changeLoginPhone` takes to the same table.
  const { data: written, error: farmError } = await createAdminClient()
    .from("farm")
    .update({ contact_phone: contactPhone || null })
    .eq("id", farm.farmId)
    .select("id")
    .maybeSingle();

  // `written` is the half that matters: a write that quietly touches nothing is
  // exactly what this looked like, and it must not come back as a success again.
  if (farmError || !written) {
    return { ok: false, error: "الاعدادات اتحفظت، بس رقم التواصل لأ. حاول تاني." };
  }

  revalidateFarm();
  return { ok: true };
}

/**
 * Change the admin PIN from settings (FR-1ب).
 *
 * The old PIN is required and is checked inside the database, in the same call
 * that writes the new one (`set_admin_pin`, migration 021) — a stolen phone with
 * a live session should not be enough to lock the owner out of his own farm.
 *
 * Goes through the **service-role** client, like login does: `admin_credentials`
 * has no RLS policy (T-14), and the function is granted to that role alone, so
 * neither PIN is ever handled anywhere the browser can reach.
 *
 * The two failures are told apart deliberately — a wrong current PIN is the
 * admin's own mistake and he needs to know which field to fix.
 */
export async function changePin(
  currentPin: string,
  newPin: string,
  confirmPin: string,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const current = currentPin.replace(/\D/g, "");
  const next = newPin.replace(/\D/g, "");
  const confirm = confirmPin.replace(/\D/g, "");

  if (current.length !== 6) {
    return { ok: false, error: "اكتب الرقم السري الحالي كامل (٦ أرقام)." };
  }
  if (next.length !== 6) {
    return { ok: false, error: "الرقم السري الجديد لازم يكون ٦ أرقام." };
  }
  if (next !== confirm) {
    return { ok: false, error: "الرقمين مش زي بعض — اكتب الجديد تاني." };
  }
  if (next === current) {
    return { ok: false, error: "الرقم الجديد زي القديم — اختار رقم تاني." };
  }

  const admin = createAdminClient();
  const { data: changed, error } = await admin.rpc("set_admin_pin", {
    _farm_id: farm.farmId,
    _current_pin: current,
    _new_pin: next,
  });

  if (error) return { ok: false, error: "حصلت مشكلة، حاول تاني." };
  if (!changed) return { ok: false, error: "الرقم السري الحالي غلط." };

  return { ok: true };
}

/**
 * Change the number the admin signs in with (FR-1, D-14).
 *
 * The phone is not just a column — it *is* the credential. `session.ts` derives
 * both halves of the auth account from it: the email is
 * `{phone}@admin.mazraetbetna.local` and the password is an HMAC over the phone.
 * So moving `farm.owner_phone` on its own routes the next login to a farm whose
 * auth account no longer exists, and locks the owner out of his own farm with no
 * way back except the database.
 *
 * Both halves move here, in an order chosen for what happens when one fails:
 * the auth account first, the farm row second, and the account put back if the
 * farm write fails. The half-way state that leaves is "auth moved, farm not",
 * which still signs in on the OLD number — the number he is standing there
 * holding. The reverse order fails the other way, on a number he has no reason
 * to try.
 *
 * The current PIN authorises it, checked in the database (`verify_admin_pin`)
 * for the same reason changing the PIN needs it: an unlocked phone must not be
 * enough to move the farm to a number the owner does not control.
 *
 * The session survives — the auth user's *id* never changes, only its email — so
 * the admin is not signed out. The new number applies from his next login.
 */
export async function changeLoginPhone(
  rawPhone: string,
  pin: string,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const phone = normalizePhone(rawPhone);
  const bad = phoneError(phone);
  if (bad) return { ok: false, error: bad };

  if (pin.replace(/\D/g, "").length !== 6) {
    return { ok: false, error: "اكتب الرقم السري كامل (٦ أرقام)." };
  }

  const admin = createAdminClient();

  const { data: row } = await admin
    .from("farm")
    .select("owner_id, owner_phone")
    .eq("id", farm.farmId)
    .maybeSingle();
  if (!row) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  if (row.owner_phone === phone) {
    return { ok: false, error: "ده نفس رقمك الحالي." };
  }

  const { data: valid } = await admin.rpc("verify_admin_pin", {
    _farm_id: farm.farmId,
    _pin: pin.replace(/\D/g, ""),
  });
  if (!valid) return { ok: false, error: "الرقم السري غلط." };

  // Login looks the farm up by number before it looks at customers, so a number
  // already on a customer would send that customer into the admin PIN screen —
  // a door they can never open, and their own account unreachable.
  const [{ data: otherFarm }, { data: customer }] = await Promise.all([
    admin.from("farm").select("id").eq("owner_phone", phone).maybeSingle(),
    admin.from("customer").select("id").eq("phone", phone).maybeSingle(),
  ]);
  if (otherFarm) return { ok: false, error: "الرقم ده بتاع مزرعة تانية." };
  if (customer) {
    return { ok: false, error: "الرقم ده مسجّل كعميل — امسحه من العملاء الأول." };
  }

  if (!row.owner_id) {
    // No auth account is linked yet, so there is nothing to move: the next login
    // creates one from whatever number the farm carries.
    const { error } = await admin
      .from("farm")
      .update({ owner_phone: phone })
      .eq("id", farm.farmId);
    if (error) return { ok: false, error: "مقدرناش نغيّر الرقم، حاول تاني." };
    revalidateFarm();
    return { ok: true };
  }

  const next = adminCredentials(phone);
  const { error: authError } = await admin.auth.admin.updateUserById(
    row.owner_id,
    { email: next.email, password: next.password, user_metadata: { phone } },
  );
  if (authError) {
    return { ok: false, error: "مقدرناش نغيّر الرقم، حاول تاني." };
  }

  const { error: farmError } = await admin
    .from("farm")
    .update({ owner_phone: phone })
    .eq("id", farm.farmId);

  if (farmError) {
    // Put the account back on the old number so the admin can still get in.
    const previous = adminCredentials(row.owner_phone);
    await admin.auth.admin.updateUserById(row.owner_id, {
      email: previous.email,
      password: previous.password,
      user_metadata: { phone: row.owner_phone },
    });
    return { ok: false, error: "مقدرناش نغيّر الرقم، حاول تاني." };
  }

  revalidateFarm();
  return { ok: true };
}
