"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentFarm } from "@/lib/queries/admin";
import { getDefaultOrdersCycle } from "@/lib/queries/cycles";
import {
  listCustomerOrders,
  type CustomerOrder,
} from "@/lib/queries/orders";
import type { ActionResult } from "./cycles";

/**
 * Customer records the admin keeps himself (FR-8): registering a walk-in or a
 * caller (A-34), and correcting their details later (A-35). The customer is a
 * permanent entity that outlives cycles, so nothing here touches a cycle.
 *
 * A customer added this way has no login yet (`auth_user_id` stays null) — it's
 * created and linked the first time they sign in with that number (D-14).
 */

const PHONE_RE = /^\d{11}$/;
// Arabic-only, same rule as the customer's own registration screen: the admin
// reads no Latin, so a Latin name in his list is unreadable to him.
const NAME_RE = /^[؀-ۿ\s]+$/;

/** Postgres unique-violation — the farm already has this number. */
const UNIQUE_VIOLATION = "23505";

type ParsedCustomer =
  | { ok: false; error: string }
  | { ok: true; name: string; phone: string };

/** Normalise and validate what the sheet sent, once for both actions. */
function parse(rawName: string, rawPhone: string): ParsedCustomer {
  const name = rawName.trim().replace(/\s+/g, " ");
  const phone = rawPhone.replace(/\D/g, "");

  if (name.length < 2 || !NAME_RE.test(name)) {
    return { ok: false, error: "اكتب اسم العميل بالعربي." };
  }
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "الرقم مش مظبوط، لازم يكون ١١ رقم." };
  }
  return { ok: true, name, phone };
}

/**
 * Register a customer (A-34). The phone is what identifies him for the rest of
 * his life on the farm, so a number the farm already has is refused by name —
 * the admin needs to know *who* has it, not just that it's taken.
 */
export async function addCustomer(
  rawName: string,
  rawPhone: string,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const parsed = parse(rawName, rawPhone);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("customer")
    .select("name")
    .eq("farm_id", farm.farmId)
    .eq("phone", parsed.phone)
    .maybeSingle();
  if (existing) {
    return { ok: false, error: `الرقم ده مسجّل بالفعل لـ ${existing.name}.` };
  }

  const { error } = await supabase.from("customer").insert({
    farm_id: farm.farmId,
    name: parsed.name,
    phone: parsed.phone,
  });
  if (error) {
    // Someone saved the same number between the check above and here.
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "الرقم ده مسجّل بالفعل لعميل تاني." };
    }
    return { ok: false, error: "مقدرناش نسجّل العميل، حاول تاني." };
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/orders");
  return { ok: true };
}

/**
 * Correct a customer's name or number (A-35). His orders, payments and debt all
 * hang off his id, so none of them move — the row just reads right afterwards.
 */
export async function updateCustomer(
  customerId: string,
  rawName: string,
  rawPhone: string,
): Promise<ActionResult> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  const parsed = parse(rawName, rawPhone);
  if (!parsed.ok) return parsed;

  const supabase = await createClient();

  // Any *other* customer on this farm holding the new number.
  const { data: clash } = await supabase
    .from("customer")
    .select("name")
    .eq("farm_id", farm.farmId)
    .eq("phone", parsed.phone)
    .neq("id", customerId)
    .maybeSingle();
  if (clash) {
    return { ok: false, error: `الرقم ده مسجّل بالفعل لـ ${clash.name}.` };
  }

  const { error } = await supabase
    .from("customer")
    .update({ name: parsed.name, phone: parsed.phone })
    .eq("id", customerId)
    .eq("farm_id", farm.farmId);
  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { ok: false, error: "الرقم ده مسجّل بالفعل لعميل تاني." };
    }
    return { ok: false, error: "مقدرناش نحفظ التعديل، حاول تاني." };
  }

  revalidatePath("/admin/customers");
  revalidatePath("/admin/orders");
  return { ok: true };
}

/**
 * A customer's whole order history, for the sheet behind their row (A-32).
 *
 * A server *action* only because a client component cannot call a query itself —
 * the read lives where every read lives, in `/lib/queries`, and this is the wire
 * it travels on. It writes nothing.
 *
 * On demand, not with the screen: the customers list would otherwise ship every
 * customer's history to open one of them.
 */
export async function fetchCustomerOrders(
  customerId: string,
): Promise<
  { ok: true; orders: CustomerOrder[] } | { ok: false; error: string }
> {
  const farm = await getCurrentFarm();
  if (!farm) return { ok: false, error: "حصلت مشكلة، سجّل الدخول تاني." };

  try {
    const cycle = await getDefaultOrdersCycle(farm.farmId);
    const orders = await listCustomerOrders(
      farm.farmId,
      customerId,
      cycle?.cycleId ?? null,
    );
    return { ok: true, orders };
  } catch {
    return { ok: false, error: "مقدرناش نجيب الطلبات، حاول تاني." };
  }
}
