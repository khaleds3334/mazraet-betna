# A-34 / A-35 — Register & Edit Customer

**Route:** no route of its own — a sheet over `/admin/customers`
**Figma node:** 3281:7204 (تسجيل عميل جديد) · 3301:2607 (تعديل بيانات العميل)
**FR:** FR-8 (add a customer), FR-16 (correct customer details)
**States:** Empty · Filled · Submitting · Error

## What it does
Two frames, one form: name + phone + a save button. Registering a walk-in or a
caller (A-34), and correcting either field later (A-35). Both are the same
`CustomerSheet`; passing a `customer` switches it to edit mode, which changes only
the title, the button label, and the starting values.

## Data
**Reads:** nothing — the row already has the customer it's editing.
**Writes:** `addCustomer(name, phone)` · `updateCustomer(id, name, phone)` in
`lib/actions/customers.ts`. Both revalidate `/admin/customers` and `/admin/orders`
(the add-order sheet reads the same customer list).

## Validation
- Name: Arabic only, at least 2 characters — the same rule as the customer's own
  registration screen, because the admin reads no Latin
- Phone: exactly 11 digits; the input strips anything else as it's typed
- The phone is unique per farm (`unique (farm_id, phone)`). A number the farm
  already has is refused **by name** — "الرقم ده مسجّل بالفعل لـ محمود الخياط" —
  so the admin knows who holds it, not just that it's taken. The unique-violation
  code is handled too, for two saves racing each other.

## Components
New: `CustomerSheet` · `AddCustomerLauncher` · `EditCustomerButton`
Reused: `BottomSheet` · `CloseButton` · `InputField` · `Button` · `InlineError` ·
`shared/PenGlyph`

## Feedback
Success: toast — `تم تسجيل العميل` / `تم تعديل بيانات العميل` — then the sheet
closes and the list refreshes.
Failure: **inline error inside the sheet**, which stays open with everything the
admin typed still in it. Not a toast: he'd have to retype both fields if it
vanished unseen.
The button shows a spinner and is disabled while the action is in flight.

## Connected screens
← from: A-30 toolbar «اضافة عميل» · the pen on an opened customer row
→ to: back to A-30, refreshed

## Watch out
- A customer added here has **no login** (`auth_user_id` stays null). It's created
  and linked the first time they sign in with that number (D-14) — so the admin
  adding someone never blocks them from logging in later.
- Editing never moves orders, payments or debt: they hang off the customer's id,
  not their phone.
- The pen's tap area is grown to 44px with an invisible inset rather than padding —
  padding would stretch the 22px name line and shift the row's layout.
- `BottomSheet` sets `pointer-events` explicitly on both layers. It has to: this
  sheet is mounted inside the row's pass-through layer, and `pointer-events` is
  inherited, so the sheet would otherwise render perfectly and ignore every tap.
- The design left-aligns the phone value in A-35; we keep `InputField`'s
  right-aligned text so the field behaves exactly like the login screen's phone
  field, which these same users already know.
- The sheet's height is content-driven (`size="auto"`), not the ~70% of the screen
  the Figma frame is drawn at — the frame's empty lower half carries nothing, and a
  shorter sheet leaves room for the keyboard.
