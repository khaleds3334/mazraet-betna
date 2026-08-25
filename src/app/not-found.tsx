import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { actionBase, actionOutline } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * The face of an address that leads nowhere (T-72) — a mistyped URL, and the one
 * case the app raises itself: `notFound()` on an order id that is not this
 * customer's, from `/tracking/[orderId]`. A notification link kept after the
 * order was removed lands here, which is the realistic way a customer sees it.
 *
 * Without this file Next answered both with **its own 404 page, in English**, to
 * users who read none — the same hole `error.tsx` fills for a read that fails.
 *
 * **One way out, and it goes to `/`.** The page has no idea who is reading, and
 * it does not need to: the proxy already sends an admin who asks for the
 * customer's root to `/admin`. So the plain link is right for both, and there is
 * nothing here to keep in sync when a role is added.
 *
 * A server component — nothing on it reacts, and there is nothing to retry. An
 * address that does not exist will not exist on the second attempt, which is why
 * this one has «الرجوع للرئيسية» and no «حاول تاني».
 *
 * A real `<Link>`, unlike the one on `error.tsx`: nothing has broken here. The
 * router is fine, it was only asked for something that is not there — so the way
 * out is a normal navigation, and prefetched in full like every other link the
 * app expects to be pressed (T-67). Over there the router itself had just
 * failed, and asking it to carry him out would have been asking the broken thing
 * for the favour.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex h-svh w-full max-w-[430px] flex-col justify-center gap-9 bg-background px-screen">
      <EmptyState icon="search" title="مش لاقيين الصفحة دي" />

      <Link href="/" prefetch className={cn(actionBase, actionOutline)}>
        <span className="optical-center">الرجوع للرئيسية</span>
      </Link>
    </main>
  );
}
