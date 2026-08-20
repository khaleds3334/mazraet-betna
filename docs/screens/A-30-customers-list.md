# A-30 — Customers List

**Route:** `/admin/customers`
**Figma node:** 3627:5600 (empty) · 3281:5025 (filled) · 3281:5601 (الآجل filter on)
**Row:** 3281:5648 (collapsed) · 3281:6260 (expanded)
**FR:** FR-8 (add customer + list), FR-9 (customer detail — later)
**States:** Empty · Filled · RowExpanded · DebtFiltered · Searching · NoResults

## What it does
The farm's permanent customer base. Every customer with what they still owe, the
farm's total outstanding, a search box, and a filter down to the debtors. Tapping a
row opens that customer's standing in place; tapping the top half again closes it.

## Data
**Reads:** `listCustomerSummaries(farmId, cycleId)` — every customer with debt,
total invoiced, total paid, orders ever, and orders in the current cycle. All
computed on read from their non-cancelled orders (D-05). Orphan orders (FR-13)
belong to nobody, so they're excluded. `cycleId` comes from
`getDefaultOrdersCycle` — the same cycle the orders screen defaults to.
**Writes:** none yet (A-34 registration and A-35 edit are later screens).

## Calculations
- Per-customer debt = `computeInvoice().remaining`, clamped at 0 per order and
  summed — clamped so an overpaid order can't erase another order's real debt
- `اجمالي الآجل` = sum of every customer's debt — always the whole farm, never the
  filtered subset
- Row progress bar = `inCycle.paidTotal / inCycle.invoiceTotal`, filling from the
  physical left — **scoped to الدورة الحالية** (Khaled, 2026-08-20). A bar summing
  every order a customer ever placed says nothing about the flock being collected
  for this week, and barely moves when a payment lands. The lifetime figure is
  still on the row above, as the debt

## Search
`matchesNameOrPhone` in `lib/search.ts`, run in the browser over the list the page
already loaded (T-32). A query with digits in it is read as a phone fragment,
Arabic-Indic digits included (`٠١٠` finds `010`).

Everything else matches the **name**, normalised the way it gets *typed* rather than
spelled. The admin is looking for someone he knows, standing up and one-handed — if
a near-miss returns nothing he concludes the customer isn't registered and adds them
a second time. So all of these find the row:

| He types | It finds | Because |
|---|---|---|
| احمد | أحمد | alef / ya / ta-marbuta / hamza variants unified |
| فاطمه | فاطمة | ة → ه |
| مصطفي | مصطفى | ى → ي |
| الخياط | الخيّاط | tashkeel + tatweel dropped |
| الشيخ احمد | شيخ احمد | «ال» ignored at the start of every word, both ways |
| عبدالله | عبد الله | second pass compares with spaces removed |
| احمد الخياط | الخياط احمد | word-by-word, so order doesn't matter |

Two passes, either one is enough: word-by-word with articles stripped (every word
typed must appear somewhere in the name, in any order), then a plain substring test
with spaces removed and articles kept. The same matcher backs the add-order sheet's
picker.

"Nothing matched" has no design; it borrows the empty state's shape with its own
sentence — «مفيش عميل بالاسم او الرقم ده».

## Components
New (shared): `ui/AddButton` · `ui/SearchField` — see T-28
New (screen): `CustomersToolbar` · `CustomersList` · `CustomersFilterBar` · `CustomerRow` ·
`CustomerRowDetails` · `DebtAmount` (wallet + amount, tan when owed / green when
settled — D-28)
Reused: `EmptyState` · `Icon` · `shared/ContactLinks` · `shared/PenGlyph`

## Icons
`addCustomer` (layer-add, same glyph as `addOrder`) · `debt` (wallet-03, mirrored)
· `customers` (user-group-03) · `search` · `PenGlyph` (solar:pen-linear, unflipped
here) · the WhatsApp and call glyphs inside `ContactLinks`

## Feedback
No write actions on this screen, so no toasts. Two controls the design draws have
no destination yet and render non-tappable rather than dead: the «اضافة عميل»
button (A-34) and the row's pen (A-35).

## Connected screens
← from: admin bottom nav
→ to: A-34 registration sheet (not built) · A-35 edit customer (not built) · the
customer's order history behind the expanded details (not built)

## Watch out
- The row toggle is an **overlay button** stretched over the top half, not a
  wrapper around it — the contact shortcuts inside that area are links, and a
  button may not contain them. The content layers are `pointer-events-none`; the
  contact pair takes its taps back with `pointer-events-auto`.
- The progress bar fills from the physical `left-0`, under the «مدفوع» label. Do
  not "fix" this to a logical `start-0` — that flips it in RTL. Green is the paid
  share, tan the remainder — the reverse of the Figma export, settled by Khaled
  (T-29).
- The phone number sits in a fixed `11ch` box so the two contact buttons line up as
  one column down the list — Almarai's digits are not all the same width. It shrinks
  only under ~355px, where the design's row no longer fits a 320px screen.
- The «الآجل» pill is grey when off and tan when on (A-31) — grey is *inactive*,
  not disabled.
- The count pill reports what the list is *showing*, so it follows both the filter
  and the search — which is what A-31 draws («٣ عملاء» on a filtered list).
- Zero customers reads «٠ عملاء», which is why `pluralizeCustomer` treats 0 like
  3–10 instead of like 11+ (`pluralizeChicken` does the opposite).
- The design labels the row number `-2`; we render `٢.` per the Phase-7 fix
  ("sequence numbers as `١.` not `-1`").
- With seed data the farm has 5 customers, so the empty state only shows on a farm
  with none.
