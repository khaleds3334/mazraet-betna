# C-45 / C-46 — Order details, delivered

**Route:** `/tracking/[orderId]`
**Figma nodes:** 3185:5158 (paid) · 3185:5362 (money still owed)
**FR:** FR-12, FR-17, FR-29, FR-30
**States:** Delivered & settled · Delivered & owing · (weights table open, from C-44)

## What it does

One finished order, priced out. Walked into from «الطلبات السابقة» (C-51).

**It is the same page as C-41→C-44, four things later.** The invoice does not
change when the birds are handed over — it was final at the scale (D-05) — so the
bill, the weights table and the strip are the ones already built. Two things
differ, and both are about the order being over.

## What changes

**The head stops reporting a status and starts reporting money.** While the order
runs there is one pill, plus the confirm button at the one stage the customer
still has something to do. Delivered, the pill splits in two — «تم الاستلام», and
then «تم الدفع» or «متبقي مبلغ …» — with the handover date under them, the same
sentence his history card carries. That branch is `OrderStatusHead`.

**The strip loses its gates.** Running, it is five marks: four stages and whichever
one checkpoint is in play. Delivered, both checkpoints are behind it and neither
is waiting on anybody, so it is four marks, all done — 268px where the others are
302. The design's, not a shortcut.

**The payment lines always show.** Elsewhere they wait for money to have actually
moved, because «المبلغ المدفوع ٠ جنيه» on an order nobody has been asked to pay
for reads as a debt. Here it is the opposite: the order is over, the money is the
only thing left to be true or not, and «المبلغ المتبقي ١٣٠٤ جنيه» is exactly the
sentence he opened the screen to read. Fully paid shows «لا يوجد», not «٠ جنيه».

**«تواصل معنا» goes** (Khaled, 2026-08-25), paid or not. The pill is for an order
something can still be done about; on a finished one there is nothing to ask, and
with money outstanding a call button floating over the amount reads as the farm
chasing him for it. The page's bottom padding is that pill's clearance, so it
shrinks with it.

**Back goes to `/history`**, not `/tracking` — a finished order is not in the
tracking list, and returning him there would look like it had vanished.

## Data

**Reads:** `getOrder(farmId, orderId)` — unchanged
**Writes:** none. «التأكيد و الذبح» (D-67) is long past.

## Calculations

`computeInvoice` — total, paid, remaining (D-05, computed on read). The same call
the history card makes, so a card and the screen it opens can never disagree.

## Components

New: `OrderStatusHead`
Reused: `PageHeader` · `OrderStatusBadge` · `OrderTrackStrip` (new `delivered`
row) · `InvoiceSection` · `WeightsDisclosure` · `WeightsSection`

`InvoiceSection` is the admin's too, so the two apps cannot quote one order at
two numbers.

## Connected screens

← from: `/history` (C-51) · back to `/history`
→ to: nothing. This is where an order ends.

## Watch out

- **A cancelled order has no screen.** Nothing was weighed, so there is no invoice
  and no weights; its history card says all there is to say and deliberately
  leads nowhere (Khaled, 2026-08-25). `/tracking/[id]` still answers `ComingSoon`
  for one, since a typed URL can reach it.
- `WeightsDisclosure` scrolls to the end of the *content*, not to the end of the
  table, which is why the smaller bottom padding here needs no change in it.
