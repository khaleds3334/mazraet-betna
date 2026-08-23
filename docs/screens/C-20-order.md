# C-20 → C-25 — Order Screen (اطلب الان)

**Route:** `/order`
**Figma nodes:** C-20 `3855:1329` (current) · counter `3906:13771` · trays `3895:13770`
· day strip `3155:4275` · slot list `3155:4717` · confirm bar `3155:4389` · C-25 `3155:4735`
**FR:** FR-26 (price on show) · FR-27 (place an order) · FR-11 (sale open / birds left)
**States:** Empty · Filled · ConfirmVisible · DayStrip · SlotList · SaleClosed · SoldOut · Error · Success

## What it does

The customer picks how many birds, roughly what weight, whether they are cleaned,
and when he is coming to collect. Confirming books the order in "pending"
(auto-confirmed — D-02) and swaps the form for the success screen.

## Data

**Reads:** `getOrderForm(farmId)` — one server read composing settings (kilo
price, cleaning fee, weights, pickup slots), the sale state, and the birds still
available. The bird count comes from the `available_chickens` RPC, **not** a
query — see T-59.
**Writes:** `placeOrder()` → one `orders` row + one `order_line` per bird (D-13).

## Rules that live here

- **One weight for the whole order.** FR-27 allows several weight lines and the
  design draws no way to add one; it puts the case in the note's own example
  («عاوز فرختين لوحدهم و ٣ لوحدهم») and the split is made later at the scale
  (FR-14ب). Same resolution as the admin's A-56.
- **The counter stops at what is left of the flock** (Khaled, 2026-08-23). A
  toast says how many that is. The action re-checks on submit, because the form
  was drawn at an earlier minute.
- **A slot that has gone by today is not offered.** The day decides the slots;
  changing the day clears a slot the new day does not have (D-65).
- **The last bookable day is the sale's closing day** — a pickup cannot be booked
  for a day the farm has stopped selling for.
- **Price is stamped at order time**, not at weighing (T-15 as amended): the
  customer pays what he was quoted.

## Components

**This screen** (`/components/customer/order/`): `OrderForm` · `OrderHeader` ·
`ChickenTray` · `CountPicker` · `WeightPicker` · `PickupPicker` · `PickupField` ·
`ConfirmBar` · `OrderSuccess`

**Shared with the admin app** (`/components/shared/`) — all extracted from a
second copy that already existed on A-56 or A-70:
| | Also used by |
|---|---|
| `WeightChoice` — pick one weight for an order | A-56 add-order sheet |
| `OrderNote` — the dashed «اضافة ملاحظة» disclosure | A-56 add-order sheet |
| `DayStrip` · `SlotList` — the two pickup panels | (built for reuse) |

**New in the design system** (`/components/ui/`):
| | Why |
|---|---|
| `WeightRow` | the titled scrolling badge row + its arrow — under `WeightChoice` **and** settings' `WeightsRow` |
| `ToggleCard` | the warm switch card — under `FarmSaleCard` **and** the cleaning switch |

**Reused as-is:** `Stepper` (new `variant="counter"`) · `StepButton` ·
`WeightBadge` · `Badge` · `Button` · `PageHeader` · `BackButton` ·
`DashedAddButton` · `TextareaField` · `InlineError` · `Icon`

**Hooks:** `useScrollDirection` (the confirm bar) · `useSound` (the hen)

**Tokens added** (`globals.css`): `--shadow-soft` · `--shadow-panel` ·
`bleed-screen` · `bleed-screen-flush` · `lime-scrollbar`

## The tray

**Fourteen** WebP images in `/public/images/tray/` (`tray-00` → `tray-13`), all
rendered at once and cross-faded by opacity so counting has no lag. Thirteen also
stands for "more than thirteen". See D-66.

The Figma frames are 136×108 but the birds spill up to 6px past them and that
spill is solid bird, not shadow — so the exports came back at seven different
sizes. They were re-canvassed onto one 415×342 sheet with every frame's own box
at the same place, and the component draws the sheet slightly larger than its
136×108 layout box so the overhang bleeds. Verified against the tray rim:
thirteen of fourteen pixel-identical.

## Icons

`dateTime` (day field) · `arrowDown` (slot field) · `close` (remove note) ·
`arrowLeft` (success header)

## Feedback

- Success → the C-25 screen replaces the whole screen (not a toast, not a route),
  and a hen cackles: `/sounds/order-success.mp3`, unlocked on the tap and played
  a round trip later (`useSound`).
- Failure → **toast**, not an inline error. A deliberate exception to rule 11 /
  T-09 for this screen only — see **T-60**.
- Counter ceiling → info toast naming what is left; the previous one is dismissed
  first so presses don't queue.
- Sale closed / sold out → inline error above the confirm bar, said before the
  form is filled in rather than after the tap.

## Connected screens

← from: Home (`/`) · bottom-nav «اطلب الان»
→ to: C-25 → `/tracking/[orderId]` (stub) · header chevron → `/`

## Watch out

- A closed sale does **not** redirect. The customer sees the prices and the
  button refusing, because home is where a closed sale is announced (C-12) and
  bouncing him off a tab he tapped explains nothing.
- The success screen is in-place state, so the browser's back button cannot
  resubmit.
- `SlotList` really scrolls, and the lime bar down its edge is a real scrollbar,
  not decoration — the design draws six slots in a box that holds four and a
  half. `lime-scrollbar` styles it, which also stops Chrome hiding it until the
  list is touched.
- **RTL flips DOM order**, and it caught this screen four separate times: the
  price badge, the tray, the cleaning card and the slot list all shipped
  mirrored. In a row the *first* child lands on the right; in a `flex-col`,
  `items-start` is the right edge and `items-end` is the left.
- Time is read on the **farm's** clock (`farmToday`, `Africa/Cairo`), never the
  server's — half these calls run on a machine set to UTC.

## Still open

- **A-70 does not edit the pickup slots.** The six are seeded (D-65); changing
  them needs a settings UI.
- **`settings.default_cleaning` has no UI either** — the column decides whether
  cleaning starts switched on and only the database can change it.
- **The clock anchors behind the slot names are estimates** — review (D-65).
- **`/tracking/[orderId]` is a stub**, so «تتبع حالة الطلب» lands on a
  placeholder.
