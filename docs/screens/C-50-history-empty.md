# C-50 — Previous orders, empty

**Route:** `/history`
**Figma node:** 3185:4869
**FR:** FR-29
**States:** Empty (sale open) · Empty (sale closed) — the list C-51/C-52 is not built yet

## What it does

Tells the customer they have no finished orders yet. "Finished" means
**delivered or cancelled** — a cancelled order still belongs in history, so a
customer whose only order was cancelled has a list, not an empty state.

## No bottom bar

This screen is walked into, not tabbed to: a back button at the top and no bar
at all. Two halves have to agree on that:

- `BottomNav` stands itself down — `/history` is in its `SCREENS_WITHOUT_NAV`.
- The page takes back the room `<main>` reserves for the bar with `-mb-nav`,
  so the block centres against the real bottom of the screen and not 70px above
  it. The safe-area half of that padding is deliberately left alone — content
  should still clear the home indicator.

**Back goes to `/`.** Every link in the app `replace`s and the stack is kept one
deep (`BackGuard`), so there is no previous entry to return to — home is the
consistent answer even when the customer arrived from the tracking bar.

## Data

**Reads:** `countPastOrders(customer.id)` (new) · `getActiveSaleState(customer.farmId)`
**Writes:** none

## Components

Reused: `PageHeader` (title + back button) · `EmptyOrders` · `ComingSoon`

`EmptyOrders` is shared with C-30 — same crate, same shape, same call to
action, and only the second line of the heading differs, so the two screens are
one component rather than two near-copies. It was `TrackingEmpty` until this
screen made it the second use.

> Figma draws the two blocks 3–6px apart in their inner gaps (illustration→text
> 24 vs 21, heading→body 10 vs 16). That is drift in the file, not intent; the
> component keeps C-30's numbers for both.

## Layout

Header and caption sit at the top; the block below is centred in what is left,
with `my-auto` so a screen too short to hold it scrolls normally instead of
pushing its top out of reach.

The caption is held to a 180px measure so it breaks over two lines the way the
design draws it. It carries **no** `px-screen` — the padding would eat into the
measure and push it onto a third line.

## Connected screens

← from: the tracking bar · home · the sidebar
→ to: `/order` (sale open) · `/` (sale closed, and the back button)

## Watch out

- Adding another bar-less customer screen means adding it to
  `SCREENS_WITHOUT_NAV` **and** giving the page `-mb-nav`. Miss the second and
  the screen keeps 70px of dead space at the bottom.
