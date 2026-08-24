import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { actionBase, actionPrimary } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * «تم استلام الطلب بنجاح» (C-25, node 3155:4735) — shown in place of the form
 * once the order is booked, not on a route of its own.
 *
 * Keeping it on `/order` is what makes the browser's back button safe: there is
 * no form behind this screen to return to and re-send.
 *
 * **It takes the whole screen.** The design has no tab bar and no «من مزرعتنا
 * لبيتك بكل حب» over it (Khaled, 2026-08-24) — this is an answer, not another
 * page of the shop. Rather than teach the layout about a state that is not a
 * route, it covers the shell: fixed to the viewport, in the shell's own column
 * width, above the nav in the layer ladder. The two ways out are the ones the
 * design draws — the button to the order's own tracking, and the header's arrow
 * home.
 *
 * The header is the shared `PageHeader` — the same centred title and lime back
 * square the admin's settings screen wears (A-70). It was drawn by hand here
 * once, which is exactly the duplication that component exists to stop.
 *
 * It says what happens next in the customer's own terms — the birds get weighed,
 * then an invoice comes — because the one thing this screen cannot do is show a
 * total. There isn't one yet, and there won't be until the birds are on the
 * scale (D-05).
 */
export function OrderSuccess({ orderId }: { orderId: string }) {
  return (
    <div
      className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col bg-background"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <PageHeader
        title="تم استلام الطلب بنجاح"
        backHref="/"
        className="px-screen pt-4"
      />

      {/* Centred in whatever is left between the header and the button, which is
          how the design places it — not at a fixed distance from either. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[26px] px-screen text-center">
        <Image
          src="/images/order-success.webp"
          alt="الفلاح بيجهز الفراخ"
          width={506}
          height={476}
          priority
          className="h-auto w-[73%] max-w-[253px]"
        />

        <h2 className="text-h4 font-bold text-primary-foreground">
          بنجهزلك احسن فرخة
        </h2>

        <p className="text-base text-muted">
          استلمنا طلبك و ها يتم وزن الفراخ المطلوبة و ارسال الفاتورة للاطلاع علي
          السعر و تأكيد عملية الذبح في المعاد المحدد
        </p>
      </div>

      <div className="px-screen pb-20">
        <Link
          href={`/tracking/${orderId}`}
          replace
          className={cn(actionBase, actionPrimary)}
        >
          تتبع حالة الطلب
        </Link>
      </div>
    </div>
  );
}
