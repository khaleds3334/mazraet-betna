# A-42 → A-44 — Cycles List

**Route:** `/admin/cycles`
**Figma node:** 3251:4475 (empty, A-40) · 3275:3514 (list, no running cycle) ·
3270:2839 (list with a cycle in التربية) · 3279:3796 (the row in البيع, A-44)
**FR:** FR-4 (one cycle at a time), FR-19 (cycle profit), FR-20 (debt),
FR-22 (feed), FR-23 (mortality)
**States:** Empty · List · ListWithRaisingCycle · ListWithSellingCycle · Loading

## What it does
The farm's whole history, newest first — one row per cycle. Each row says what the
cycle was, how long it ran, on how many chicks, what it cost, what it lost, what it
earned, and what is still owed on it. The cycles behind the running one are
read-only summaries; the running one carries what can still be done to it, and how
much of that depends on its phase:

| | التربية (A-43) | البيع (A-44) |
|---|---|---|
| Figures | نافق · مصاريف | نافق · مصاريف |
| Actions | تسجيل مصاريف · تسجيل نافق | + العلف · سحب شكارة · **انتهاء فترة البيع** |
| Debt line + arrow | yes | no — nothing left to walk into |

## Data
**Reads:** `listCycles(farmId)` — every cycle with `durationDays`, `mortalityCount`,
`expensesTotal`, `netProfit`, `debt`. Five flat queries scoped to the farm (cycles,
mortality, expenses, feed, orders) joined in memory, so the page costs the same with
twenty cycles as with two. `getActiveCycleDashboard` supplies the running cycle's
feed to the expense sheet; `getCycleEstimateBasis` feeds the create-cycle forecast,
and is only read when that sheet can open.
`countOpenCycleOrders` gates the end-of-cycle button.
**Writes:** `endCycle` — the only write this screen owns. The record buttons are the
dashboard's own components (`recordMortality`, the expense sheet, the feed
withdrawal).

## Calculations
- `cycleDurationDays` — closed: start → the day it ended; running: start → today
- `expensesTotal` / `netProfit` = `cycleAccounting` — chicks + feed + expenses
  against the sum of the cycle's invoices
- `debt` = `sumInvoices().debt` — income minus what was actually collected, never
  negative, cancelled orders excluded (FR-15)

Nothing is stored pre-totalled (D-05): a corrected weight moves the profit on the
next read.

## Components
New (screen): `CycleRow` · `CycleRowStat` · `RunningCycleControls` ·
`EndSellingButton` · `CyclesToolbar` · `CyclesEmptyState`
New (shared — T-49): `admin/shared/RecordActions` (the تسجيل مصاريف / تسجيل نافق
pair) · `admin/shared/FeedTracker` (the three feed tiles + سحب شكارة) ·
`ui/ConfirmActions` (the confirm/الغاء pair in a dialog's foot)
Moved up to `admin/shared` because this screen needs them too: `ChickIcon` ·
`RecordMortalityButton` · `RecordFeedWithdrawalButton` · the whole `expenses/`
family
Reused: `Badge` · `Icon` · `AddButton` · `Button` · `Modal` · `InlineError` ·
`Skeleton` · `StatItem` · `CreateCycleLauncher` (new `compact` shape)

## Icons
`calendar` (duration) · `calendarStart` (dates) · `mortality` (skull) ·
`payment` (money-send-flow) · `income` (money-bag) · `debt` (wallet-03) ·
`openDetails` (arrow-left-02 — the long shaft, new) · `filter` · `addCycle`

## Feedback
Ending a cycle is critical (T-09): failure is a **persistent inline error inside the
dialog**, never a toast; success is `تم انهاء الدورة` and the list refreshes with the
cycle now in its finished form. Open orders render as an inline error *before* he
commits, with the confirm disabled — see D-36. The record buttons keep their own
feedback. The funnel is drawn but inert, exactly as on A-50 — no picker design yet.

## Connected screens
← from: admin bottom nav · the A-10 home CTA
→ to: a **finished** cycle opens `/admin/cycles/[cycleId]` (A-45, placeholder for
now) · a cycle in **التربية** goes to `/admin` — the home dashboard *is* that
cycle's page, so a second copy would only be a copy to keep in sync (D-34) · a
cycle in **البيع** leads nowhere: everything it can be asked is on the row

## Watch out
- **«انشاء دورة جديدة» appears only while nothing is running.** A farm raises one
  flock at a time (FR-4), so offering a second mid-cycle offers something the app
  must then refuse. The design leaves the whole toolbar out on A-43.
- **The row is a stretched link, not a wrapper** — the running row holds buttons,
  and a link may not contain them. Content layers are `pointer-events-none`;
  `RunningCycleControls` takes its taps back with `relative`. Same pattern as
  `CustomerRow`.
- **«ربح الدورة» only exists on a finished cycle.** While a cycle is running its
  sales are still arriving, and a half-earned number reads as the final one — so
  the running row shows two figures, not three, exactly as the design draws it.
- The number beside the calendar is the cycle's **duration in days** (Khaled,
  2026-08-20), not the flock's age. It carries an `sr-only` label because the
  design gives it no visible one.
- Row figures are bare numbers, no «جنيه» — same call as the dashboard tiles
  (D-20); the label above each one already says what kind of number it is. The
  debt line, which has room, uses `formatCurrency` in full.
- The row number renders `٣-` like `CustomerRow`, not `٣.`. The Phase-7 fix
  ("sequence numbers as `١.` not `-1`") applies to both screens and should land on
  both at once.
- **`href` carries the footer with it.** The debt line and the arrow are one
  block, and both only mean something on a row you can walk into — so the selling
  row, which has no destination, has neither. Don't split the two.
- **«انتهاء فترة البيع» is the only way a cycle ends** (D-36), and it is refused
  while any order is still open. The count is checked twice: once to render the
  dialog, once inside the action, because a customer can order in between.
- The demo data (migration `014`) puts two finished cycles behind the running one;
  both ran 39 days, like the design.
