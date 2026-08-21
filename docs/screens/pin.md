# Admin PIN — الرقم السري (A-04→A-06)

**Route:** `/pin?phone=…`
**Figma node:** 3195:24618 (Empty) · 3218:2198 (Filled) · 3218:2236 (Error)
**FR:** FR-1
**States:** Empty · Filled · Error · Loading (button spinner)

## What it does
The second step of admin login. Login sends the farm owner here. Shows the phone
they came with, takes a 6-digit PIN, verifies it, signs the admin in, and enters
the dashboard.

## Data
**Reads:** `farm` (id, owner_id) by `owner_phone`
**Verify:** `verify_admin_pin(farm_id, pin)` — a SECURITY DEFINER SQL function that
does the bcrypt compare inside Postgres and is executable **only by the service
role**, so the browser can't brute-force it (migration 004).
**Writes:** on first admin login, creates the owner's `auth.users` account and
links `farm.owner_id`, then creates the admin session cookie.
Action: `verifyPin(phone, pin)` in `/lib/actions/auth.ts`; session plumbing in
`/lib/auth/session.ts`.

## Components
New: `PinInput` (shared — six boxes, each its own input, Arabic-Indic digits)
Reused: `BackButton` · `Button`
New token: `--text-h3` (28px, the PIN digits)
Asset: `/public/images/flag-egypt.svg` — the round Egypt flag next to the phone,
exported from Figma (3561:2585). A plain image, not a Hugeicon, so it renders
through `next/image` rather than `<Icon>`.

## Feedback
- Wrong PIN → boxes turn red + centered message above the button
  `تم إدخال رقم سري غير صحيح`. Incomplete PIN → `اكتب الرقم السري كامل (٦ أرقام).`
- Inline, never a toast. Button shows a spinner and disables while verifying.

## Connected screens
← from: `/login` (owner's number) · back button → `/login`
→ to: `/` (admin dashboard) on success

## Watch out
- No `phone` query param → redirect to `/login`.
- PIN digits render Arabic-Indic (FR-3 — a PIN isn't a phone number); the value
  compared/hashed stays Latin.
- Forgotten PIN = reset from the DB, no in-app recovery (D-12).
- Dev seed: admin phone `01000000000`, PIN `١٢٣٤٥٦`.
