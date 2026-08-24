# C-41→C-44 — Order details, from the scale onwards

**Route:** `/tracking/[orderId]`
**Figma nodes:** 4033:5080 (the section) · 3185:1419 (C-41) · 3185:1586 (C-42) ·
3185:1726 (C-43) · 3185:1996 (C-44) · 3165:5347 (the C-33 card)
**FR:** FR-14, FR-15, FR-29, FR-30
**States:** Weighed · PriceConfirmed · Ready · WeightsOpen

## What it does

The same route as C-40, on a different layout. Under review the screen is the
four stages written out at length; from the moment the birds are weighed the
**invoice IS the order** (D-05), so the stages shrink to one horizontal strip and
the bill takes the page.

| Stage | Pill (customer) | Pill (admin) | Button |
|---|---|---|---|
| `weighed` | تم وزن الفراخ | تم وزن الفراخ | **التأكيد و الذبح** |
| `cleaning` | يتم الذبح و التنظيف | تم تأكيد السعر | — |
| `ready` | جاهز للاستلام | جاهز للاستلام | — |

## The stage that is not a status

«يتم الذبح و التنظيف» has no `order_status` behind it. The customer confirming
the price is stamped on `orders.price_confirmed_at` (migration 028) and read back
by `orderStage()`; the order stays `weighed` for the admin, whose next button is
still «جاهز للاستلام». See **D-67** for why a fifth status was the wrong shape,
and **T-63** for why the write goes through a definer function rather than a new
RLS policy.

## The strip is five marks, never six

Four stages, and between them two gates: the price being confirmed
(`document-validation`) and the order becoming ready (`tick-double-03`). A gate
is 34px, a stage 52px — a gate is not work being done, it is a fact becoming
true.

**The design only ever draws one gate.** On C-41 and C-42 it is the price gate,
between وزن and ذبح; on C-43 the price gate is gone and the ready gate stands
between ذبح and استلام. So the row is 302px at every stage and the eye lands on
the one checkpoint in play. `OrderTrackStrip` writes the three arrangements out
literally rather than deriving them — there are exactly three, and a rule general
enough to produce them would take longer to read.

**302px does not fit a 320px phone** (288px between the gutters). The circles are
fixed and the rules give way: `w-full` on the row, and the connectors are the
only things in it allowed to shrink, down to a 4px floor. Nothing shrinks at
360px and up.

## Data

**Reads:** `getOrder(farmId, orderId)` — now also carrying `priceConfirmedAt`.
Totals come from `computeInvoice`, never recomputed here.
**Writes:** `confirmOrderPrice(orderId)` → `public.confirm_order_price()` (RPC).

## Components

New: `OrderTrackStrip` · `OrderInvoiceView` · `OrderReview` · `ConfirmPriceButton`
· `WeightsDisclosure`
Reused: `InvoiceSection` · `WeightsSection` · `OrderStatusBadge` · `PageHeader` ·
`ContactButton`

`OrderReview` is C-40's body lifted out of the page unchanged, so the page is a
branch between two bodies rather than a screen with two halves in it.

The invoice is **not written here.** `InvoiceSection` and `WeightsSection` are
the same components the admin's `InvoiceSheet` shows, so the two apps can never
quote the same order at different numbers.

## Icons

`ordersWaiting` (timer-01) · `weight` (weight-scale-01) · `priceConfirm`
(document-validation, new) · `ordersProcessing` (knives) · `delivered`
(package-delivered-01) · `checkDouble` (tick-double-03) · `arrowDown`

## Feedback

Success: `تم تأكيد الطلب، هيتم تجهيزه دلوقتي` (toast)
Failure: `مقدرناش نأكد الطلب، حاول تاني` (toast — T-60: the customer's errors are
toasts, not inline)
Stale: `الطلب اتغيّر، اقفل الصفحة و افتحها تاني` — the RPC returned null, so the
admin has most likely already moved the order on.
The button disables and says `بنأكد الطلب…` while the action is in flight, and
stays disabled through the refresh that replaces the screen.

## Watch out

- **The pill takes a stage, not a status.** `OrderStatusBadge` was reworked
  (`status` → `stage`); the admin's card and the tracking card both pass
  `orderStage(order)`.
- The connectors are `#6E7C73` (`--color-muted`) at every stage — the same grey
  behind marks already passed, not lime. Checked against the exported vector.
- The circles are sized, not padded: `p-[14px]` plus a border renders 54px
  against a 52px design.
- `mx-screen` does not exist (T-62). The disclosure button is an `inline-flex`
  inside a `px-screen` wrapper.

## Connected screens

← from: `/tracking` (the card)
→ to: `/tracking` (back) · C-45 / C-46 (delivered) still `ComingSoon`
