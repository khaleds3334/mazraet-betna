/**
 * Notification reads for the customer app.
 */
import { createClient } from "@/lib/supabase/server";

/**
 * Count of the customer's unread notifications — drives the dot on the bell in
 * the home header (C-11). RLS already limits rows to this customer.
 */
export async function countUnreadNotifications(
  customerId: string,
): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notification")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("audience", "customer")
    .eq("is_read", false);
  return count ?? 0;
}
