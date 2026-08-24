import Image from "next/image";
import Link from "next/link";
import { actionBase, actionOutline } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * C-30 — what the tracking screen shows when the customer has no order running.
 *
 * Two readings of the same block, picked by whether the sale is open. The design
 * only draws the open one; the closed one keeps the picture and the heading and
 * changes what it offers, because "order fresh chickens now" is a dead end when
 * there is nothing to order (Khaled, 2026-08-24).
 */
const READING = {
  open: {
    body: "الفراخ الطازجة متوفرة الان يمكنك الطلب قبل انتهاء فترة البيع",
    cta: "اطلب فراخ طازجة دلوقتي",
    href: "/order",
  },
  closed: {
    body: "الفراخ الطازجة غير متوفرة الان يمكنك الطلب عند بدء مرحلة البيع",
    cta: "شوف حالة البيع",
    href: "/",
  },
} as const;

export function TrackingEmpty({ saleOpen }: { saleOpen: boolean }) {
  const { body, cta, href } = READING[saleOpen ? "open" : "closed"];

  return (
    <div className="flex flex-col items-center gap-10 px-screen">
      <div className="flex w-full flex-col items-center gap-6">
        <Image
          src="/images/empty-tracking-crate.png"
          alt="صندوق فاضي"
          width={220}
          height={152}
          priority
        />

        {/* The design insets the words 10px more than the button, which is what
            decides where the heading wraps onto its second line. */}
        <div className="flex w-full flex-col gap-2.5 px-2.5 text-center">
          {/* Two blocks rather than a `<br />`: the design breaks the heading
              here on purpose, and a tag sitting inside a run of Arabic is the
              one thing an RTL editor reorders on save — it already turned the
              two words into attributes of the `<br>` once. */}
          <h1 className="text-h4 font-bold text-foreground">
            <span className="block">ليس لديك اي طلبات</span>
            <span className="block">نشطة حاليا</span>
          </h1>
          <p className="text-base text-muted">{body}</p>
        </div>
      </div>

      <Link href={href} replace className={cn(actionBase, actionOutline)}>
        {cta}
      </Link>
    </div>
  );
}
