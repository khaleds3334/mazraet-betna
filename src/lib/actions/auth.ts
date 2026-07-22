"use server";

import { createHmac } from "node:crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Auth actions. Login is phone-only for customers, phone + PIN for the admin
 * (D-01). There is no OTP: identity for a customer isn't sensitive, so instead
 * of a verification code we derive a stable server-only password from the phone
 * and sign the user in from the server. See decision D-14.
 */

const PHONE_RE = /^\d{11}$/;

type CustomerRow = { id: string; auth_user_id: string | null };

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

/**
 * Deterministic, server-only credentials for a customer's auth account.
 * The password is an HMAC of the phone keyed by the Supabase secret — it never
 * leaves the server, and is reproducible so the same phone always signs in.
 */
function customerCredentials(phone: string) {
  const email = `${phone}@customer.mazraetbetna.local`;
  const password = createHmac("sha256", process.env.SUPABASE_SECRET_KEY!)
    .update(phone)
    .digest("hex");
  return { email, password };
}

/** Ensure the customer has a linked auth user, then create a session cookie. */
async function signInCustomer(phone: string, customer: CustomerRow) {
  const admin = createAdminClient();
  const { email, password } = customerCredentials(phone);

  // First login of an admin-added walk-in: create the auth user and link it.
  if (!customer.auth_user_id) {
    const { data: created } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "customer", phone },
    });
    if (created?.user) {
      await admin
        .from("customer")
        .update({ auth_user_id: created.user.id })
        .eq("id", customer.id);
    }
  }

  // Sign in through the cookie-bound server client so the session persists.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
