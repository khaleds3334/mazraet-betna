# A-13 — Withdraw Feed Bag (سحب شكارة)

**Trigger:** "سحب شكارة" on the raising dashboard (A-11); the bag-detail popup opens
from tapping a lit square on the consumption grid.
**Figma node:** 3502:3897 (`امتي فتحت الشكارة؟` record popup) · 3238:10980 (bag-detail popup)
**FR:** FR-22 (feed) · see D-17 (feed-withdrawal model)
**States:** record: default (today/now pre-filled) · saving · error (toast). detail: read-only.

## What it does
Two popups:
- **Record ("امتي فتحت الشكارة؟")** — logs one opened 50kg bag. The admin picks the
  day (اختار اليوم) and time (اختار الوقت) — both pre-filled to today/now so it's a
  one-tap save — then حفظ records the withdrawal. That day's square lights up on the
  consumption grid and العلف المتوفر drops by one bag.
- **Bag detail** — tapping a lit square shows that bag: its number (الشكارة رقم N),
  its type (بادي/نامي), the flock's age that day (عمر الفراخ), and the exact day +
  time it was opened. Read-only; closes on scrim tap.

## Bag type (بادي/نامي) — derived, not stored
There's no per-bag type column. A bag's type is derived by order: the first
`round(requiredBadi)` bags opened (chronologically) are بادي, the rest نامي —
Khaled's FIFO rule ("as long as there's still بادي, any bag I open is بادي until it
runs out"). `requiredBadi` = `expectedFeedBags(chickCount).badi`. ⚠️ This assumes the
بادي bought equals the بادي required; if that diverges, tie it to actual purchases by
storing the type on the `feed` table.

## Data
**Reads:** the active cycle's withdrawals (day, time, order → number/type/age) come
pre-computed on the dashboard `feed.withdrawals`; the detail popup is a pure view.
**Writes:** `addFeedWithdrawal({ withdrawnOn, withdrawnAt })` in
`lib/actions/expenses.ts` → one `feed_withdrawal` row (`bags` defaults to 1, plus the
opening time). Validates the day sits inside the cycle (≥ start, not future).

## Model note
Per **D-17** each row is one opened bag, keyed by `withdrawn_on`; migration `008`
adds `withdrawn_at` (time) so the detail popup can show the exact time. The grid
still lights per day; each lit day maps to its (first) bag for the detail popup.

## Components
New (`admin/shared` since T-49): `RecordFeedWithdrawalButton` (launcher + popup) ·
`FeedWithdrawalDetail` (bag-detail popup). `FeedGrid` is now a client component —
lit cells are buttons that open the detail popup. Reused: `Modal` · `CloseButton` ·
`PickerField` (date + time) · `ActionButton` (حفظ, primary) · `Icon`.

## Feedback
Success: `تم تسجيل سحب الشكارة` (toast) — then the popup closes and the dashboard
refreshes (grid + العلف المتوفر/المسحوب). Recording isn't a critical action, so a
toast is correct. Failure keeps the popup open with a toast.

## Connected screens
← from: A-11 raising dashboard (سحب شكارة button).
→ to: refreshes A-11 (the consumption grid).

## Watch out
- The day must be within the cycle; a day before start or in the future is rejected
  with an Arabic message.
- The grid keys off `withdrawn_on − start_date`, and day 1 is the bottom-left cell.
