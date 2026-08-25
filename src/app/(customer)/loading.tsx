import Image from "next/image";
import { Icon, Skeleton, SkeletonScreen } from "@/components/ui";
import {
  actionBase,
  actionOutline,
  actionPrimary,
} from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * Loading face of the customer home (C-10→C-12).
 *
 * It sits at the top of the `(customer)` group, so on paper it covers every
 * customer route — in practice each of them has its own file beside its page
 * (T-37), and this one only ever stands in for the home.
 *
 * **Grey stands only for what the database has not answered yet** (T-69). The
 * logo, the two controls, the welcome and both buttons are the same on every
 * visit — they are drawn for real, and they do not move when the rest lands.
 * What is genuinely unknown is the state of the sale: whether it is open, what
 * the countdown is counting to, and the numbers in it.
 */
export default function CustomerHomeLoading() {
  return (
    <SkeletonScreen className="gap-4 pb-pill">
      {/* The real header, minus the unread disc on the bell — which is a count,
          and arrives with everything else. Nothing here is a link yet: it is on
          screen for a moment and the page behind it is already on its way. */}
      <header className="flex h-[86px] items-center justify-between px-screen">
        <span className="flex size-11 items-center justify-center text-foreground">
          <Icon name="menu" size={32} strokeWidth={2.5} absoluteStrokeWidth />
        </span>

        <Image
          src="/images/logo-primary.png"
          alt="مزرعة بيتنا"
          width={76}
          height={80}
          priority
        />

        <span className="flex size-11 items-center justify-center text-foreground">
          <Icon
            name="notification"
            size={32}
            strokeWidth={2.5}
            absoluteStrokeWidth
          />
        </span>
      </header>

      {/* Same `flex-1` + `justify-evenly` as the page, so the blocks land where
          the real ones will and nothing jumps when they arrive. */}
      <div className="flex flex-1 flex-col justify-evenly gap-section px-screen">
        <div className="flex flex-col items-center gap-2 text-center text-h3 font-extrabold text-primary-foreground">
          <h1>مرحبا بيك في مزرعة بيتنا</h1>
          <p>لبيع الفراخ البيضاء الطازجة</p>
        </div>

        {/* The one block that is all answer and no wording: the state pill, the
            heading that changes with it, the date, and the four boxes — whose
            colour is the state as much as the numbers are. */}
        <section className="flex w-full flex-col items-center gap-4">
          <Skeleton className="h-9 w-32 rounded-full" />

          <div className="flex w-full flex-col items-center gap-2">
            <Skeleton className="h-6 w-56" />
            <div className="flex w-full items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex w-full items-center justify-between gap-2">
              {[0, 1, 2, 3].map((box) => (
                <Skeleton key={box} className="h-[86px] flex-1 basis-0" />
              ))}
            </div>
          </div>
        </section>

        {/* Both real. «اطلب فراخ طازجة دلوقتي» blurs itself when the sale turns
            out to be shut, which is a state arriving — not a button arriving. */}
        <div className="flex flex-col gap-5">
          <div className={cn(actionBase, actionPrimary)}>
            اطلب فراخ طازجة دلوقتي
          </div>
          <div className={cn(actionBase, actionOutline)}>الطلبات السابقة</div>
        </div>
      </div>
    </SkeletonScreen>
  );
}
