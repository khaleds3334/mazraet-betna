"use client";

import { useEffect, useRef } from "react";
import { markNotificationsRead } from "@/lib/actions/notifications";

/**
 * Clears the bell, once, after the screen has been drawn (C-15).
 *
 * A component and not a call in the page, because the page is a Server
 * Component: doing the write there would run it *before* the list is rendered,
 * and the customer would open «الرسائل و الاشعارات» to find everything already
 * filed under «القديمة» — the screen telling him that what he is reading for the
 * first time is old news. Mounted at the foot of the page, this runs after the
 * markup it is correcting has already been sent.
 *
 * **Nothing on screen depends on it.** The two headings are drawn from the list
 * as it was read; this is only for the badge on the bell, which is on the screen
 * he goes back to. The action revalidates the layout and that badge redraws
 * itself — no state here, nothing to wait for, no spinner.
 *
 * The ref guards against React's development double-mount and against a
 * re-render firing a second write. The write is idempotent (`is_read = true`
 * where `is_read = false` matches nothing the second time), so the guard is
 * about not making the round trip, not about correctness.
 */
export function MarkNotificationsRead({ unread }: { unread: number }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || unread === 0) return;
    done.current = true;
    void markNotificationsRead();
  }, [unread]);

  return null;
}
