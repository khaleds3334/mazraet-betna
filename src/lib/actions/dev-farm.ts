"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { normalizePhone, phoneError } from "@/lib/phone";

/**
 * ⚠️ DEV-ONLY — creates a whole test farm (Khaled, 2026-08-22). Delete this file,
 * /app/new-farm, and `create_farm` (migration 022) together when done with them.
 *
 * The refusal is repeated here even though the page is compiled out in
 * production: a server action is its own HTTP endpoint, reachable by anyone who
 * has seen its id, and it does not stop existing because the page that called it
 * was removed from the build. A page guard protects the page, not the action.
 */
export type NewFarmResult =
  | { ok: false; error: string }
  | { ok: true; phone: string };

export async function createTestFarm(
  name: string,
  rawPhone: string,
  pin: string,
): Promise<NewFarmResult> {
  if (process.env.NODE_ENV === "production") {
    return { ok: false, error: "مش متاح." };
  }

  const farmName = name.trim().replace(/\s+/g, " ");
  const phone = normalizePhone(rawPhone);
  const cleanPin = pin.replace(/\D/g, "");

  if (farmName.length < 2) {
    return { ok: false, error: "اكتب اسم المزرعة." };
  }
  const bad = phoneError(phone);
  if (bad) return { ok: false, error: bad };
  if (cleanPin.length !== 6) {
    return { ok: false, error: "الرقم السري لازم يكون ٦ أرقام." };
  }

  const admin = createAdminClient();
  const { data: farmId, error } = await admin.rpc("create_farm", {
    _name: farmName,
    _owner_phone: phone,
    _pin: cleanPin,
  });

  if (error) return { ok: false, error: "مقدرناش نعمل المزرعة، حاول تاني." };
  // The function returns null for a number that already belongs to a farm.
  if (!farmId) return { ok: false, error: "الرقم ده بتاع مزرعة موجودة." };

  return { ok: true, phone };
}
