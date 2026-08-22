import { AddButton, Icon } from "@/components/ui";

/**
 * The top row of the orders screen when the farm has no order to show yet (A-50)
 * — no cycle at all, or a first flock still being raised.
 *
 * It is the **selling screen's own header**, drawn in place: «اضافة طلب» and the
 * cycle name on the inline-end, the cycle funnel on the inline-start — the same
 * row `OrdersToolbar` builds. The screen used to be one sentence floating in an
 * empty page, which reads as a screen that failed to load rather than one with
 * nothing in it yet (Khaled, 2026-08-21).
 *
 * Only those two controls are inert, and that is the honest state: with no cycle
 * selling there is nothing to add an order to (D-39), and no second cycle to
 * filter to. They are dimmed and `aria-hidden` because they are exactly that — a
 * picture of the screen — while the cycle name stays live text.
 *
 * **The search box and the tabs are not here.** They are the parts of this screen
 * that still have something to say, so the page hands them to the real
 * `OrdersBrowser`, working, and they answer a tap like they always do (Khaled,
 * 2026-08-21). Drawing a second, dimmed search box here put two of them on the
 * screen at once (Khaled, 2026-08-22).
 */
export function OrdersEmptyHeader({ cycleName }: { cycleName?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 px-screen">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="pointer-events-none shrink-0 select-none opacity-60"
        >
          <AddButton label="اضافة طلب" icon="addOrder" />
        </span>

        {cycleName && (
          <span className="truncate text-base font-bold text-heading">
            {cycleName}
          </span>
        )}
      </div>

      <span
        aria-hidden
        className="pointer-events-none flex size-11 shrink-0 select-none items-center justify-center opacity-60"
      >
        {/* 2px is the weight Figma draws it at — same as `CyclePickerButton`. */}
        <Icon
          name="filter"
          size={38}
          strokeWidth={2}
          absoluteStrokeWidth
          className="text-foreground"
        />
      </span>
    </div>
  );
}
