import { Skeleton, SkeletonScreen } from "@/components/ui";
import { SectionBand } from "@/components/shared/invoice/SectionBand";

/**
 * Loading face of «تفاصيل الطلب» (C-40→C-46).
 *
 * The screen has two layouts and this draws the second — pill, track strip,
 * invoice, and the way down to the weights. From the moment the birds are
 * weighed the invoice IS the order (D-05), and that is the state a customer
 * opens this screen in: under review he is looking at the tracking card that
 * already told him the same thing.
 *
 * **The title is real, the back button is not** (T-69) — the one place on this
 * screen where the two part company. «تفاصيل الطلب» is the title of every order
 * ever opened, so it is written. Where back *goes* is an answer: a delivered
 * order was walked into from «الطلبات السابقة» and returns there, everything
 * else returns to «تتبع الطلب» — and a button drawn now would be pointing at the
 * wrong screen for one of them. `PageHeader` centres its title with or without
 * the button, so nothing shifts when the real one takes its place.
 *
 * «الفاتورة» and «عرض الاوزان بالتفصيل» are written too: both are on this screen
 * at every stage that reaches this layout.
 *
 * `-mb-nav` like the page: this is a screen walked into, `BottomNav` stands
 * itself down here, and the room `<main>` reserves for it is given back.
 */
export default function OrderDetailsLoading() {
  return (
    <SkeletonScreen className="-mb-nav gap-6 pb-contact">
      <div className="flex flex-col gap-4 pb-2">
        {/* `PageHeader`'s own markup, with a grey square where its button goes
            — the title is laid over the row and centred against the screen, so
            it sits in exactly the same place either way. */}
        <header className="relative flex min-h-12 items-center px-screen pt-4">
          <Skeleton className="size-12 rounded-xl" />
          <h1 className="pointer-events-none absolute inset-x-0 px-14 text-center text-h6 font-bold text-primary-foreground">
            تفاصيل الطلب
          </h1>
        </header>

        {/* Which order, and when he placed it. */}
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

        <section className="flex w-full flex-col items-center gap-2">
          <SectionBand>الفاتورة</SectionBand>

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

        {/* As wide as its words, at the reading edge — the real button's shape.
            Inert until the weights it opens are here. */}
        <div className="px-screen">
          <span className="inline-flex min-h-11 items-center gap-1 text-base text-foreground">
            <span className="optical-center">عرض الاوزان بالتفصيل</span>
          </span>
        </div>
      </div>
    </SkeletonScreen>
  );
}
