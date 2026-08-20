# A-32 — Customer Order History

**Opens from:** the expanded block under a customer row (A-31) — the whole block
is the trigger
**Figma node:** 3281:6452
**FR:** FR-9 (customer detail), FR-17 (installments), FR-20 (debt)
**States:** Loading · Filled · Filtered · Empty · Error

## What it does
Everything one customer has ever ordered. Their name and number at the top with
what they still owe, a filter across cycles (الكل · الدورة الحالية · القديم), and
every order as a card.

## The cards are the orders screen's cards
`OrderCard`, unchanged. An order looks and behaves one way in this app: the invoice
opens from it, a payment is recorded on it, a cancelled one shows why. Redrawing a
lighter version here would be two cards to keep in step and the admin learning the
order twice — and the design draws the same card anyway.

That is what the settings are threaded down the tree for: `OrderCard` hands the
live kilo and cleaning price to whatever it opens (T-15).

## Data
**Reads:** `listCustomerOrders(farmId, customerId, currentCycleId)` — every order
of one customer, newest first, each tagged `inCurrentCycle`. **Cancelled orders are
included**: "why did I never get it?" is exactly the question this list is opened
to answer.

Row → `OrderListItem` now goes through one shared `toOrderListItem`, so this list
and the orders screen (A-50) cannot drift apart in what a card is given. The
`select` string is shared too.

**Fetched on demand**, when the sheet opens — the customers screen would otherwise
ship every customer's whole history to open one of them. It travels on a server
*action* (`fetchCustomerOrders`) purely because a client component cannot call a
query; the read itself stays in `/lib/queries` and the action writes nothing.

**Which cycle is "الحالية":** `getDefaultOrdersCycle` — the cycle **selling** now,
else the **last to end**, else whatever exists. One definition for the whole app,
so the chip here, the count on the row, and the orders screen always mean the same
cycle.

**It opens on «الدورة الحالية»**, not «الكل» — that is the flock being collected
for, and the reason the sheet gets opened at all.

**The debt at the top follows the chip.** «الدورة الحالية» beside a lifetime debt
would be two numbers contradicting each other on one line. `القديم` is the
remainder: everything owed, minus this cycle's.

## Components
New: `CustomerOrdersSheet`
Reused: `BottomSheet` · `CloseButton` · `Chip` · `Skeleton` · `InlineError` ·
`ContactLinks` · `DebtAmount` · **`OrderCard`** and everything under it

## Feedback
Loading is two card-shaped skeletons, not a spinner — the sheet's height then
barely moves when the orders land. A failed fetch is a persistent inline error
inside the sheet; there is nothing to toast about, the sheet is still open.

## Watch out
- **The trigger is a stretched overlay button**, not a wrapper around the block —
  the summary is made of paragraphs, and a button may not contain them. The figures
  are `pointer-events-none` and pass their taps up. Same pattern as the row above.
- Filtering is client-side over what was fetched — one customer's history is tens
  of rows, and a round trip per chip tap would be a round trip to hide three cards
  (same split as the search box, T-32).
- An order's number is built from **its own** cycle's `seq`, not the current one —
  a customer's history spans cycles, so `toOrderListItem` takes the seq per order.
