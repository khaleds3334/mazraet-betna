# A-51 — Cancel Order (Admin)

**Opened from:** the "الغاء الطلب" button on a pending order card (A-50)
**Figma node:** 3295:10033 (dialog) · 3322:16823 (the cancelled card)
**FR:** FR-16 (only the admin cancels — D-04) · FR-12 (cancelled is a side state)
**States:** confirm · saving · failure (inline)

## What it does
Asks "هل انت متأكد من الغاء الطلب؟", takes a **required** reason, and closes the
order. Nothing is deleted: the order keeps its lines and its number, and the card
turns into the cancelled version showing the reason back.

## Data
**Writes:**
- `cancelOrder(orderId, reason)` → `status = cancelled`, `cancelled_at = now()`,
  `cancel_reason` (column added in migration 011).
- `updateCancelReason(orderId, reason)` → the pen on a cancelled card corrects
  the text and nothing else, so a typo fix doesn't rewrite when it was cancelled.

**Reads:** the reason comes back on `listOrders` as `cancelReason`.

## Where a cancelled order lives
In the **المكتملة** tab (Khaled, 2026-08-18): the tab means "this order is
finished with", however it ended. `ADMIN_ORDER_TABS.done` therefore covers
`delivered` + `cancelled`.

The A-20 dashboard tile is unaffected — `getSellingStats` filters cancelled
orders out of its query before tallying, so the tile still counts deliveries.

## Feedback
Success: `تم الغاء الطلب` / `تم تعديل سبب الإلغاء` (toast), plus the card itself
changing — the unmistakable confirmation.
Failure is a **persistent inline error inside the dialog**, never a toast (T-09).
Cancelling is on the critical list: if a toast vanished unseen the admin would
believe the order was cancelled and keep birds aside for a customer who is never
coming. An empty reason is refused before anything is written, in both dialogs.

## Components
New (admin/orders): `CancelReasonDialog` (the shared form) · `CancelOrderButton`
· `EditCancelReasonButton`.
New (shared): `PenGlyph` — the design's `solar:pen-linear`, traced from Figma.
Hugeicons' `PencilIcon` is a different glyph and `PencilEdit01Icon` puts a square
behind the nib, so neither matches (T-19).
Reused: `Modal` · `CloseButton` (sm) · `InlineError` · `Icon`.
Changed: `OrderCardActions` now takes an `orderId`; `OrderStatusBadge`'s
cancelled tone became the design's solid red with white text.

## Icons
`cancel` (cancel-02, in both red circles). The pen is `PenGlyph`, not an icon
name.

## Connected screens
← from: A-50 pending card.
→ stays on A-50; the card becomes the cancelled variant in place.

## Watch out
- The reason is required — it is the whole point of the dialog.
- The edit dialog is not in Figma; it repeats the cancel dialog's shape so it
  reads as the same thing (Khaled asked for the pen to be editable, 2026-08-18).
- `updateCancelReason` is scoped to `status = cancelled`, so it can never write a
  reason onto a live order.
- A cancelled order still holds `order_line` rows, but it is excluded from every
  money and flock figure (`getSellingStats` skips it), so it can't inflate income
  or hold birds back from `availableChickens` (D-18).
