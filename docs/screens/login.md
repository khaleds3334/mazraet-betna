# Login — تسجيل الدخول (C-01→C-03 / A-01→A-03)

**Route:** `/login`
**Figma node:** 2913:3418 (Empty) · 2913:3424 (Active) · 2913:3442 (Error)
**FR:** FR-1, FR-3
**States:** Empty · Active (typing) · Error · Loading (button spinner)

## What it does
One shared phone-entry screen for both apps. The user types a mobile number and
presses "دخول"; the system decides — from the number alone — where they go next.

## Data
**Reads:** `farm.owner_phone` (is this the admin?) · `customer.phone` (known customer?)
**Writes:** on a known customer's first login, creates their `auth.users` account
and links it via `customer.auth_user_id`, then creates a session cookie.

## Routing after "دخول"
- **Farm owner number** → `/pin?phone=…` (admin enters the 6-digit PIN).
- **Known customer** → signed in → `/` (customer app).
- **Unknown number** → `/register?phone=…` (self-registration, "نورتنا لأول مرة").

## Auth mechanism (no OTP — D-01 / D-14)
No verification code. A customer's password is a server-only HMAC of the phone
(keyed by `SUPABASE_SECRET_KEY`), reproduced on the server to sign them in.
Gives a real `auth.uid()` session for RLS (T-13) with a phone-only experience.

## Components
New: `Button` · `InputField` (both shared, in `/components/ui`)
Reused: —

## Feedback
- Validation (not 11 digits) → inline under the field: `معلش، اتأكد إنك كاتب رقم الموبايل صح (١١ رقم).`
- Login failure → inline: `حصلت مشكلة في الدخول، حاول تاني.`
- Never a toast — login feedback belongs to the field (rule 11). Button shows a
  spinner and disables while the action is in flight (no double submit).

## Connected screens
← from: app entry / middleware redirect
→ to: `/pin` · `/register` · `/` (customer home)

## Watch out
- Phone stays Latin digits (the FR-3 exception); the "١١ رقم" count is Arabic.
- Input caps at 11 digits and strips non-digits as the user types.
- Middleware protects every non-auth route and bounces signed-in users off `/login`.
