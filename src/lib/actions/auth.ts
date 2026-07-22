"use server";

import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  signInCustomer,
  signInAdmin,
  type CustomerAuthRow,
} from "@/lib/auth/session";

/**
 * Auth actions. Login is phone-only for customers, phone + PIN for the admin
 * (D-01). The shared sign-in plumbing (no-OTP session, D-14) lives in
 * /lib/auth/session.ts; this file is the three actions the screens call.
 */

const PHONE_RE = /^\d{11}$/;
// Names are Arabic only (the field asks for it, and the admin reads no Latin).
const NAME_RE = /^[؀-ۿ\s]+$/;

export type StartLoginResult =
  | { ok: false; error: string }
  | { ok: true; next: "pin" | "register" | "home"; phone: string };

/**
 * First step of login: the user typed a phone number and pressed "دخول".
 * Decides where they go next based on who the number belongs to (FR-1):
 *   • the farm owner  → PIN screen
 *   • a known customer → signed in, straight to the customer app
 *   • an unknown number → self-registration ("نورتنا لأول مرة")
 */
export async function startLogin(rawPhone: string): Promise<StartLoginResult> {
  const phone = rawPhone.replace(/\D/g, "");
  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "معلش، اتأكد إنك كاتب رقم الموبايل صح (١١ رقم)." };
  }

  const admin = createAdminClient();

  // 1) Is this the admin? The farm stores its owner's phone (owner_phone).
  const { data: farm } = await admin
    .from("farm")
    .select("id")
    .eq("owner_phone", phone)
    .maybeSingle();
  if (farm) return { ok: true, next: "pin", phone };

  // 2) A registered customer (added by the admin, or self-registered before)?
  const { data: customer } = await admin
    .from("customer")
    .select("id, auth_user_id")
    .eq("phone", phone)
    .maybeSingle();
  if (!customer) return { ok: true, next: "register", phone };

  // Known customer → make sure they have an auth account, then sign them in.
  try {
    await signInCustomer(phone, customer);
  } catch {
    return { ok: false, error: "حصلت مشكلة في الدخول، حاول تاني." };
  }
  return { ok: true, next: "home", phone };
}

export type RegisterResult = { ok: false; error: string } | { ok: true };

/**
 * Second step for a brand-new customer: they typed a name on "نورتنا لأول مرة".
 * Creates the customer record, their auth account, signs them in, and drops them
 * into the app. Reuses the same session mechanism as login (FR-1 exception path).
 */
export async function registerCustomer(
  rawPhone: string,
  rawName: string,
): Promise<RegisterResult> {
  const phone = rawPhone.replace(/\D/g, "");
  const name = rawName.trim().replace(/\s+/g, " ");

  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "الرقم مش مظبوط، ارجع واكتبه تاني." };
  }
  if (name.length < 2 || !NAME_RE.test(name)) {
    return { ok: false, error: "أتأكد من ادخال الاسم صحيح باللغة العربية" };
  }

  const admin = createAdminClient();

  // Shouldn't happen (login already routed), but never let the admin's number
  // become a customer.
  const { data: farm } = await admin
    .from("farm")
    .select("id")
    .eq("owner_phone", phone)
    .maybeSingle();
  if (farm) {
    return { ok: false, error: "الرقم ده بتاع صاحب المزرعة، ارجع وسجّل الدخول." };
  }

  // Reuse an existing row if the admin already added this walk-in; else insert.
  const { data: existing } = await admin
    .from("customer")
    .select("id, auth_user_id")
    .eq("phone", phone)
    .maybeSingle();

  let customer: CustomerAuthRow | null = existing;
  if (!customer) {
    const { data: theFarm } = await admin
      .from("farm")
      .select("id")
      .limit(1)
      .maybeSingle();
    if (!theFarm) {
      return { ok: false, error: "حصلت مشكلة في التسجيل، حاول تاني." };
    }
    const { data: created, error } = await admin
      .from("customer")
      .insert({ farm_id: theFarm.id, name, phone })
      .select("id, auth_user_id")
      .single();
    if (error || !created) {
      return { ok: false, error: "حصلت مشكلة في التسجيل، حاول تاني." };
    }
    customer = created;
  }

  try {
    await signInCustomer(phone, customer);
  } catch {
    return { ok: false, error: "حصلت مشكلة في التسجيل، حاول تاني." };
  }
  return { ok: true };
}

export type VerifyPinResult = { ok: false; error: string } | { ok: true };

/**
 * Admin login step two: the owner typed their 6-digit PIN (A-04→A-06). The PIN
 * is checked against the bcrypt hash inside the database (verify_admin_pin, a
 * service-role-only function) — never compared in app code. On success the admin
 * is signed in and lands on the dashboard.
 */
export async function verifyPin(
  rawPhone: string,
  rawPin: string,
): Promise<VerifyPinResult> {
  const phone = rawPhone.replace(/\D/g, "");
  const pin = rawPin.replace(/\D/g, "");

  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "الرقم مش مظبوط، ارجع وسجّل الدخول." };
  }
  if (pin.length !== 6) {
    return { ok: false, error: "اكتب الرقم السري كامل (٦ أرقام)." };
  }

  const admin = createAdminClient();

  const { data: farm } = await admin
    .from("farm")
    .select("id, owner_id")
    .eq("owner_phone", phone)
    .maybeSingle();
  if (!farm) {
    return { ok: false, error: "الرقم ده مش بتاع صاحب المزرعة." };
  }

  const { data: valid, error } = await admin.rpc("verify_admin_pin", {
    _farm_id: farm.id,
    _pin: pin,
  });
  if (error) return { ok: false, error: "حصلت مشكلة، حاول تاني." };
  if (!valid) return { ok: false, error: "تم إدخال رقم سري غير صحيح" };

  try {
    await signInAdmin(phone, farm);
  } catch {
    return { ok: false, error: "حصلت مشكلة في الدخول، حاول تاني." };
  }
  return { ok: true };
}

/**
 * Sign the current user out and send them back to the login screen. Called from
 * the customer sidebar as a form action (works without client JS).
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
