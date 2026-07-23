# A-15 — Record Expense

**Trigger:** "تسجيل مصاريف" on the raising dashboard (A-11)
**Figma node:** 3248:2973 (feed variant) · 3248:2818 (other variant)
**FR:** FR-18 (manual expenses) · FR-22 (feed) · FR-19 (cycle total)
**States:** one per category chip (feed / utilities / medicine / other)

## What it does
A bottom sheet to record a cycle expense. Category chips switch the form:
- **العلف** — records a feed purchase: starter (بادي) and grower (نامي) bag counts + per-bag price. Writes `feed` rows and raises العلف المتوفر.
- **مياه وكهرباء** — two bills: الكهرباء (optional meter start/end in كيلو وات + سعر الفاتورة) and المياه (سعر الفاتورة). Each non-empty bill is its own `expense` row; the meter reading is kept in the electricity row's description.
- **أدوية** — اسم العلاج + السعر → `expense`.
- **أخرى** — التفاصيل (سبب المصروف) + السعر → `expense`.

All feed into the cycle's expenses total on read (FR-19).

## Data
**Reads:** the active cycle's feed figures (passed in from the dashboard) for the العلف form's cards + pre-filled bag counts.
**Writes:** `addFeedPurchase` (→ `feed`) · `addExpense` (→ `expense`) in `lib/actions/expenses.ts`.

## Components
New (ui): `Chip` (reusable selectable pill). New (admin/home): `ExpenseSheet`
(chips + form routing) · `FeedExpenseForm` · `UtilitiesExpenseForm` (electricity +
water bills) · `SimpleExpenseForm` (أدوية/أخرى — category-aware description label) ·
`RecordExpenseButton` (launcher). Reused: `BottomSheet` · `CloseButton` ·
`NumberStepper` · `StatItem` · `Button` · `InputField` (`suffix` prop).

## Feedback
Success: `تم تسجيل العلف` / `تم تسجيل المصروف` (toast) — then the sheet closes and the dashboard refreshes. Amount validation is inline under the field.

## Watch out
- The بادي/نامي split is UI-only; `feed` stores bags + price, not the phase.
- Category chips are ordered feed-first so العلف lands on the right in RTL.
