/**
 * Reads for the signed-in customer. Uses the RLS-bound server client, so a
 * customer only ever sees their own row (policy customer_select).
 */
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentCustomer {
  id: string;
  name: string;
  farmId: string;
}

/**
 * The customer behind the current session, or null if there isn't one (e.g. the
 * admin, or a signed-out visitor). Wrapped in React `cache` so the layout and the
 * page in the same request share a single database round-trip.
 */
export const getCurrentCustomer = cache(
  async (): Promise<CurrentCustomer | null> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("customer")
      .select("id, name, farm_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!data) return null;

    return { id: data.id, name: data.name, farmId: data.farm_id };
  },
);
