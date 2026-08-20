# A-47 — Cycle Expenses

**Opens from:** the «مصاريف الدورة» tile on every screen that shows a cycle's
figures — the raising dashboard (A-11), the selling dashboard (A-20), the idle
home (A-21, where it is labelled «اخر المصاريف»), and the cycle detail page (A-45,
not built yet).
**Figma node:** 3292:7564 (in place: 3292:7341)
**FR:** FR-18 (record an expense), FR-19 (cycle accounting)
**States:** Filled · Loading (arrives with the page — see below)

## What it does
Opens the one number a dashboard has room for. Four columns —
**الصنف · العدد · السعر · الاجمالي** — with the rows grouped by what they were
spent on, each group closing with its own bold subtotal, and the cycle's whole
spend at the foot.

Read-only. Recording an expense is a different sheet (A-15); this one only answers
"where did it go?", which is the question the tile provokes.

## Data
**Reads:** `getCycleExpenses(cycleId)` — three sources, because that is how the
money was recorded:
| Group | Where it comes from | العدد × السعر |
|---|---|---|
| الكتاكيت | `cycle.chick_count` × `cycle.chick_price` | real |
| العلف | one row per `feed` purchase, labelled by its phase (بادي/نامي, migration 013) | real |
| الأدوية · أخرى | `expense` rows, by category — count × price of one | real (migration 015) |
| المياه والكهرباء | `expense` rows; electricity carries the meter's kilowatt-hours | real (migration 015) |

**Writes:** none.

The total always reconciles with the tile that opened it: it is the same
arithmetic `cycleAccounting` folds into `expensesTotal`, only kept apart by kind
instead of added up. An `expense` row filed under category `feed` is counted with
the bags rather than in a group of its own, so a stray row can't break that.

## Watch out
- **`amount` stays authoritative, always.** `quantity` and `unit_price` explain
  what was paid; they never redefine it. A row's `total` in this table is read
  from `amount`, never from the product — a unit price rounded to piasters must
  not be able to move a figure the cycle's profit is computed from.
- **Electricity's quantity is the meter reading he already types.** The form has
  always asked for the start and end readings (A-17); the difference is the
  kilowatt-hours, and the price per unit falls out of the bill. Nothing extra to
  fill while standing in the shed. Water has no quantity — a bill is one bill.
- **The description is a label, not a sentence** (Khaled, 2026-08-20). It fills the
  الصنف column, ~110px wide on a 360px phone — so it reads «كهرباء», never
  «كهرباء — العداد من ٥٢٠ لـ ١٢٤٠ كيلو وات», which wrapped over four lines and
  pushed the number columns out of alignment. The consumption that sentence spelled
  out is the `quantity` beside it now (migration 016 normalised the rows already
  written). The absolute readings are not kept: only their difference was ever
  used, and nothing reads a running meter across cycles.
- **Rows recorded before migration 015 have neither column** and fall back to one
  at their own price, which is exactly what they were.
- **The breakdown travels with the page, not with the tap.** It is a few dozen
  rows the server has already got the farm open for, and this screen is used with
  both hands busy — a spinner here is a spinner he waits out.
- **The tile is the tap target, not a chevron on it.** A stat tile does not read
  as a control, so the whole card presses.
- Amounts use `formatCurrency` («جنيه»), not the mock's «جنية».
- Long utility descriptions wrap inside the الصنف column (38% of the row). Wrapping,
  not truncating — a lost meter reading is a number he can't reconstruct.

## Components
New: `admin/shared/expenses/CycleExpensesSheet` (the table) ·
`admin/shared/expenses/CycleExpensesCard` (the tile + the sheet, a client island)
Reused: `BottomSheet` · `CloseButton` · `Icon` · `CycleStatCard`

## Icons
`payment` (money-send-flow-01) · `cancel` (inside `CloseButton`)
