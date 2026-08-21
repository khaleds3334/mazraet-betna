import { AddButton, Icon, SearchField } from "@/components/ui";

/**
 * The header of the orders screen before the farm has its first cycle (A-50).
 *
 * The screen used to be one sentence floating in an empty page, which reads as a
 * screen that failed to load rather than one with nothing in it yet (Khaled,
 * 2026-08-21). It now draws the real chrome — «اضافة طلب», the cycle funnel and
 * the search box — dimmed and inert, so the admin sees the shape of the screen he
 * will be working in.
 *
 * None of these three is tappable, and that is the honest state: with no cycle
 * there is nothing to add an order to (D-39), no second cycle to filter to, and
 * no order to search for. `aria-hidden` because it is exactly that — a picture of
 * the screen; the sentence under the tabs is what says where things stand.
 *
 * **The tabs are not here.** They are the one part of this screen that still has
 * something to say — each names a different empty list — so the page hands them
 * to the real `OrdersBrowser`, working, and they answer a tap like they always
 * do (Khaled, 2026-08-21).
 */
export function OrdersEmptyHeader() {
  return (
    <div
      aria-hidden
      className="pointer-events-none flex select-none flex-col gap-4 opacity-60"
    >
      {/* «اضافة طلب» on the right, the cycle funnel on the left — the same row
          `OrdersToolbar` builds, without the cycle name: there is no cycle. */}
      <div className="flex items-center justify-between gap-3 px-screen">
        <AddButton label="اضافة طلب" icon="addOrder" />
        <span className="flex size-11 shrink-0 items-center justify-center">
          <Icon
            name="filter"
            size={38}
            strokeWidth={2}
            absoluteStrokeWidth
            className="text-foreground"
          />
        </span>
      </div>

      <div className="px-screen">
        <SearchField placeholder="ابحث باسم العميل او رقم الطلب" />
      </div>
    </div>
  );
}
