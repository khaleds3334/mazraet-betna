import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of the customer home (C-10→C-12).
 *
 * It sits at the top of the `(customer)` group, so on paper it covers every
 * customer route — in practice each of them has its own file beside its page
 * (T-37), and this one only ever stands in for the home.
 *
 * The three faces of this screen (البيع متوفر · مقفول مؤقتا · مغلق) differ in
 * colour and in wording, never in shape: badge, heading, the date line, four
 * countdown boxes, two actions. So there is one skeleton and it fits all three.
 */
export default function CustomerHomeLoading() {
  return (
    <SkeletonScreen className="gap-4 pb-pill">
      {/* The header: ☰ on the right, the logo in the middle, the bell on the
          left — same 86px row the real one holds. */}
      <header className="flex h-[86px] items-center justify-between px-screen">
        <Skeleton className="size-11" />
        <Skeleton className="h-20 w-[76px]" />
        <Skeleton className="size-11" />
      </header>

      {/* Same `flex-1` + `justify-evenly` as the page, so the blocks land where
          the real ones will and nothing jumps when they arrive. */}
      <div className="flex flex-1 flex-col justify-evenly gap-section px-screen">
        {/* مرحبا بيك في مزرعة بيتنا / لبيع الفراخ البيضاء الطازجة. */}
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-7 w-52" />
        </div>

        {/* The sale card: the state pill, the heading, the «فترة البيع تنتهي في»
            line with its date opposite, then the four countdown boxes. */}
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

        {/* «اطلب فراخ طازجة دلوقتي» and «الطلبات السابقة» — `min-h-14` each. */}
        <div className="flex flex-col gap-5">
          <Skeleton className="h-14 w-full rounded-[10px]" />
          <Skeleton className="h-14 w-full rounded-[10px]" />
        </div>
      </div>
    </SkeletonScreen>
  );
}
