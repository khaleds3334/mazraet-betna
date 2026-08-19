# C-Comp — Logout Confirmation (sheet)

**Route:** none of its own — a sheet over the customer sidebar (C-14) and over
admin settings (`/admin/settings`)
**Figma node:** 3654:3966 (component: `C-Comp_Logout_Popup`, 2932:4986)
**FR:** —
**States:** Closed · Open · SigningOut

## What it does
Asks before signing out. It used to happen on the first tap, with nothing in
between.

**Why confirm at all:** signing out is one tap away from a full stop for these
users. The customer is often elderly and getting back in means typing a phone
number again; the admin needs a 6-digit PIN he may not have to hand while
standing at the scale. The cost of an accidental tap is far higher than the cost
of one extra tap on purpose.

## Data
**Reads:** nothing.
**Writes:** `signOut()` — clears the Supabase session and redirects to `/login`.

## Components
New (shared): `LogoutButton` — the red trigger row **and** its sheet, in one
component, so the customer app and the admin app cannot drift apart on the
wording or the glyph.
Reused: `BottomSheet` · `ActionButton` (danger + primary) · `Icon` (`logout` →
`Door01Icon`, already the design's `door-01`).
No new tokens: `#1a443d` is `text-ink`, `#c65a5a`/`#fee3e3` are `error` /
`error-surface`, `#d9f99d` is `primary`.

## Feedback
Success: **no toast** — the login screen replacing the app *is* the confirmation,
and there is nowhere left to render one.
In flight: the خروج button shows its spinner and both buttons stop responding,
via `useFormStatus`. The session write is not instant, and a second tap in that
window would fire the action twice.
Failure: nothing to show — `signOut` redirects, and a failure to reach the server
leaves the user exactly where they were, still signed in.

## Connected screens
← from: customer sidebar C-14 · admin settings A-70
→ to: `/login`

## Watch out
- **Departures from Figma, and why:**
  - The two buttons are drawn 152px + 150px wide. That is 302px of buttons inside
    24px gutters — more than a 320px screen has to give, so they share the row
    with `flex-1` instead.
  - The trigger row gets `min-h-11`. Figma draws it at its 24px glyph height,
    which is under the 44px touch-target rule, and on the settings screen this is
    an admin control.
  - `ActionButton` carries a faint olive border on its lime variant where Figma
    draws the border in the fill colour. Reusing the house button is worth more
    than a 1px tone that cannot be seen — and Figma treats these as the same
    `Button` component too.
  - The design's scrim is `black/50`; the shared `BottomSheet` uses `black/25`
    everywhere. Left alone — changing it would move every other sheet in the app.
- **The door icon leads the word خروج** (Khaled, 2026-08-19), the way every
  other `ActionButton` in the app carries its icon. It is still written into the
  children rather than passed as the `icon` prop, only because the design draws
  it at 16px where the prop renders 20px.
- **A-70 does not draw a sign-out row.** Its placement on the settings screen is
  Khaled's call (2026-08-19): the same row as the sidebar, at the bottom of the
  page. When A-70 is built it keeps that position, under «حفظ الاعدادات».
- Signing out now needs client JS, where the plain `<form action={signOut}>` did
  not. That was already true of every sheet in the app — `BottomSheet` renders
  nothing before hydration.
