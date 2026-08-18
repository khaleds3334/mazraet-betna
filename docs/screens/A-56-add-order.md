# A-56 — Add Order (Admin)

**Opened from:** the "اضافة طلب" button on A-50 (`/admin/orders`)
**Figma node:** 3295:12081 (the sheet itself is 3295:12306)
**FR:** FR-12 (an order is confirmed on creation) · FR-13 (orphan order) ·
FR-14ب (weight splitting happens later, at weighing) · FR-5 (weights and cleaning
come from settings)
**States built:** default · customer picked · "لحد تبع" open · validation error ·
saving

## What it does
The admin books an order himself — for a walk-in, or for a customer who phoned.
It is a **sheet that fills the screen**, not a route: the orders list stays
mounted behind it and comes back the moment it closes (Khaled: "نافذة بس كأنها
صفحة").

Fields: the customer · two flags · how many birds · cleaning on/off · the
approximate weight · a note. The order is saved as `pending`, so it lands under
الجديدة straight away — there is no approval step (D-02).

## Data
**Reads:** `listFarmCustomers(farmId)` (the picker's list, loaded once with the
screen) · `getFarmSettings(farmId)` (available weights + whether cleaning is on
by default).

**Writes:** `createOrder` → one `orders` row + one `order_line` per bird (D-13).
No price is stamped: `unit_price` / `cleaning_price` are snapshotted at weighing
(T-15), so a price change before the birds go on the scale still applies.

## The two flags
- **طلب يتيم** — no customer at all (FR-13). Ticking it clears and disables the
  picker, so the two can never disagree. `customer_id` stays null; the admin
  links a customer later.
- **لحد تبع العميل؟** — the birds are for a relative of the customer. Ticking it
  opens a name field, saved to `orders.on_behalf_of` (Khaled, 2026-08-18). The
  money and the debt stay on the known customer; the name only records who the
  birds were for.

## Calculations
None. One weight covers every bird in the order; different weights inside one
order are a weighing-screen concern (FR-14ب), which is what the note field's
placeholder hints at.

## Components
New (ui): `Checkbox` · `Toggle` · `WeightBadge` · `TextareaField`.
New (admin/orders): `AddOrderSheet` · `AddOrderLauncher` · `CustomerPicker`.
Extended: `BottomSheet` gained `size="full"` (a sheet that covers the screen and
drops the rounded top edge); `Button` gained `variant="outline"`, which reuses
the `actionOutline` recipe that already existed.
Reused: `Stepper` (the same `− ١ +` control as the open-sale dialog) ·
`InputField` · `CloseButton` · `InlineError`.

## Icons
`search` (search-02) · `check` (tick-02, inside a ticked box) · `close` ·
`addOrder` (layer-add, on the launcher button).

The weight badge is a bespoke design SVG, not a Hugeicons name — the library has
no kettlebell, and it needs a fill that follows the selected state (T-19).

## Feedback
Success: `تم تسجيل الطلب` (toast) + the sheet closes and the tab counts refresh.
Failure: **inline error inside the sheet**, which stays open with everything the
admin typed — same treatment as the create-cycle sheet (A-41).
Validation (no customer and not orphan · "لحد تبع" with no name · no weight)
renders in the same inline error.

## Connected screens
← from: A-50 orders list.
→ to: A-50 (the new order appears under الجديدة). The second button,
"تأكيد الطلب ووزن الفراخ", saves exactly like the first until the weighing screen
(A-52) exists — then it will save and go straight there (Khaled, 2026-08-18).

## Watch out
- The customer results list under the search box is **not** in Figma — it is the
  smallest addition that makes the box usable, approved 2026-08-18.
- If the `order_line` insert fails, the order row is deleted again — a bird-less
  order would render as an empty card in the list.
- There is no availability check (FR-11) on this screen: the design shows none,
  and the admin books against a flock he can see.
