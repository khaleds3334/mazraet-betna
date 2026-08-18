# A-23 — Confirm Start Selling (popup)

**Route:** `/admin` (a dialog over the raising dashboard, A-11)
**Figma node:** 3608:3838
**FR:** FR-11 (open the sale) · FR-5 / FR-26 (the kilo price)
**States:** Closed · Open · Submitting · Error

## What it does
Stands between "بدء مرحلة البيع" and the sale actually opening. It confirms the
intent **and** captures the kilo price the cycle will sell at — opening the sale
without a price set is the mistake this dialog exists to prevent.

## Data
**Reads:** `CycleDashboard.salePrice` — the live `settings.sale_price`, which the
stepper opens on, so the usual case is "tap بدء البيع and go".
**Writes:** `startSelling(salePrice)` — writes the price to `settings.sale_price`,
then flips `cycle.sale_open`.

**Why the price lives on `settings`, not on the cycle:** Khaled asked for it to
stay editable from Settings afterwards. Nothing is lost by that — an order
snapshots `unit_price` at weighing (T-15), so changing the price later never
rewrites an invoice that already exists.

**Write order matters:** price first, sale flip second. If the price write
succeeds and the flip fails, the sale stays closed and the admin retries. The
reverse order could open the sale at yesterday's price — the expensive failure.

## Components
New (ui): `Stepper` — the big `−  ٩٠  +` control.
Renamed (ui): `AddButton` → `StepButton`, now with `sign="plus" | "minus"`; the
design draws both signs on the identical lime square, so one component covers
both and `NumberStepper` keeps using the plus.
Reused: `Modal` · `CloseButton` · `ActionButton` (primary + danger) · `InlineError`
· `Button`.
New token: `--text-h2` (32px) for the stepper value.

## Feedback
Success: `بدأت مرحلة البيع` (toast) + the home switches to A-20 on refresh.
Failure: **inline error inside the dialog, never a toast** — opening the sale is
visible to every customer, and a toast that auto-dismisses unseen would leave the
admin waiting for orders that can never arrive (T-09).
Empty price: `اكتب سعر كيلو الفراخ الأول.` inline, before the action is called.

## Connected screens
← from: A-11 raising dashboard ("بدء مرحلة البيع", enabled from day 27).
→ to: A-20 selling dashboard.

## Watch out
- The stepper's number is a real input, so a far-off price can be typed instead
  of tapped dozens of times. It has no box or underline, so it looks exactly like
  the plain number in Figma.
- Cancelling resets the price back to the saved one, so a half-edited number
  never survives to the next open.
- Both footer buttons are ≥44px and side by side: confirm on the right, cancel on
  the left (first DOM child is the right one in RTL).
