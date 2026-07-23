# A-41 — Create Cycle (Bottom Sheet)

**Route:** opens over `/admin/cycles` (not its own URL)
**Figma node:** 3264:2451 (`A-41_Cycles_CreateNew`)
**FR:** FR-4
**States:** Empty · Filled · Submitting · Error

## What it does
A bottom sheet (slides up over a dimmed, blurred backdrop — same treatment as the
customer sidebar) that registers a new cycle: name, start day + time, chick count
and price. Opening the sheet prefills today's date/time and a name from the
current month/year ("دورة يوليو ٢٠٢٦") — the admin usually starts a cycle the same
day they register it. Two live-computed cards preview the feed needed and the
expected expenses. "تسجيل" creates the farm's single active cycle (FR-4).

## Data
**Reads:** current farm (`getCurrentFarm`) · whether a cycle is already active
(`hasActiveCycle`, to refuse a second one).
**Writes:** `createCycle` action → inserts one `cycle` row (is_active = true).

## Calculations
- `expectedFeedBags(count)` → { بادي, نامي } bags, rounded to the nearest **half**
  bag (e.g. `3.5`) for a more accurate estimate than rounding up to a whole bag
  (⚠️ provisional — per-chick kg amounts pending review).
- `estimatedCycleExpenses(count, price)` = chick cost + expected bags ×
  `ASSUMED_FEED_BAG_PRICE` (⚠️ provisional — no real feed bought yet).
- Display: `formatBags()` shows one decimal only when there's an actual half-bag
  ("٤" stays whole, "٣.٥" shows the fraction) — number first, then the bag type,
  the two groups separated by "/" ("٤ بادي / ١٤.٥ نامي").

## Components
New (ui, shared — all reusable beyond this screen): `BottomSheet` · `StatItem` ·
`CloseButton` · `PickerField` (date/time field, base-input active/error states,
icon on the right) · `NumberStepper` (centered count field + step button, per the
design's `justify-center` — matches Figma node 3264:2480 exactly) ·
`AddButton` (the standalone "+" — a 44×44 visible square, no separate touch
wrapper; sized to the exact glyph from node 3264:2480, not the smaller ~32px one
seen in the full-sheet export. `NumberStepper` composes it, but it's exported
on its own since other counters will want just the button).
New (admin): `CreateCycleSheet` · `CreateCycleLauncher`.
Reused: `Button` · `InputField` · `InlineError` · `useToast`.

## Icons
From the central map (`/lib/icons.ts`), like everywhere else: `cancel` (close,
via `CloseButton`) · `dateTime` (the date field) · `arrowDown` (time chevron).
The only bespoke SVG is the filled `ic:round-plus` inside `AddButton` — an
Iconify glyph the Hugeicons free pack lacks (same rationale as T-19).

## Feedback
Success: `تم تسجيل الدورة` (toast) — cycle creation isn't a critical action.
Failure: inline error inside the sheet (keeps the message visible; sheet stays open).
Blocked: a cycle is already active → inline `فيه دورة شغالة بالفعل…`.

## Connected screens
← from: the A-10 home CTA ("ابدأ سجل اول دورة") opens the sheet **in place**, and
   the `/admin/cycles` "إنشاء دورة جديدة" button — both via `CreateCycleLauncher`.
→ after success: sheet closes, `router.refresh()`, `/admin` reflects the now-running cycle.

## Decisions beyond FR-4 (asked Khaled)
- **Cycle name** stored (nullable `cycle.name`, migration 006).
- **Start time** kept alongside the date (nullable `cycle.start_time`).
- **Stat cards** computed now with provisional formulas — numbers/terminology
  pending Khaled's review.

## Watch out
- Date/time use the OS-native pickers under a styled box (Figma look, native UX);
  a polished custom Arabic picker (C-23/C-24 style) is a later, shared follow-up.
- Only one active cycle per farm (DB unique index) — the action checks first.
