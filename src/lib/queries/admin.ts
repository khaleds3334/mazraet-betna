/**
 * Reads for the signed-in admin (the farm owner). Uses the RLS-bound server
 * client — the farm_select policy exposes the owner's own farm (owner_id =
 * auth.uid()), so this only ever returns the admin's farm.
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentFarm {
  farmId: string;
  farmName: string;
  /** The owner's personal name for the greeting, or null if not set yet. */
  ownerName: string | null;
  /**
   * The number customers ring — `contact_phone` when the admin has set one,
   * otherwise the number he signs in with. Resolved here so no screen has to
   * remember the fallback.
   */
  contactPhone: string;
  /** True while the two are the same number — the settings field shows it empty. */
  usesOwnerPhone: boolean;
  /** The number the admin signs in with — also half of his auth credential. */
  loginPhone: string;
}

/**
 * The farm behind the current admin session, or null if there isn't one (e.g. a
 * customer, or a signed-out visitor). Wrapped in React `cache` so the layout and
 * the page in the same request share a single round-trip.
 */
export const getCurrentFarm = cache(async (): Promise<CurrentFarm | null> => {
  const supabase = await createClient();
  // Verified locally against the project's public key, not fetched from the
  // auth server — one network round trip off every screen (D-32).
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data } = await supabase
    .from("farm")
    .select("id, name, owner_name, owner_phone, contact_phone")
    .eq("owner_id", userId)
    .maybeSingle();
  if (!data) return null;

  return {
    farmId: data.id,
    farmName: data.name,
    ownerName: data.owner_name,
    contactPhone: data.contact_phone ?? data.owner_phone,
    usesOwnerPhone: !data.contact_phone,
    loginPhone: data.owner_phone,
  };
});

/**
 * The number the farm answers on, read by a **customer** (FR-30, the contact
 * popup). Same fallback the admin's own screen resolves — `contact_phone` when
 * one is set, the owner's sign-in number when it is not — so the two halves of
 * the app can never quote different numbers for the same farm.
 *
 * Its own function rather than a field on `getCurrentCustomer`: the customer
 * screens that do not open the popup should not pay for a farm read, and the
 * ones that do ask for exactly this and nothing else. `cache` because the home
 * asks twice — once for the pill, once for the sidebar's «تواصل معنا».
 *
 * Reads through the customer's own session. The `farm_select` policy lets him
 * see the farm he belongs to (`my_customer_farms`), so no service-role client is
 * involved and a customer can only ever get his own farm's number.
 *
 * Returns null when the read fails or the row is gone. **Not a throw** (cf.
 * T-58): a missing price is a wrong number on a bill, but a missing contact
 * number is one button that has nothing behind it — and taking the whole screen
 * down over it would be the larger fault. The popup shows what it has.
 */
export const getFarmContactPhone = cache(
  async (farmId: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("farm")
      .select("owner_phone, contact_phone")
      .eq("id", farmId)
      .maybeSingle();

    return data ? (data.contact_phone ?? data.owner_phone) : null;
  },
);
