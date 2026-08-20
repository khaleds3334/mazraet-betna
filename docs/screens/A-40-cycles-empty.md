# A-40 — Cycles (Empty)

**Route:** `/admin/cycles`
**Figma node:** 3251:4475 (`A-40_Cycles_Empty`)
**FR:** FR-4
**States:** Empty (this file) · List → A-42 (placeholder for now)

## What it does
The cycles tab. When the farm has **never** registered a cycle (no active and no
ended ones) it shows this empty state: the archive illustration, a short
explainer, and the CTA that opens the create-cycle sheet (A-41) **in place**.
Once any cycle exists it shows the list (A-42) instead.

## Data
**Reads:** current farm (`getCurrentFarm`) · `listCycles` — the same read the list
uses, and an empty result *is* this state. (It replaced a `hasAnyCycle` count: two
reads answering one question, where the second already implies the first.)
**Writes:** none directly (the create sheet writes).

## Components
`CyclesEmptyState` — this state lifted out of the page so the page stays the list.
Reused: `EmptyCyclesIllustration` (same as A-10) · `CreateCycleLauncher` (opens
A-41 in place) · the shared `AdminBottomNav` from the layout (الدورات tab active
by pathname — no per-screen work).

## Connected screens
→ "ابدأ سجل اول دورة" opens the create-cycle sheet (A-41) in place.
   After a cycle is created, `router.refresh()` swaps this to the list placeholder.

## Watch out
- Spelling fixes applied vs. the design: `ابدء` → `ابدأ`, `إدرتها` → `إدارتها`.
- Almost identical to the A-10 home empty state; both reuse the illustration + CTA
  components rather than duplicating them. If a third similar empty screen appears
  (tracking/history/orders), consider extracting a shared `EmptyState` (ui) then.
