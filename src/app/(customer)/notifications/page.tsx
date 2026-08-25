import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { NotificationRow } from "@/components/customer/notifications/NotificationRow";
import { MarkNotificationsRead } from "@/components/customer/notifications/MarkNotificationsRead";
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
 * **New above old, and the order of operations is the point.** The list is read,
 * split on `is_read`, and rendered — and only then are the unread ones marked
 * (`MarkNotificationsRead`). Marking first would file everything under «القديمة»
 * while he is reading it for the first time.
 *
 * A screen walked into, not tabbed to: back button, no bottom bar.
 */
export default async function NotificationsPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/logout");

  const notifications = await listNotifications(customer.id);
  const fresh = notifications.filter((n) => !n.isRead);
  const old = notifications.filter((n) => n.isRead);

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
        <div className="flex flex-col gap-6 px-screen pt-6 pb-6">
          <Group title="الجديدة" notifications={fresh} />
          <Group title="القديمة" notifications={old} />
        </div>
      )}

      <MarkNotificationsRead unread={fresh.length} />
    </div>
  );
}

/**
 * One heading and its notices. Absent entirely when it has none — a «الجديدة»
 * with nothing under it says there is something to catch up on when there is
 * not.
 */
function Group({
  title,
  notifications,
}: {
  title: string;
  notifications: Awaited<ReturnType<typeof listNotifications>>;
}) {
  if (notifications.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <h2 className="pb-1 text-right text-base font-bold text-heading">
        {title}
      </h2>
      {notifications.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} />
      ))}
    </section>
  );
}
