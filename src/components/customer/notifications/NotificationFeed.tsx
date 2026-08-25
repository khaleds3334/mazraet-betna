"use client";

import { useEffect, useRef, useState } from "react";
import { markNotificationsRead } from "@/lib/actions/notifications";
import type { CustomerNotification } from "@/lib/queries/notifications";
import { NotificationRow } from "./NotificationRow";

/**
 * The list, split into «الجديدة» and «القديمة», and the one write this screen
 * makes (C-15).
 *
 * ## Why the split is frozen at mount
 *
 * What is new has to stay new until the customer leaves. Two earlier attempts at
 * that failed, and the second one is worth writing down:
 *
 * 1. Marking read in the page body ran *before* the markup was produced, so
 *    everything arrived already old.
 * 2. Marking read from an effect, after the render, was still undone — **a
 *    Server Action refreshes the route it was called from**, always, whatever
 *    `revalidatePath` is given. The page re-rendered from the rows the action had
 *    just written and every notice slid into «القديمة» while he was reading it
 *    (Khaled, 2026-08-25).
 *
 * So the screen stops depending on the server's answer staying still. `useState`
 * with an initialiser runs once for the life of the component: this holds the
 * list as it arrived, and re-renders — from the action, from `RefreshOnReturn`,
 * from anything — flow past it. Leaving the screen unmounts this; coming back
 * mounts it fresh against a server where they are now read, and they are old.
 *
 * That is also the honest description of the screen: it shows the notifications
 * as they were when you opened it.
 */
export function NotificationFeed({
  notifications,
}: {
  notifications: CustomerNotification[];
}) {
  // Read once. See above — this is the whole mechanism.
  const [shown] = useState(notifications);
  const marked = useRef(false);

  const fresh = shown.filter((n) => !n.isRead);
  const old = shown.filter((n) => n.isRead);

  useEffect(() => {
    if (marked.current || fresh.length === 0) return;
    marked.current = true;
    // Nothing on screen waits for it: it is for the bell's badge, on the screen
    // he goes back to. The write is idempotent, and the ref keeps development's
    // double-mount from making the round trip twice.
    void markNotificationsRead();
  }, [fresh.length]);

  return (
    <div className="flex flex-col gap-6 px-screen pt-6 pb-6">
      <Group title="الجديدة" notifications={fresh} />
      <Group title="القديمة" notifications={old} />
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
  notifications: CustomerNotification[];
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
