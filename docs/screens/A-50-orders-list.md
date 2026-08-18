# A-50 — Orders List (Admin)

**Route:** `/admin/orders`
**Figma node:** 3612:5595 (section) — three frames, one per selected tab:
`3612:5446` (المكتملة) · `3612:5373` (قيد التشغيل) · `3612:3887` (الجديدة)
**FR:** FR-12 (order lifecycle + tab grouping) · FR-13 (orphan order, via اضافة طلب)
**States built:** Empty × 3 (one per tab) · Filled with the **pending** card
(node 3295:9568).
**States pending:** the cards for weighed / ready / delivered / cancelled, search
results, archive tabs for an ended cycle.

## What it does
Everything the admin needs to run the day's orders, scoped to one cycle. A
toolbar (cycle filter · اضافة طلب), a search box, a tab bar carrying a live count
per group, and the list below it.

Tabs are **groups of statuses, not statuses** (FR-12):
`الجديدة` = pending · `قيد التشغيل` = weighed + ready · `المكتملة` = delivered.
`ملغي` is a side state and belongs to no tab.

The selected tab lives in the URL (`?tab=new|active|done`), so the screen is a
server component with no client state (T-02), and refresh + back behave.

## Data
**Reads:**
- `getDefaultOrdersCycle(farmId)` — the cycle the screen scopes to: the running
  cycle, else the most recent one to end (Khaled, 2026-08-18).
- `getOrderTabCounts(farmId, cycleId)` — one read of the cycle's order statuses,
  tallied in memory by `tallyOrderTabs`.
- `listOrders(farmId, cycle, statuses)` — the selected tab's orders, newest
  first, each arriving with everything its card shows.

**Writes:** none on this screen.

## Calculations
None. `tallyOrderTabs` is driven by `ADMIN_ORDER_TABS`, the single definition of
what belongs in which tab — shared with the A-20 order tiles, so the two screens
can never disagree.

## Components
New (ui): `EmptyState` — glyph in a ring + one line, for every list screen.
New (admin/orders): `OrdersToolbar` · `OrdersSearchBar` · `OrderTabs` ·
`OrdersEmptyState` · `OrderCard` · `OrderCardActions`.
New (shared): `OrderStatusBadge` (the same pill serves both apps, labelled per
viewer — D-03) · `ContactLinks` (WhatsApp + call, bespoke design SVGs per T-19).

`OrderTabs` deliberately does **not** reuse `ui/Chip`: the chip is a
single-select filter pill (no count, different border and text size), while a tab
is a link carrying a number. Two small components beat one with four override
props — same reasoning as T-20.

## Icons
`filter` (filter) · `addOrder` (layer-add) · `search` (search-02) ·
`ordersWaiting` (timer-01) · `ordersProcessing` (knives) · `delivered`
(package-delivered-01).

The empty-state glyph renders at 104px with `strokeWidth={0.5}` — a deliberate
departure from the rule in `Icon.tsx`, since the icon's own 1.5 weight is drawn
for 24px and would render ~6px thick at that size. The design draws it hairline
(`stroke-width: 2` on a 104px glyph).

## Feedback
Nothing writes here yet, so no toast or inline error. They arrive with the order
actions (weigh · deliver · cancel · pay), which are critical and use inline
errors (T-09).

## Connected screens
← from: admin bottom nav · A-20 order tiles (display only for now).
→ to: `/admin/orders/new` (A-56, stub) · order detail + weighing (A-52), next.

## The order number
`طلب رقم #١٠٠٤` = the cycle's number then the order's number inside that cycle,
padded to three digits (Khaled, 2026-08-18). Both counters are database columns
assigned by a trigger (migration 009/010), so a number never shifts once given,
and `formatOrderNumber` in `/lib/format.ts` is the only place it is composed.

## Watch out
- The tab row scrolls sideways: the three chips are wider than a 320px screen.
- Counts are per **cycle**, not per farm — an old cycle's numbers must not leak
  into the running one.
- The card shows one "الوزن المطلوب". Orders booked from A-56 always carry a
  single weight; a customer order may mix them, and then the card reads
  "أوزان مختلفة".
- Orders the admin books have no pickup slot (A-56 doesn't ask), so the card
  reads "مش محدد" there.
- An orphan order has no customer: the name slot reads "طلب يتيم" and the contact
  shortcuts are hidden. Not a designed state — it follows from FR-13.
- Once an old (ended) cycle can be selected, the tabs change meaning: everything
  in it is complete, so the groups become مدفوع / عليه فلوس / ملغي rather than
  الجديدة / قيد التشغيل / المكتملة (Khaled, 2026-08-18). Not built yet.
