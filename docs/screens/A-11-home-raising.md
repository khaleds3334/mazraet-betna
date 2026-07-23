# A-11 — Admin Home (Raising Phase)

**Route:** `/admin` (the raising branch of the admin home)
**Figma node:** 3228:3543 (`A-11_Home_Raising`)
**FR:** FR-7 (age) · FR-19 (expenses) · FR-22 (feed) · FR-23 (mortality)
**States:** Raising (this file). The same page also routes to A-10 (no cycle), A-20 (selling), A-21 (ended).

## What it does
The dashboard the admin sees while a cycle is still growing (before selling). Shows the cycle's identity and its live numbers — losses, expenses, age — plus the feed section (available / withdrawn / required + a consumption grid) and the record actions. The "start selling" button stays disabled until the flock reaches selling age.

## Data
**Reads:** `getActiveCycleDashboard(farmId)` — the active cycle joined with its mortality, expenses, feed purchases, and feed withdrawals, all aggregated. Returns `phase` (`raising`/`selling`/`ended`) so the home renders the right dashboard.
**Writes:** تسجيل نافق opens the record-mortality popup (A-14) → `recordMortality`. تسجيل مصاريف opens the expense sheet (A-15) → `addExpense`/`addFeedPurchase`. سحب شكارة opens the "امتي فتحت الشكارة؟" popup (A-13) → `addFeedWithdrawal`.

## Calculations
- Age = `chickAgeDays(start_date)` (whole days).
- Expenses total = `cycleAccounting` → chicks + feed + manual expenses (FR-19).
- Required bags = `expectedFeedBags` (بادي / نامي).
- Available = purchased − withdrawn (`feedBagsAvailable`); withdrawn = `feedBagsWithdrawn`.
- Grid = a day calendar (`CYCLE_TOTAL_DAYS` ≈ 40 squares) that grows **upward from the bottom-left**: day 1 is the bottom-left square, days run left→right along the bottom row, newest days stack on top. A square lights up on each day a bag was withdrawn (`withdrawn_on − start_date`).
- Sale-ready = age ≥ raising period (enables "start selling").

## Feed withdrawal model (new)
`feed` records purchases only; a new `feed_withdrawal` table records consumption — one row per opened 50kg bag (سحب شكارة = one unit), each stamped `withdrawn_on`. Manual log, chosen by Khaled over an age-derived estimate (see D-17). The consumption grid is a **day calendar** of the whole cycle (~40 days): a square lights up on any day a bag was withdrawn. Migration `007`.

## Components
Admin components live under `components/admin/home/` (the dashboard) and
`components/admin/cycles/` (create/empty). Dashboard: `RaisingDashboard`
(composer) · `CycleHeader` · `CycleStatCard` (hero tile) · `FeedGrid` · `ChickIcon`
· `RecordMortalityButton` (A-14 popup) · `RecordExpenseButton` (A-15 sheet) ·
`RecordFeedWithdrawalButton` (A-13 popup) · `StartSellingButton`.
New (ui): `Modal` (centered popup) · `ActionButton` (the reusable compact pill —
danger/outline — for record actions). Reused: `StatItem` · `NumberStepper` (new
`tone="danger"`) · `Button` · `BottomSheet` · `Icon`.

## Icons
`cycle` (eggs) · `mortality` (skull) · `payment` (money-send) · `calendar` · `chick` (bird) · `calendarStart` · `expenseEdit` (note-edit) · `add` · `settings`.

## Connected screens
← from: login / PIN (admin lands on `/admin`), the bottom-nav "الرئيسية" tab.
→ to: `/admin/settings` (gear), and later A-13/14/15 (the action sheets), A-20 (start selling).

## Watch out
- The screen only shows for a cycle in the **raising** phase (sale not open, not ended). A selling-phase cycle shows the A-20 placeholder.
- Numbers are data-driven, not the design's mock values (المطلوب, المتوفر… all computed).
- "بدء مرحلة البيع" is blurred + inert before day ~30 (Phase 7 rule).
