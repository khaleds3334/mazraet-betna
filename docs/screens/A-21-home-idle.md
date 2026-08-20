# A-21 + A-22 — Admin Home, Between Cycles

**Route:** `/admin` (the face shown when no cycle is active and the farm has history)
**Figma node:** 3248:3465 · A-22 summary card 3248:4033 (in place: 3248:3714)
**FR:** FR-19 (cycle profit), FR-20 (debt), FR-4 (start the next cycle)
**States:** OneCycleOfHistory (no chart) · TwoOrMore (chart) · SummaryOpen · Loading

## What it does
The farm has run cycles but nothing is running now. The screen reports where the
last cycle landed, what the farm is still owed, how the recent cycles compare, and
offers the only thing worth doing from here — starting the next one.

## Data
**Reads:** `listCycles(farmId)` — the same read the cycles list uses, so the two
screens can never disagree about a cycle's profit. From it:
- the last cycle = `cycles[0]` (the query orders newest first, and none is active);
- `farmDebt` = every cycle's debt added up;
- the chart = the newest three, reversed so they read forward in time in RTL.

`getCycleEstimateBasis` feeds the create-cycle forecast (T-46).
**Writes:** none — the CTA opens the create-cycle sheet (A-41), which owns its write.

## Calculations
- `daysSinceEnd` (query-side, `daysSince`) — how long ago the last cycle closed.
  Components never read the clock: a number rendered from `Date.now()` inside a
  component depends on when React happened to run.
- Profit / expenses / debt come pre-computed on `CycleListItem`.
- `averageWeight` was added to that type for the chart — computed from lines the
  query already had in hand, so it costs nothing extra.

## The chart — read this before changing it
Three series per cycle: **متوسط الاوزان · الربح · المصاريف**. They are not the same
kind of number — an average weight is ~٢ and a cycle's expenses are ~٢٢٠٠٠. On one
shared scale the weight bar is a fraction of a pixel: present in the data, invisible
on the screen.

So **each series is scaled against its own tallest bar** (Khaled, 2026-08-20). Every
colour then answers the question the chart is actually for: *which cycle did better
at this?* Bars carry no printed numbers, as the design draws them — the figures live
in the `<figcaption>` for screen readers — and behind a tap: **the whole bar group
is a button** that opens that cycle's summary (A-22), because three ~18px bars are
not a target for someone standing up.

**One cycle is not a comparison.** Measured against itself every bar stands full
height and reads as "everything was at its best", so the chart is hidden below two
cycles.

## Components
New: `home/idle/IdleDashboard` · `home/idle/CycleComparisonChart` (client — it owns
which summary is open) · `home/idle/CycleSummaryDialog` (A-22) ·
`home/idle/FirstTimeWelcome` (A-10, lifted out of the page so `page.tsx` is only a
router between the four faces)
Reused: `CycleStatCard` (raised tiles) · `Badge` (tone `accent` — the orange pill) ·
`Modal` · `Icon` · `ChickIcon` · `SettingsGear` · `CreateCycleLauncher`

## Icons
`income` (money-bag) · `payment` (money-send-flow) · `debt` (wallet-03) ·
`weight` (weight-scale-01) · `calendar` · `calendarStart` · `settings`

## Feedback
No writes. The CTA's sheet carries its own.

## Connected screens
← from: admin bottom nav · ending a cycle from the list (A-44) lands here
→ to: A-41 create-cycle sheet, in place

## Watch out
- **The debt tile is the whole farm's**, not the last cycle's (Khaled, 2026-08-20):
  with nothing running, the question is who still owes him, not which cycle it came
  from. Profit and expenses *are* the last cycle's — the line above them says so.
- **The label reads «ربح الدورة», not «الربح الشهري»** — the Phase-7 fix.
- **A cycle can end under water.** Ending early, or selling short, gives a negative
  profit; the label stays «ربح الدورة» and the tone turns red, because green on a
  loss reads as a win. The sign itself needed a fix in `format.ts`: a minus is a
  bidi-neutral character and Arabic-Indic digits are "Arabic numbers", so the two
  never bind and `-١٩١٥٩` renders as `١٩١٥٩-`. `formatArabicNumber` now wraps a
  negative in an LTR isolate (U+2066…U+2069).
- **«منذ ٠ يوم» is not something anyone says** — 0 reads «النهاردة», 1 reads
  «امبارح», and the design's «منذ ١٢ يوم» takes over from two days back.
- A-10 (first time, no cycles at all) and this screen are two different faces:
  `cycles.length === 0` picks between them.
- **A-22 has no close button**, as the design draws it — the card asks nothing and
  the scrim dismisses it. Don't add one.
- The summary writes «جنيه» and a 3-decimal weight (`formatCurrency` /
  `formatWeight`), not the design's «جنية» and `٢.٣٥` — rules 5 and 6 win over the
  mock's typo.
