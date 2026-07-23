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
}

/**
 * The farm behind the current admin session, or null if there isn't one (e.g. a
 * customer, or a signed-out visitor). Wrapped in React `cache` so the layout and
 * the page in the same request share a single round-trip.
 */
export const getCurrentFarm = cache(async (): Promise<CurrentFarm | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("farm")
    .select("id, name, owner_name")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!data) return null;

  return { farmId: data.id, farmName: data.name, ownerName: data.owner_name };
});
