"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setBackTarget } from "@/lib/backTarget";
import { askBeforeLeaving } from "@/lib/leaveGuard";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

/**
 * Back navigation button — the rounded lime-tinted square from the design.
 * In RTL "back" points to the right. 48×48 so it clears the 44px touch target.
 * Renders a link; pass the destination as `href`.
 *
 * Prefetched in full: the way back is the one destination you can be sure will be
 * asked for, so the server may as well have it ready while the screen is being
 * read. (Production only — Next never prefetches from a dev server.)
 *
 * While it is on screen it also tells the phone's back gesture where "back"
 * goes, so the swipe and the button agree (`backTarget`). Without that the
 * gesture means "home" from everywhere, which is right for a tab and wrong for
 * a screen you walked into.
 *
 * It asks the screen first. A screen with unsaved work registers a `leaveGuard`,
 * and if one answers, the tap is cancelled and that screen takes over — it will
 * navigate here itself once the user has said what to do about the work. Nothing
 * is registered on most screens, so most taps go straight through.
 */
export function BackButton({
  href,
  className,
}: {
  href: string;
  className?: string;
}) {
  const router = useRouter();

  useEffect(() => setBackTarget(href), [href]);

  return (
    <Link
      href={href}
      prefetch
      // Replaces rather than pushes, like every link in the app: the history
      // stack is kept one entry deep so the back gesture can close it
      // (`BackGuard`). This button is the way back — the stack is not.
      replace
      onClick={(event) => {
        if (askBeforeLeaving(() => router.replace(href)))
          event.preventDefault();
      }}
      aria-label="رجوع"
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-surface p-2",
        "shadow-[0px_4px_2px_0px_rgba(217,249,157,0.15)]",
        className,
      )}
    >
      <Icon
        name="arrowRight"
        size={32}
        strokeWidth={2}
        className="text-foreground"
        aria-hidden
      />
    </Link>
  );
}
