import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of «اطلب الان» (C-20→C-24).
 *
 * The form is four white bands on the page's own background, and that striping
 * is the whole shape of the screen — so the skeleton draws the bands themselves
 * and puts the grey blocks inside them, rather than scattering blocks down a
 * blank page. What lands is the same four bands with content in them.
 *
 * No confirm bar here: it belongs to the nav (`NAV_SLOT_ID`), it only unfolds
 * once something has been chosen, and it is not part of what the page is
 * waiting for.
 */
export default function OrderLoading() {
  return (
    <SkeletonScreen className="gap-1">
      {/* «من مزرعتنا لبيتك بكل حب», then سعر كيلو الفراخ with its price badge. */}
      <div className="flex flex-col items-center px-screen pt-4 pb-2">
        <Skeleton className="h-8 w-60" />
      </div>
      <div className="flex items-center justify-between gap-3 px-screen py-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* محتاج كام فرخة؟ — the prompt and counter on the right, the tray left. */}
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white px-screen py-4">
        <div className="flex flex-1 flex-col gap-3 pb-7">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-12 w-36" />
        </div>
        <Skeleton className="size-24 shrink-0" />
      </div>

      {/* The weight choices, then «الذبح و التنظيف؟». */}
      <div className="flex flex-col gap-3 bg-white px-screen py-4">
        <Skeleton className="h-5 w-40" />
        <div className="flex items-center gap-2.5">
          {[0, 1, 2].map((choice) => (
            <Skeleton key={choice} className="h-16 flex-1 basis-0 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>

      {/* عاوز الفراخ امتي؟ — the day field and the time field, side by side. */}
      <div className="flex flex-col gap-3 bg-white px-screen py-4">
        <Skeleton className="h-6 w-36" />
        <div className="flex items-start gap-5">
          <Skeleton className="h-16 flex-1 basis-0 rounded-lg" />
          <Skeleton className="h-16 flex-1 basis-0 rounded-lg" />
        </div>
      </div>

      {/* «اضافة ملاحظة علي الطلب», then the starred line about the final price. */}
      <div className="mx-4 px-screen py-4">
        <Skeleton className="h-6 w-52" />
      </div>
      <div className="flex flex-col items-center gap-2 px-screen pb-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </SkeletonScreen>
  );
}
