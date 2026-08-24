# C-30 — Tracking, nothing running

**Route:** `/tracking`
**Figma node:** 3158:4861 (bar variant: Component 63)
**FR:** FR-29, FR-30
**States:** Empty (sale open) · Empty (sale closed) — the status cards C-31→C-35 are not built yet

## What it does

Tells the customer they have no order in progress, and offers the one thing
worth doing next. What that is depends on the sale:

| Sale | Body | Button | Goes to |
|---|---|---|---|
| Open | الفراخ الطازجة متوفرة الان يمكنك الطلب قبل انتهاء فترة البيع | اطلب فراخ طازجة دلوقتي | `/order` |
| Closed | الفراخ الطازجة غير متوفرة الان يمكنك الطلب عند بدء مرحلة البيع | شوف حالة البيع | `/` |

The design only draws the open reading. The closed one is Khaled's call
(2026-08-24): «اطلب فراخ طازجة دلوقتي» is a dead end when there is nothing to
order, so it points at the home screen, where the countdown lives.

> Khaled first asked for «عرفني لما يبدء البيع». That needs a real subscription —
> a column, a migration, and a hook into «بدء البيع» in the admin app — so it was
> deferred rather than faked. See PROGRESS.

## Data

**Reads:** `countActiveOrders(customer.id)` · `getActiveSaleState(customer.farmId)`
**Writes:** none

## Components

New: `TrackingEmpty`
Changed: `BottomNav` — grows the «الطلبات السابقة» button on this section
Reused: `actionBase` / `actionOutline` / `actionPrimary` · `ComingSoon`

## The bar is taller here

The design puts «الطلبات السابقة» **inside the bar**, above the tabs and under
the same top border — Component 63, which C-35 uses too, so it belongs to the
whole tracking section and not to the empty state. `BottomNav` renders it when
the path is under `/tracking`.

That makes the bar 74px taller than elsewhere. `<main>` pads for the plain bar
(`--spacing-nav`), so this page owes the difference (`--spacing-nav-extra`).
Both numbers are measured, not assumed: 143.6px with the button against 70px
without.

## Layout

Content is centred in whatever height is left between the top of the page and
the top of the bar, on any phone (Khaled's ask). `my-auto` and not
`justify-center`, so that on a screen too short to hold it the centring
collapses to zero and the page scrolls normally instead of pushing the top of
the block above the scroll.

## Images

`/images/empty-tracking-crate.png` — 220×152 as rendered. Pulled from the Figma
component and cropped to the frame the design crops it to.

## Connected screens

← from: the «تتبع الطلب» tab
→ to: `/order` (sale open) · `/` (sale closed) · `/history` (from the bar)

## Watch out

- Do not put a `<br />` inside the Arabic heading — an RTL editor reorders it
  into the tag. Two `block` spans instead.
- When the status cards land, they replace the `ComingSoon` branch, and the bar
  button stays for all of them.
