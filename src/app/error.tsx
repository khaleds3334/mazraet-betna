"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { EmptyState } from "@/components/ui";
import {
  actionBase,
  actionOutline,
  actionPrimary,
} from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * The face of a read that failed — anywhere in either app (T-72).
 *
 * **Why it exists at all.** Several reads throw on purpose rather than return
 * zeros: `getFarmSettings` is the one that taught us to (T-58 — a failed read
 * came back as «٠ جنيه» for the kilo and the admin saved over his own prices
 * trying to fix it). Throwing is right. But with no `error.tsx` anywhere in the
 * project, what a throw actually produced was **Next's own error page, in
 * English** — to an admin who reads none and a customer who reads less. Rule 4,
 * broken by the one screen nobody had drawn.
 *
 * **One file for both apps.** It sits at the root of `app/`, so it catches
 * everything below it and renders inside the root layout — which means without
 * the bottom bar. That is deliberate: the shell's nav is four links to screens
 * that may be failing for the same reason this one is, and a way out that leads
 * back into the fault is not a way out. So the page carries its own two.
 *
 * **«حاول تاني» first.** Most of these are a lost connection on a phone in a
 * village, and the second attempt works. `reset()` re-renders the segment that
 * threw without reloading the app, so nothing typed elsewhere is lost.
 *
 * The way home is a plain `<a>`, not a `<Link>`: the router has just failed on
 * this route, and a client-side navigation would ask the same broken machinery
 * to carry him out. A full page load starts everything again from nothing.
 *
 * It does not say what went wrong. Neither user can act on «PGRST301», and a
 * code on the screen reads as blame. The detail goes to the console, where it is
 * of use to whoever comes looking.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  // The admin's half of the site lives under /admin; everyone else owns the
  // root. A customer who somehow lands on the wrong one is bounced by the proxy
  // anyway, so this only has to be right about where he *was*.
  const home = pathname.startsWith("/admin") ? "/admin" : "/";

  useEffect(() => {
    console.error("Screen failed", error);
  }, [error]);

  return (
    <main className="mx-auto flex h-svh w-full max-w-[430px] flex-col justify-center gap-9 bg-background px-screen">
      <EmptyState
        icon="warning"
        title="في حاجة مش مظبوطة، مقدرناش نجيب البيانات"
      />

      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={reset}
          className={cn(actionBase, actionPrimary)}
        >
          <span className="optical-center">حاول تاني</span>
        </button>

        <a href={home} className={cn(actionBase, actionOutline)}>
          <span className="optical-center">الرجوع للرئيسية</span>
        </a>
      </div>
    </main>
  );
}
