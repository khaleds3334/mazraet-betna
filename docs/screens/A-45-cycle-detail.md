# A-45 — Cycle Detail

**Route:** `/admin/cycles/[cycleId]`
**Figma node:** 3281:4095 (A-46, 3281:4581, is the same screen with other data)
**FR:** FR-19 (cycle accounting), FR-20 (debt), FR-22 (feed), FR-23 (mortality),
FR-24 (weight distribution)
**States:** Filled · NotFound (404) · Loading

## What it does
A finished cycle, whole: what it earned and cost, how long it ran and how many
birds it lost, the feed it ate day by day, and the spread of weights it came in at.

**Read-only by design.** A closed cycle is a record — everything that can still be
*done* to a cycle lives on the running one's row in the list (A-44).

## Data
**Reads:** `getCycleDetail(farmId, cycleId)` — six parallel reads scoped to the one
cycle, then all the arithmetic through `/lib/calculations`, so these figures and
the cycles list's are the same numbers by construction. Returns null when the id is
not this farm's, and the page turns that into a 404 rather than an empty screen
that implies the cycle exists. `getCycleExpenses` backs the tappable expenses tile.
**Writes:** none.

## Calculations
- `cycleAccounting` — income, expenses, net profit
- `sumInvoices` — income and debt from the orders' own lines and payments (D-05)
- `averageChickenWeight` and `weightDistribution` — two readings of one list, the
  weights that actually went on the scale
- `buildFeedSummary` — shared with the running dashboard (see below)

## The weight pie — read this before changing it
Four bands, red (came in light) through dark green (heaviest), the boundaries and
wording straight from the design.

**The counts sit in the legend, not on the wedges** — a deliberate departure from
the mock. A band holding four birds out of three hundred is a sliver a few pixels
wide; «٤ فرخات» printed on it would be unreadable at best and clipped at worst, and
this admin reads it standing up. In the legend every number is the same size
whatever its band is worth, and the wedge keeps its one job: the shape at a glance.

Empty bands stay in the legend at «٠ فرخة» — "nothing came in under a kilo and a
half" is a sentence worth reading.

## Components
New: `cycles/detail/CycleDetailHeader` · `cycles/detail/WeightDistribution`
Moved to `admin/shared` because this screen needs them too (T-49): `FeedGrid` ·
`FeedWithdrawalDetail`
Reused: `BackButton` · `Badge` · `CycleStatCard` · `StatSection` · `StatItem` ·
`ChickIcon` · `CycleExpensesCard` (the tile opens A-47 here as well)

## Icons
`cycle` (eggs) · `calendarStart` · `debt` · `income` · `cash` · `weight` ·
`ordersNew` (border-full) · `mortality` · `calendar` · `arrowRight` (BackButton)

## Watch out
- **Both Tailwind class names are spelled out in `WEIGHT_BANDS`** — `bg-error`
  *and* `fill-error`, never one derived from the other. Tailwind finds classes by
  reading the source, so a name assembled at runtime is a name it never generates:
  the legend swatch would show and the matching wedge would come out blank. That
  bug was live for one build here; don't reintroduce it.
- **No «العلف المتوفر» tile.** What is left in the store stops meaning anything
  once the cycle is over, so the feed row is المطلوب and المسحوب only — which is
  what the design draws.
- **`buildFeedSummary` is shared with `getActiveCycleDashboard`.** The FIFO rule
  that decides whether an opened bag was بادي or نامي is subtle enough that two
  copies of it would eventually disagree; it lives in `queries/cycles.ts` and both
  callers pass their own rows in.
- A cycle that ended under water shows «صافي الربح» in red, same rule as the list.

## Connected screens
← from: the cycles list (A-42), a finished row
→ to: the expenses sheet (A-47), in place · back to `/admin/cycles`
