import { Skeleton, SkeletonScreen } from "@/components/ui";

/**
 * Loading face of «تفاصيل الطلب» (C-40→C-46).
 *
 * The screen has two layouts and this draws the second — pill, track strip,
 * invoice, and the way down to the weights. From the moment the birds are
 * weighed the invoice IS the order (D-05), and that is the state a customer
 * opens this screen in: under review he is looking at the tracking card that
 * already told him the same thing.
 *
 * `-mb-nav` like the page: this is a screen walked into, `BottomNav` stands
 * itself down here, and the room `<main>` reserves for it is given back.
 */
export default function OrderDetailsLoading() {
  return (
    <SkeletonScreen className="-mb-nav gap-6 pb-contact">
      {/* The pinned block: back button and title, then which order this is. */}
      <div className="flex flex-col gap-4 pb-2">
        {/* `PageHeader`: the back button at the reading edge, the title laid
            over the row and centred against the screen. */}
        <header className="relative flex min-h-12 items-center px-screen pt-4">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="absolute inset-x-0 mx-auto h-6 w-40" />
        </header>

        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 px-screen">
          {/* The stage pill, with «التأكيد و الذبح» opposite it while the price
              is waiting on him — the widest this row gets. */}
          <div className="flex w-full items-center justify-between gap-3">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>

          {/* The four stage marks with their rules between them. */}
          <div className="flex w-full items-center justify-center gap-2">
            {[0, 1, 2, 3].map((mark) => (
              <Skeleton key={mark} className="size-11 rounded-full" />
            ))}
          </div>
        </div>

        {/* «الفاتورة»: the full-bleed band, then the bill inside the gutter. */}
        <section className="flex w-full flex-col items-center gap-2">
          <div className="flex w-full justify-center bg-surface py-[5px]">
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="w-full px-screen">
            <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface-page p-4 shadow-card">
              <div className="flex flex-col gap-3">
                {/* Three lines, a rule, then the two that close the bill. */}
                <div className="flex flex-col gap-3 border-b border-border pb-3">
                  {[0, 1, 2].map((line) => (
                    <div
                      key={line}
                      className="flex items-center justify-between gap-3"
                    >
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  ))}
                </div>
                {[0, 1].map((line) => (
                  <div
                    key={line}
                    className="flex items-center justify-between gap-3"
                  >
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* «عرض الاوزان بالتفصيل» — as wide as its words, at the reading edge. */}
        <div className="px-screen">
          <Skeleton className="h-11 w-48" />
        </div>
      </div>
    </SkeletonScreen>
  );
}
