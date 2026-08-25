import Image from "next/image";
import Link from "next/link";
import { actionBase, actionOutline } from "@/components/ui/buttonStyles";
import { cn } from "@/lib/utils";

/**
 * The "you have no orders" block — the crate, a two-line heading, a line of
 * explanation and one way out. Shared by tracking (C-30) and history (C-50),
 * which draw the same block and differ only in the second line of the heading.
 *
 * Two readings, chosen by whether the sale is open. The design draws only the
 * open one; «اطلب فراخ طازجة دلوقتي» is a dead end when there is nothing to
 * order, so the closed reading changes the sentence and points at home, where
 * the countdown to the next sale lives (Khaled, 2026-08-24).
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

export function EmptyOrders({
  /**
   * The heading, already split into its lines. The design breaks it in a fixed
   * place, and passing the lines is what keeps that break out of the JSX: a tag
   * inside a run of Arabic is the one thing an RTL editor reorders on save — it
   * turned a `<br />` into two attributes once already.
   */
  titleLines,
  saleOpen,
}: {
  titleLines: readonly string[];
  saleOpen: boolean;
}) {
  const { body, cta, href } = READING[saleOpen ? "open" : "closed"];

  return (
    <div className="flex flex-col items-center gap-10 px-screen">
      <div className="flex w-full flex-col items-center gap-6">
        <Image
          src="/images/wooden-crate.png"
          alt="صندوق فاضي"
          width={220}
          height={152}
          priority
        />

        {/* The design insets the words 10px more than the button, which is what
            decides where the heading wraps onto its second line. */}
        <div className="flex w-full flex-col gap-2.5 px-2.5 text-center">
          <h1 className="text-h4 font-bold text-foreground">
            {titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="text-base text-muted">{body}</p>
        </div>
      </div>

      {/* The one thing on an empty screen worth tapping, so it is ready. */}
      <Link
        href={href}
        prefetch
        replace
        className={cn(actionBase, actionOutline)}
      >
        {cta}
      </Link>
    </div>
  );
}
