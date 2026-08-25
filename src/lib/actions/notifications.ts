"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCustomer } from "@/lib/queries/customers";

/**
 * Mark everything the customer has just been shown as read (C-15).
 *
 * The one write in this app a customer makes to a notification, and the policy
 * already allows exactly it: `notification_update` lets him touch his own rows,
 * where `notification_insert` lets nobody but the admin create one.
 *
 * **Called after the screen has rendered, never before.** Read first and the
 * whole list would arrive already read, every notice would file under «القديمة»,
 * and the screen would be telling him that something he is reading for the first
 * time is old news. Rendered first and marked after, he sees them as new today
 * and old tomorrow — which is what the two headings are for.
 *
 * It returns nothing and is not awaited by anything on screen. The bell's badge
 * is what it is really for, and that is on the *next* screen: `revalidatePath`
 * on the layout is what clears it.
 */
export async function markNotificationsRead(): Promise<void> {
  const customer = await getCurrentCustomer();
  if (!customer) return;

  const supabase = await createClient();
  await supabase
    .from("notification")
    .update({ is_read: true })
    .eq("customer_id", customer.id)
    .eq("audience", "customer")
    .eq("is_read", false);

  // The badge lives in the customer layout's header, so the layout is what has
  // to be re-read — not this page, which has already drawn itself.
  revalidatePath("/", "layout");
}
