import { createHmac } from "node:crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * The session mechanism behind phone-only login (D-14). There is no OTP: each
 * account has a deterministic, server-only password derived from the phone, so
 * the server can always sign the user in and get a real auth.uid() session for
 * RLS. Secrets never leave the server. The auth *actions* live in
 * /lib/actions/auth.ts; this module is just the shared sign-in plumbing.
 *
 * The role lives in `app_metadata` (only the service role can set it), never in
 * `user_metadata` (which the user can edit) — so it's safe to gate access on it.
 */

export type CustomerAuthRow = { id: string; auth_user_id: string | null };
export type FarmAuthRow = { id: string; owner_id: string | null };

/** HMAC(phone) keyed by the Supabase secret — reproducible, never exposed. */
function derivePassword(scope: "customer" | "admin", phone: string) {
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY!)
    .update(`${scope}:${phone}`)
    .digest("hex");
}

function customerCredentials(phone: string) {
  return {
    email: `${phone}@customer.mazraetbetna.local`,
    password: derivePassword("customer", phone),
  };
}

/**
 * Exported because changing the admin's login number has to move the auth
 * account to the credentials the *next* login will derive — and the only way to
 * be sure it matches is to derive it from here, rather than rebuilding the same
 * two strings somewhere else and hoping they stay in step.
 */
export function adminCredentials(phone: string) {
  return {
    email: `${phone}@admin.mazraetbetna.local`,
    password: derivePassword("admin", phone),
  };
}

/** Ensure the customer has a linked auth user, then create a session cookie. */
export async function signInCustomer(phone: string, customer: CustomerAuthRow) {
  const admin = createAdminClient();
  const { email, password } = customerCredentials(phone);

  // First login of an admin-added walk-in: create the auth user. If it already
  // exists (a half-finished earlier attempt), createUser just errors — harmless,
  // since we link from the actual signed-in id below either way.
  if (!customer.auth_user_id) {
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "customer" },
      user_metadata: { phone },
    });
  }

  const userId = await signIn(email, password, "customer");

  // Link the row to the real session id (fixes the case where the auth user
  // existed but was never linked — otherwise RLS can't match the customer).
  if (customer.auth_user_id !== userId) {
    await admin
      .from("customer")
      .update({ auth_user_id: userId })
      .eq("id", customer.id);
  }
}

/** Ensure the owner has a linked auth user, then create an admin session cookie. */
export async function signInAdmin(phone: string, farm: FarmAuthRow) {
  const admin = createAdminClient();
  const { email, password } = adminCredentials(phone);

  if (!farm.owner_id) {
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "admin" },
      user_metadata: { phone },
    });
  }

  const userId = await signIn(email, password, "admin");

  if (farm.owner_id !== userId) {
    await admin.from("farm").update({ owner_id: userId }).eq("id", farm.id);
  }
}

/**
 * Sign in through the cookie-bound server client so the session persists, and
 * return the authenticated user id for linking.
 *
 * Also repairs the account's role. An early build wrote the role into
 * `user_metadata`, which the middleware can't trust and therefore ignores — so
 * such an account signs in successfully and then belongs to neither app. The
 * repair has to happen here rather than at creation, because the account is only
 * created once and these accounts already exist. Signing in a second time is
 * what makes it stick: the session token is stamped with `app_metadata` at the
 * moment it is minted, so a token minted before the fix still lacks the role.
 * Costs nothing on a healthy account — the branch is skipped entirely.
 */
async function signIn(
  email: string,
  password: string,
  role: "customer" | "admin",
): Promise<string> {
  const supabase = await createClient();
  const credentials = { email, password };

  const first = await supabase.auth.signInWithPassword(credentials);
  if (first.error || !first.data.user) {
    throw first.error ?? new Error("sign-in failed");
  }
  if (first.data.user.app_metadata?.role === role) return first.data.user.id;

  await createAdminClient().auth.admin.updateUserById(first.data.user.id, {
    app_metadata: { role },
  });

  const second = await supabase.auth.signInWithPassword(credentials);
  if (second.error || !second.data.user) {
    throw second.error ?? new Error("sign-in failed");
  }
  return second.data.user.id;
}
