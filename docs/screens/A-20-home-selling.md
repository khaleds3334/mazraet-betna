# A-20 — Admin Home (Sale Open)

**Route:** `/admin` (the selling branch of the admin home)
**Figma node:** 3248:3029 (`A-20_Home_SaleOpen`)
**FR:** FR-11 (sale open) · FR-12 (order tabs) · FR-19 (cycle accounting) · FR-20 (debts) · FR-26 (current price)
**States:** Selling (this file). The same page also routes to A-10 (no cycle), A-11 (raising), A-21 (ended).

## What it does
The dashboard the admin sees once the sale is open. Three headline badges (kilo
price · sale state · flock age) sit above three sections of stat tiles: the
flock (available / sold / requested), the money (income / expenses / debts /
cash / average weight), and the orders (new / in progress / completed).

Read-only by design — there is no record action on this screen in Figma. The
admin's write actions during selling happen inside the order screens (A-50+).

## Data
**Reads:**
- `getActiveCycleDashboard(farmId)` — the shared cycle read (phase, age, chick
  count, mortality, expenses).
- `getSellingStats(farmId, cycleId, { chickCount, mortalityCount })` — one pass
  over the cycle's non-cancelled orders (with lines and payments), plus
  `getFarmSettings` for the live kilo price.

**Writes:** none.

## Calculations
- `availableChickens` — flock − mortality − delivered birds − birds booked in
  running orders. Committed birds are subtracted so the same bird is never sold
  twice; this is the number FR-11's auto-close watches. **Khaled, 2026-08-18.**
- `تم بيعها` counts birds in **delivered** orders only. **Khaled, 2026-08-18.**
- `المطلوبة` counts birds in orders that are still running (pending / weighed /
  ready) — the complement, so the three tiles never double-count a bird.
- `sumInvoices` — income (sum of invoice totals), collected (sum of payments),
  debt (income − collected, floored at 0).
- `averageChickenWeight` — mean `actual_weight` across every weighed line.
- Order counts come from `ADMIN_ORDER_TABS`, so the tiles and the order tabs can
  never drift apart.

## Components
New (admin/home/selling): `SellingDashboard` (composer) · `SellingHeader` ·
`RevealableStatCard`.
New (admin/home/shared): `StatSection` (titled block, also adopted by A-11).
New (ui): `Badge` (primary / accent / danger / success tones).
New (layout): `SettingsGear` — the gear link, previously duplicated on three
admin screens.
Extended: `CycleStatCard` gained `tan` / `olive` tones, `raised` (shadow on/off)
and `blurred`, so one tile component serves A-11 and A-20.

## Icons
`chickensAvailable` (store-verified-02) · `chickensSold` (tick-double-03) ·
`chickensRequested` (timer-01) · `income` (money-bag-02) · `payment`
(money-send-flow-01) · `debt` (wallet-03) · `cash` (wallet-02) · `weight`
(weight-scale-01) · `ordersNew` (border-full) · `ordersProcessing` (knives) ·
`delivered` (package-delivered-01) · `settings`.

## Connected screens
← from: A-11 "بدء مرحلة البيع" (`startSelling` flips the cycle into this phase).
→ to: `/admin/settings` (gear). A-21 once the cycle ends.

## Watch out
- **اجمالي الدخل is blurred until tapped** (Khaled, 2026-08-18): the whole tile
  is the toggle, so the tap target is the full 100px card.
- Cancelled orders are excluded from every figure — they hold neither birds nor
  money.
- The money tiles show the **bare number, no `جنيه`** (D-20) — as Figma draws
  them; the section heading carries the meaning. The price badge above still
  goes through `formatCurrency`, so it keeps its unit.
- Spelling fixed against Figma (Phase 7): "جنية" → "جنيه", "الطلبات الجديد" →
  "الطلبات الجديدة".
- **Open gap:** the design has no "إنهاء الدورة" action anywhere in the selling
  phase, so nothing currently moves a cycle from `selling` to `ended`. Flagged
  for Khaled — it likely belongs on A-20 or A-21.
