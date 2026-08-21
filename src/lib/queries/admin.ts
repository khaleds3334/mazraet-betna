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
