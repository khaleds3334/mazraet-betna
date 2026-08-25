import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { NotificationFeed } from "@/components/customer/notifications/NotificationFeed";
import { getCurrentCustomer } from "@/lib/queries/customers";
import { listNotifications } from "@/lib/queries/notifications";

/**
 * C-15 — «الرسائل و الاشعارات».
 *
 * **Nothing on this screen was written by the app.** Every notice comes from a
 * database trigger on the event itself (migration 029): an account created, an
 * order placed, weighed, ready or cancelled, a sale opened. The insert policy is
 * admin-only, so the customer's own session could not have announced his own
 * order — and a rule that must hold whoever is acting belongs where the thing
 * happens, which is the same conclusion migration 026 reached about the sale.
 *
 * The split into «الجديدة» and «القديمة», and the mark-as-read that follows it,
 * are `NotificationFeed`'s — they have to survive a re-render, which is a thing
 * only a client component can do.
 *
 * A screen walked into, not tabbed to: back button, no bottom bar.
 */
export default async function NotificationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const notifications = await listNotifications(customer.id);

  return (
    <div className="flex flex-1 flex-col">
      <PageHeader
        title="الرسائل و الاشعارات"
        backHref="/"
        className="px-screen pt-4"
      />

      {notifications.length === 0 ? (
        // No crate and no call to action: an empty inbox is not a problem to
        // solve, it is the normal state of a farm with nothing to say today.
        <p className="my-auto px-screen text-center text-base text-muted">
          مفيش اشعارات لسه
        </p>
      ) : (
        <NotificationFeed notifications={notifications} />
      )}
    </div>
  );
}
