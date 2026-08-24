# C-31→C-35 — Tracking, with orders

**Route:** `/tracking`
**Figma nodes:** 4013:2226 (the three single-order states) · 3165:6386 (C-35, several)
**FR:** FR-29, FR-30
**States:** Review · Weighed · Ready · Several

## What it does

Shows the customer's orders that are still running, newest first. Tapping a card
opens that order's details and invoice (`/tracking/[orderId]`, still a stub).

**One order gets a glyph over it; a list does not.** With several cards the
status is already on each one, and a single mark over the top could only
describe the first — which is why C-35 drops it.

| Status | Glyph | Rows | Line under them |
|---|---|---|---|
| `pending` | `timer-01` | العدد · الاوزان المطلوبة · معاد التجهيز | يتم الان التأكد من توفر الاوزان المطلوبة |
| `weighed` | `weight-scale-01` | العدد · اجمالي الوزن · السعر النهائي | انظر الي الفاتورة… |
| `ready` | `tick-double-03` | العدد · السعر النهائي · المبلغ المدفوع | الطلب الان جاهز للاستلام… |

What the card says changes with the status because what matters changes: while
the order is under review it repeats what was asked for, since there is nothing
else to report. Once the birds are on the scale the plan stops being the news
and the invoice takes over (D-05).

## Data

**Reads:** `listCustomerActiveOrders(farmId, customerId)` (new) — same columns and
same mapper as every other order read, so the customer's card and the admin's
are looking at one shape. Totals come from `computeInvoice`, never recomputed
here.
**Writes:** none

## Components

New: `TrackingCard` · `IconRing`
Reused: `OrderStatusBadge` (`viewer="customer"`) · `EmptyOrders`

`IconRing` is the 132px ring with a 104px glyph. `EmptyState` had drawn it by
hand; this screen was the second use, so it became a component and `EmptyState`
now uses it too.

## Watch out — RTL flips every `justify-between` row

In RTL the **first child of a `justify-between` row lands on the right**. Figma
renders its frames left-to-right, so a row read off the design in DOM order
comes out mirrored. All three rows on this card had to be written back to front
against the Figma source: the order number before the status pill, the label
before the value, the hint before the arrow.

There were `order-1`/`order-2` classes doing this at first. They worked, but
they hid the reason — plain DOM order says the same thing and can be read.

## Card details worth keeping straight

- The order number and its timestamp share one right edge. `items-end` shrinks
  each line to its own text and leaves the shorter one hanging — stretching both
  and aligning the text right is what the design draws.
- Counts and money are set in the label's own bold 16px; measurements (weight,
  pickup time) are 14px regular.
- The rule is **1.5px in the body green** (`--color-foreground`), not a hairline
  in the border grey.
- The timestamp is `--color-timestamp` (#ababab). Figma writes that one as a raw
  hex rather than a variable, which is why it never matched `disabled` (#8b968f).
- On the weighed and ready cards the line beside the arrow is centred over two
  lines (`max-w-[195px] text-center`); on the pending card it is a single line.
- «تم وزن الفراخ» is the customer wording too now — `ORDER_STATUS_LABEL.customer`
  said «تم الوزن», which reads as a step rather than a state. Only this card uses
  the customer labels, so nothing else moved.

## Two things the design says that the data does not

- **«اجمالي الوزن»** is drawn as `3 فرخات * 2.45 كجم = 7.852 كجم`, which does not
  multiply out (3 × 2.45 is 7.35). Birds are weighed one by one and no two match,
  so there is no single multiplier to show. The card shows the real total.
- **C-33 «الذبح والتنظيف»** is gone from the Figma file — the node 404s and the
  section the design links to has only three states. There is no status behind it
  either: `orders.status` runs pending → weighed → ready → delivered, and
  `cleaning` is a boolean on the order, not a stage. Nothing to build.

## Connected screens

← from: the «تتبع الطلب» tab
→ to: `/tracking/[orderId]` (stub) · `/history` (from the bar)
