# A-10 — Admin Home (First Time, No Cycle)

**Route:** `/admin`
**Figma node:** 3218:2263 (`A-10_Home_NoCycle_FirstTime`)
**FR:** FR-4 (cycle is the root of everything the admin does)
**States:** NoCycle (this file) · CycleRunning → hands off to A-11+ (placeholder for now)

## What it does
The admin's landing page. With no active cycle it welcomes the owner by name and
invites them to start their first cycle. Once a cycle is running it will show the
running-cycle dashboard (A-11+, a later screen — placeholder today).

This screen also establishes the **admin app shell**: the bottom nav (4 sections)
and the toast host, both mounted once in `(admin)/layout.tsx`.

## Data
**Reads:** farm (owner name + id, via `getCurrentFarm`) · whether an active cycle
exists (`hasActiveCycle`).
**Writes:** none.

## Components
New: `AdminBottomNav` · `AdminNavIcon` · `EmptyCyclesIllustration`
Reused: `Icon` (settings gear) · `Toaster`

## Icons
Bottom nav (bespoke SVGs, `AdminNavIcon`): home (dashboard-square) · orders (note)
· customers (user-group-03) · cycles (dashboard-sync). Header: `settings`.

## Layout / shell
- Settings gear top-left (the inline end in RTL) → `/admin/settings`.
- Greeting centered; illustration + description centered in the remaining space;
  the CTA pinned near the bottom.
- Bottom nav: الرئيسية · الطلبات · العملاء · الدورات. Active tab differs by COLOR
  only (dark green vs muted) — not a filled silhouette like the customer nav.

## Feedback
No write actions on this screen, so no toast/inline error yet.

## Connected screens
← from: `/pin` (admin login lands here)
→ to: "ابدأ سجل اول دورة" opens the create-cycle sheet (A-41) **in place** ·
   gear → `/admin/settings` (A-70 — stub) · nav → orders / customers / cycles (stubs)

## Watch out
- The greeting name comes from `farm.owner_name` (migration 005, applied to the
  live DB). Greeting falls back to "أهلا بيك 👋" when it's null.
- The seed has an active cycle, so the test admin sees the CycleRunning
  placeholder, not the empty state. To preview A-10, use a farm with no active
  cycle (e.g. set `is_active = false` on the seeded cycle).
- Spelling fix applied to the CTA: `ابدء` → `ابدأ`.
