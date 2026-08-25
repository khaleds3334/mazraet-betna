import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of «اطلب الان» (C-20→C-24).
 *
 * The form is four white bands on the page's own background, and that striping
 * is the whole shape of the screen — so the bands are drawn, with the grey
 * inside them.
 *
 * **Every question is already written** (T-69): the farm asks the same four
 * things of every customer on every visit, so «محتاج كام فرخة؟» and «عاوز
 * الفراخ امتي؟» are here in full. What the farm has to answer is what it is
 * charging, how many birds are left, which weights it has today and which pickup
 * slots are still open — and that is what the grey stands for.
 *
 * No confirm bar: it belongs to the nav (`NAV_SLOT_ID`), it only unfolds once
 * something has been chosen, and it is not part of what the page is waiting for.
 */
export default function OrderLoading() {
  return (
    <SkeletonScreen className="gap-1">
      <h1 className="px-screen pt-4 pb-2 text-center text-h3 font-bold text-primary-foreground">
        من مزرعتنا لبيتك بكل حب
      </h1>

      <div className="flex items-center justify-between gap-3 px-screen py-2">
        <h2 className="text-h6 font-bold text-primary-foreground">
          سعر كيلو الفراخ
        </h2>
        {/* The one thing in this row the farm decides. */}
        <Skeleton className="h-11 w-28 rounded-full" />
      </div>

      {/* The prompt and its counter on the right, the tray on the left. The
          counter is grey because its ceiling is the flock: an «+» drawn before
          `available` is known is a button that may be dead on arrival. */}
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white px-screen py-4">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pb-7">
          <p className="whitespace-nowrap text-base text-heading">
            محتاج كام فرخة؟
          </p>
          <div className="w-full px-1 py-2.5">
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
        <Skeleton className="aspect-[136/108] w-[136px] shrink-0" />
      </div>

      {/* The weights the farm has today, then «الذبح و التنظيف؟» — whose price
          is per bird and comes from settings, so the card waits as a whole. */}
      <div className="flex flex-col gap-3 bg-white px-screen py-4">
        <div className="flex flex-col gap-3.5">
          <p className="text-right text-base text-heading">
            اختار الوزن المطلوب في حدود كام بالكجم؟
          </p>
          <div className="flex items-center gap-2.5">
            {[0, 1, 2].map((choice) => (
              <Skeleton key={choice} className="h-11 w-20 rounded-full" />
            ))}
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>

      {/* The question and both field labels are fixed; the day and the slot
          behind them are not. */}
      <div className="flex flex-col gap-3 bg-white px-screen py-4">
        <p className="text-right text-h5 text-primary-foreground">
          عاوز الفراخ امتي؟
        </p>
        <div className="flex items-start gap-5">
          {["اختار اليوم", "اختار الوقت"].map((label) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-right text-base text-foreground">
                {label}
              </span>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>

      {/* Nothing below here is ever different, so nothing below here is grey. */}
      <div className="mx-4 px-screen py-4">
        <p className="text-base text-foreground">اضافة ملاحظة علي الطلب</p>
      </div>

      <p className="px-screen pb-2 text-center text-h6 font-bold text-accent-brown">
        <span className="text-h3 text-error-soft">*</span>
        سيتم حساب السعر النهائي و اصدار الفاتورة النهائية بعد وزن الفراخ
      </p>
    </SkeletonScreen>
  );
}
