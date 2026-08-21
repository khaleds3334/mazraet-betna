# الإعدادات — اعدادات التطبيق و المزرعة (A-70)

**Route:** `/admin/settings`
**Figma node:** 3322:16850
**FR:** FR-5 · FR-11 · FR-26
**States:** لا توجد دورة · دورة في التربية · البيع مفتوح · البيع مقفول مؤقتا

## What it does
The farm's own numbers in one place: the kilo price, the cleaning fee, the
weights a customer may pick from, when the sale starts or ends — and the switch
that stops orders without ending the cycle.

## Data
**Reads:** `getFarmSettings` (price · cleaning · weights · `sale_starts_at`) ·
`getSaleControlState` (which of the four states the sale card is in, and what the
date field means)
**Writes:** `setSaleOpen(open)` → `cycle.sale_open`, immediately (T-47) ·
`saveSettings({...})` → the `settings` row, plus `cycle.sale_closes_at` when the
date field is editing the end of an open sale
Actions in `/lib/actions/settings.ts`.

## Components
New: `PageHeader` (shared — title centred over the screen, back button at the
start; the customer app reuses it) · `FarmSaleCard` (shared — the warm status
card; renders read-only without `onChange`) · `SettingsForm`
Reused: `Stepper` · `WeightBadge` · `PickerField` · `Toggle` (gained a `disabled`
state) · `Button` · `InlineError` · `LogoutButton`
New token: `--color-surface-notice` (#fff1e3, Surface/default 3)

## The sale switch (FR-11, T-47)
Not the cycle's selling phase — that is started and ended from the cycle (A-44).
This only answers "are we taking orders right now":

| الحالة | الزرار | النص تحت العنوان |
|---|---|---|
| مفيش دورة نشطة | مقفول | لا توجد دورة بيع حاليا |
| دورة في التربية | مقفول | الدورة لسه في مرحلة التربية |
| البيع مفتوح | شغال | اقفله عشان توقف الطلبات مؤقتا |
| البيع مقفول مؤقتا | شغال | العملاء مش بيقدروا يطلبوا |

`sale_closes_at` is what separates rows 2 and 3: only the selling phase sets it,
never this switch.

## The date field
One field, two meanings:
- **البيع مفتوح** → «فترة البيع تنتهي في» / `تاريخ انتهاء البيع` →
  `cycle.sale_closes_at`. Auto-set to +٥ أيام when the phase opens.
- **غير كده** → «فترة البيع تبدء في» / `تاريخ بدء البيع` →
  `settings.sale_starts_at`. Empty = derive it (T-48: the rolling estimate).

Which one is being saved rides along in `editingSaleEnd` rather than being
re-derived server-side, so the admin saves the field he was shown even if the
sale closed while he was typing.

## رقم التواصل + تغيير الرقم السري
Neither is in the Figma — both added on request (Khaled, 2026-08-22).

**رقم التواصل** (`farm.contact_phone`, migration 021) is the number customers
ring. Deliberately **not** `owner_phone`, which only routes the admin's login —
otherwise he could not publish a different number without changing the one he
signs in with. Empty falls back to `owner_phone`, which is what every farm
publishes today. Saved on its own button.

**تغيير الرقم السري** (FR-1ب) is collapsed behind a button — it is the one
control here that can lock the admin out, and a forgotten PIN is reset from the
database (D-12). The current PIN is required and is verified **inside** the same
database call that writes the new one (`set_admin_pin`, migration 021), through
the service-role client: `admin_credentials` has no RLS policy (T-14), so no PIN
is ever handled where the browser can reach it. The new PIN is typed twice.

## Prices and old orders
Editing the price never touches an order already taken — an order stamps
`unit_price` / `cleaning_price` when it is **booked** (T-15 as amended,
2026-08-21). Unticking a weight only stops it being offered; orders already
placed at that weight keep it, because the weight lives on the order line.

## Feedback
- Save/toggle success → toast. Failure → **inline** `InlineError` (rule 11): a
  missed toast would leave the admin believing a price he never saved.
- The switch moves on tap and moves back if the write is refused.

## Connected screens
← from: the settings gear (admin home / sidebar) · back → `/admin`
→ affects: the customer home countdown and CTA · admin add-order (weights, price)

## Watch out
- Needs **migrations 019 · 020 · 021**: `sale_starts_at` + raising period → 28 ·
  freezing the price on orders taken before T-15 was amended · `contact_phone`
  and `set_admin_pin`.
- `RAISING_PERIOD_DAYS` moved 30 → 28 (FR-4 still says 30 — the doc is behind).
- Sign-out sits under «حفظ الاعدادات»; the design draws no such row (Khaled,
  2026-08-19).
