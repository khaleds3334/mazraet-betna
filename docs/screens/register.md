# Register — نورتنا لأول مرة (C-04→C-06)

**Route:** `/register?phone=…`
**Figma node:** 2913:3467 (Default) · 2916:3565 (Active) · 2916:3587 (Error)
**FR:** FR-1
**States:** Default · Active (typing) · Error · Loading (button spinner)

## What it does
The self-registration step for a brand-new customer. Login sends an unknown
number here. The screen shows that number (so a typo is caught), takes the
customer's name, creates their account, signs them in, and enters the app.

## Data
**Reads:** the single `farm` (for `farm_id`)
**Writes:** inserts a `customer` (name, phone, farm_id) → creates their
`auth.users` account and links `auth_user_id` → creates a session cookie.
Action: `registerCustomer(phone, name)` in `/lib/actions/auth.ts`.

## Validation
- Name: Arabic letters only, ≥ 2 chars → else inline error
  `أتأكد من ادخال الاسم صحيح باللغة العربية`.
- Phone is re-checked server-side (defense); it arrives from the login step.

## Components
New: `BackButton` (shared — rounded lime square, RTL back arrow)
Reused: `InputField` (error state, right-aligned message) · `Button`

## Icons
`arrowRight` (back, already in the map)

## Feedback
- Validation / failure → inline under the field (registration isn't a critical
  action, but the error belongs to the field, so inline — never a toast).
- Button shows a spinner and disables while the action is in flight.
- Network failure → `مفيش اتصال دلوقتي، اتأكد من النت وحاول تاني.`

## Connected screens
← from: `/login` (unknown number) · back button → `/login`
→ to: `/` (customer app) on success

## Watch out
- No `phone` query param → the page redirects to `/login` (can't register blind).
- Phone displays in Latin digits (FR-3 exception); the name is Arabic, RTL.
- If the admin already added this number as a walk-in, we reuse that row instead
  of inserting a duplicate.
