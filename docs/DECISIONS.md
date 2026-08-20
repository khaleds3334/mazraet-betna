# Decision Log — Mazra3et Betna

> **For Claude Code:** These decisions are **settled**. Do not reopen them or propose alternatives.
> Any new decision made during a session → add it here in the same format.

---

## Product Decisions (settled during design)

### D-01 — Login without verification code
Customer logs in with **phone number only**. Admin uses **phone + a 6-digit PIN**.
**Why:** Users are elderly with low digital literacy — every extra step loses a user. Customer data isn't sensitive; the admin holds prices, invoices, debts, and cycle accounting.

### D-02 — Orders are auto-confirmed
No approve/reject step. An order arrives in "waiting" state immediately.
**Why:** The first stage is **real work**, not passive waiting — the admin waits for the pickup time and verifies the requested weights are in stock.

### D-03 — Labels differ per viewer
The same DB state is labeled **"قيد المراجعة"** in the customer app and **"في الانتظار"** in the admin app.
**Why:** Each side sees the situation from their own angle.

### D-04 — Only the admin edits or cancels an order
The customer **cannot** cancel or edit from the app.
**Why:** Keeps the customer app simple, and prevents cancellation after the chickens have been slaughtered.

### D-05 — No invoice table
An invoice = the order plus its actual recorded weights, **computed on read**.
**Why:** Single source of truth. Any change to weights reflects in the invoice immediately, with nothing to sync.

### D-06 — Order splitting is grouping inside one invoice
Splitting groups weight lines into batches ("الوزنة الأولى/الثانية"), each with its own bag and subtotal.
**The order still has exactly ONE invoice** — one total, one paid amount, one remaining amount. Implemented as a `batch_no` column on `order_line`.

### D-07 — Cash only
No electronic payment — **permanently out of scope**, not deferred.
**Why:** Customers are neighbors and relatives; trust-based dealing is part of how the business works.

### D-08 — Multi-tenant from day one
`farm_id` on every table from the first migration, even though there's only one farm today.
**Why:** Migrating to SaaS (Phase 2) becomes a simple move instead of a rebuild.

### D-09 — Arabic numerals are solved in code, not in Figma
Figma contains a mix of Arabic and Latin digits **deliberately**. Unification happens through a shared formatter.
**Why:** Faster and safer than editing 90 screens by hand.
**Exception:** phone numbers stay in Latin digits.

### D-10 — Temperature is display-only
No automated control — the app shows the expected temperature for the current week and nothing more.

### D-11 — In-app notifications
Not WhatsApp at this stage.

### D-12 — Forgotten PIN means reset, not recovery
The PIN is stored hashed, so it cannot be read back — only reset from the database.

---

## Technical Decisions

### T-01 — Server Actions, not API Routes
All data writes go through Server Actions in `/lib/actions/`.
**Why:** Fewer files, automatic type safety, the modern Next.js default.

### T-02 — No state management library
`useState` + URL params only. No Redux/Zustand/Jotai.
**Why:** All data comes from the server. A state library would add complexity with no benefit.

### T-03 — Calculations separated from UI
Every formula lives in `/lib/calculations/`, never inside a component.
**Why:** One place to change, testable in isolation.

### T-04 — Hugeicons for all UI icons
Use `@hugeicons/react` + `@hugeicons/core-free-icons`. The Figma design uses Hugeicons, so the library guarantees a visual match and eliminates manual SVG export.
**Access through a central map** in `/lib/icons.ts` and the `<Icon>` wrapper — never import icons directly in a screen.
**Why the map:** one place to audit every icon, semantic names in screens, and swapping the library later touches two files instead of ninety.
**Verify icon names** via the Hugeicons MCP server or hugeicons.com before use — never guess.

### T-05 — Self-hosted Almarai
The font lives in `/public/fonts` via `next/font/local`, not a CDN.
**Why:** Faster, and no dependency on an external network.

### T-06 — pnpm as the package manager
Never `npm` or `yarn`. Use `pnpm dlx` instead of `npx`.
**Why:** Faster installs, far less disk usage, stricter dependency resolution that catches missing dependencies early.

### T-07 — Documentation files in English
`CLAUDE.md`, `BUILD-WORKFLOW.md`, `DECISIONS.md`, and screen files are written in English.
**Why:** They are full of technical terms, and the project will be reviewed by a company as a portfolio piece.
**Exception:** `PROGRESS.md` stays Arabic (Khaled reads it daily), and any **literal UI string** stays in Arabic wherever it appears — those are values, not prose, and translating them would introduce errors.

### T-08 — Own the toast system, don't import one
`Toast.tsx` · `Toaster.tsx` · `useToast.ts` built in-house. No toast library.
**Why:** RTL, Arabic text, 56px minimum height, and 4-second duration are all non-default for every library out there. Owning ~100 lines is cheaper than fighting a dependency, and it keeps the bundle clean for a portfolio project.

### T-09 — Critical failures use inline errors, not toasts
Success and low-stakes failures use toasts. Failures in weighing, payment, cancelling an order, and ending a cycle render a persistent inline error next to what failed.
**Why:** A toast auto-dismisses. The admin works standing over a scale with his hands busy and may not be looking when it appears. If a payment write fails and the toast vanishes unseen, he believes it saved — and the debt is silently lost.

### T-10 — Toasts render at the top of the screen
Not bottom.
**Why:** The bottom is occupied by `BottomNav` and gets covered by the keyboard during form entry — which is exactly when feedback matters most.

---

### T-11 — Tailwind v4 + Next.js 16 (scaffold used `create-next-app@latest`)
The project scaffolds on **Next.js 16** and **Tailwind CSS v4** (React 19), not Next 15 / Tailwind v3 as the earlier docs assumed.
**Design tokens live in `globals.css` under `@theme`** — there is no `tailwind.config.ts` (Tailwind v4 moved config into CSS). Usage in components is unchanged: still semantic classes like `bg-brand-500`.
**Why:** `create-next-app@latest` installs the current stable versions; v4 is the 2026 standard, faster, and cleaner for a portfolio piece. The final look is identical — only where tokens are authored changed.
**Date:** 2026-07-22

### T-12 — Supabase modern key naming (publishable/secret, not anon/service_role)
Env vars use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY`, not the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`.
**Why:** Supabase's official 2026 docs recommend the new `sb_publishable_...` / `sb_secret_...` key format — independently rotatable, unlike the legacy JWT-based keys. Legacy keys still work until end of 2026, but new projects should use the new format from day one.
**Project:** `mazraat-baytna` (already created on Supabase, region `eu-north-1`).
**Date:** 2026-07-22

### T-05b — Almarai self-hosted as TTF from Google Fonts repo
Almarai weights 300/400/700/800 downloaded as `.ttf` into `/public/fonts/Almarai`, wired via `next/font/local` in the root layout. Satisfies T-05 (no runtime CDN).
**Date:** 2026-07-22

---

## New Decisions (added during implementation)

> **Format:**
> ### D-XX / T-XX — [Title]
> [The decision in a line or two]
> **Why:** [Reason]
> **Date:** [Date]

### D-13 — `order_line` = one physical chicken
Each order line represents a single chicken, not a (weight × count) group. The customer's approximate weight sits on the line; the admin fills the actual weight on the same line at weighing. A group of "3 chickens at 2 kg" becomes 3 lines.
**Why:** The weighing screen (A-52, FR-14) shows one box per chicken; adding/removing a chicken (FR-14ج) is adding/removing a line; per-chicken cleaning exceptions and per-chicken actual weights need a row each. This is the cleanest match to the most important screen in the project.
**Date:** 2026-07-22

### T-13 — Identity model for RLS
The admin is the farm owner, linked via `farm.owner_id → auth.users`. Each customer links via `customer.auth_user_id → auth.users` (nullable — walk-ins the admin adds have no account until they log in). RLS: admin sees the whole farm; a customer sees only rows tied to their `auth.uid()`. Helper functions (`is_admin`, `owns_customer`, `owns_order`, `my_customer_farms`) live in a non-API-exposed `private` schema and are `SECURITY DEFINER` to avoid RLS recursion.
**Why:** Standard, auditable Supabase pattern; keeps "customer sees only their own data" enforced at the database, not just the app layer.
**Date:** 2026-07-22

### T-14 — Admin PIN isolated in `admin_credentials`
The hashed admin PIN lives in its own table `admin_credentials`, not in `settings`. `settings` is customer-readable (price, weights, pickup times); the PIN table has **no** RLS policy, so only the server's service role can touch it during the auth flow.
**Why:** RLS is row-level, not column-level — if the hash lived in the customer-readable `settings` row, customers could read it. Isolating it keeps the hash unreachable from any client.
**Date:** 2026-07-22

### T-16 — Design tokens flatten Figma's role-based variables into one semantic palette
Figma organizes colors by role (`Surface/*`, `Text/*`, `Border/*`, `Icons/*`) and reuses the same hex across roles (e.g. `#3f6246` is Text/body, Icons/default, and Surface/action 2). In `globals.css` `@theme` we flatten this into one semantic palette (`primary`, `background`, `foreground`, `success`, `error`…), each token commented with its Figma source. Type scale: headings get `--text-h4/h5/h6` (1.2 leading); the p-scale (16/14/18/12) uses Tailwind's matching defaults. Spacing/radius use Tailwind defaults until a component needs an exact value.
**Why:** Avoids ugly doubled utilities (`text-text-body`), keeps the same hex from being duplicated under four names, and reads idiomatically. The rendered result is identical to Figma — only class names differ. Comments preserve design↔code traceability for a designer-led sync.
**Figma map:** admin/dashboard screens under node `4:7`, customer screens under `4:6`. `get_variable_defs` must target a concrete screen frame, not the page/section node.
**Date:** 2026-07-22
**Addendum (2026-07-22):** The app **canvas background is `#fbfdfc`** (`--color-background`), which is a hair cooler than **Surface/page `#fcfff6`** (`--color-surface-page`). They are two distinct roles, not a mistake: the page background is `#fbfdfc` everywhere; `#fcfff6` fills input fields and similar surfaces. Confirmed by Khaled — do not collapse them back into one token.

### D-14 — Phone-only auth without OTP, via a server-derived password
Login has no verification code (honoring D-01). A customer's `auth.users`
password is a deterministic **HMAC of the phone**, keyed by `SUPABASE_SECRET_KEY`
(reused as the HMAC secret — no new env var). The server reproduces it to sign
the user in, so the flow is phone-only for the user yet still yields a real
`auth.uid()` session that RLS depends on (T-13). Synthetic email
`{phone}@customer.mazraetbetna.local` is the auth identifier — avoids needing any
SMS/email provider. Admin-added walk-ins (no `auth_user_id`) get their auth user
created and linked on first login. The admin is detected by `farm.owner_phone`
and still needs the PIN (`admin_credentials`) — the PIN is the real admin secret.
**Why:** The only ways to get an `auth.uid()` session are password or OTP; D-01
rules out OTP, so a server-held deterministic password is the clean fit. Secret
never leaves the server, and customer identity isn't sensitive (D-01).
**Role storage:** the `role` (`customer`/`admin`) is written to **`app_metadata`**
(service-role-only), never `user_metadata` (user-editable) — so route/role gating
can trust it. The row link (`customer.auth_user_id` / `farm.owner_id`) is set from
the actual signed-in user id, so RLS matches even if the auth user pre-existed.
**Date:** 2026-07-22

### T-17 — Admin PIN verified in the database, not in app code
The PIN bcrypt compare runs inside Postgres via `verify_admin_pin(farm_id, pin)`
(SECURITY DEFINER, migration 004), **executable only by `service_role`** — the
browser (anon/authenticated) has no execute grant, so PINs can't be brute-forced
from the client. The server calls it through the service-role client. After a
correct PIN, the admin gets a session via the same no-OTP mechanism as customers
(D-14) — a phone-derived server-only password, keyed `admin:<phone>` and a
separate synthetic email; the owner's auth user is created + linked to
`farm.owner_id` on first login. The PIN stays the human gate; the derived
password is only the session mechanism.
**Why:** RLS is row-level; bcrypt lives in Postgres. A locked-down DB function is
the clean way to check the hash without shipping a bcrypt lib or exposing the
hash. Session plumbing shared with login lives in `/lib/auth/session.ts`.
**Date:** 2026-07-22

### T-18 — Customer app owns `/`, admin app lives under `/admin` (role-based routing)
The route groups `(customer)` and `(admin)` can't both own `/` in Next.js. The
customer app owns the root (`/`, `/order`, `/tracking`, …); the admin app lives
under an `/admin` segment (`(admin)/admin/page.tsx` → `/admin`). After login the
middleware sends each user to their own home based on the `role` in `app_metadata`
(customer → `/`, admin → `/admin`) and blocks each from the other's area. The PIN
screen lands the admin on `/admin`.
**Why:** Resolves the URL collision cleanly, keeps a standard prefix for the admin
app, and reuses the already-trusted `app_metadata.role` (D-14) for gating.
**Date:** 2026-07-23

### T-19 — Bottom-nav icons are project-owned SVGs, not Hugeicons
The free Hugeicons pack is stroke-only, but the bottom nav needs a filled
(active) vs outline (inactive) state per tab. Those exact shapes were drawn in
Figma and exported as SVG into a small `NavIcon` component (`components/layout/NavIcon.tsx`)
that renders one silhouette path + one detail path, filling the silhouette with
`currentColor` when active. This is a deliberate exception to "icons come from
`/lib/icons.ts`" — that rule bars importing Hugeicons directly in screens; bespoke
design SVGs that the library can't provide live in their own typed component.
**Why:** A filled active state is impossible with stroke-only icons, and faking a
fill via CSS breaks monochrome knock-outs (e.g. the `+` on the add-square). The
exported SVGs match the design exactly and still tint via `currentColor`.
**Date:** 2026-07-23

### D-15 — `farm.owner_name` for the admin greeting
The admin home (A-10) greets the owner by name ("أهلا بيك صبري علي 👋"). The farm
row held the farm name and the owner's phone but not the owner's personal name,
so a nullable `owner_name` column was added (migration 005, applied to the live
DB 2026-07-23), seeded `صبري علي` for the demo. It's edited from Settings (A-70)
later. `getCurrentFarm` reads it and the greeting falls back to a name-less
"أهلا بيك 👋" when it's null.
**Why:** The personal greeting is core to the design's warmth; the farm name is a
different thing (`مزرعة بيتنا`). Nullable keeps it optional for farms with no name set.
**Date:** 2026-07-23

### D-16 — Create-cycle (A-41) captures more than FR-4, per the design
FR-4 lists chick count, start date, chick price. The design adds a **cycle name**
and a **start time**, plus two computed cards (feed needed, expected expenses).
Confirmed with Khaled: store the name (nullable `cycle.name`) and the time
(nullable `cycle.start_time`) — migration 006. The two stat cards are computed
**provisionally** (`expectedFeedBags`, `estimatedCycleExpenses` with a tunable
`ASSUMED_FEED_BAG_PRICE`) and flagged for review — the real feed cost only exists
once bags are bought (FR-22). Age is still counted in whole days (start_date); the
time is captured for the record only.
**Why:** The design is the source of truth for UI; the extra fields are cheap and
useful, and Khaled wanted the screen complete now with numbers he can tune later.
**Date:** 2026-07-23

### T-21 — `BottomSheet` reuses the sidebar's scrim
Sheets that slide up (starting with A-41) use a shared `components/ui/BottomSheet`
with the same dimmed + blurred backdrop as the customer sidebar (`bg-black/20` +
`backdrop-blur`), the page left mounted behind it. Date/time inputs use the native
OS pickers under a styled box (the Figma look with native UX); a bespoke Arabic
date/time picker is deferred as a shared follow-up (also needed by the order flow).
**Why:** One backdrop treatment across overlays; native pickers ship the screen now
without building two custom pickers this session.
**Date:** 2026-07-23

### T-20 — Admin bottom nav is its own component, active-by-color
The admin nav (`AdminBottomNav` + `AdminNavIcon`) is separate from the customer
`BottomNav`/`NavIcon`. Its active tab is marked by COLOR only (dark green
`primary-foreground` vs muted `brand-muted`) — the design's admin icons are plain
strokes, not the filled-silhouette active state the customer nav uses. Keeping two
small, single-purpose components is clearer than one branchy file with two
active-state behaviours. The four bespoke nav SVGs live in `AdminNavIcon` (same
rationale as T-19: the free Hugeicons pack can't provide these exact glyphs / a
filled state, so design SVGs get their own typed component).
**Why:** The two navs differ in both icon set and active-state styling; a shared
`variant` prop would mix two behaviours in one file for no real reuse. Settings is
reached from the header gear, so the admin nav is 4 tabs, not 5.
**Date:** 2026-07-23

### D-17 — Feed withdrawal is a manual log (`feed_withdrawal` table)
The cycle dashboard (A-11) tracks feed **consumption** separately from purchase.
The `feed` table stays purchases-only; a new `feed_withdrawal` table records each
opened bag — **one row = one 50kg شكارة** (`bags` defaults to 1). From it:
العلف المتوفر = purchased − withdrawn · العلف المسحوب = withdrawn. The
"تتبع استهلاك العلف" grid is a **day calendar** of the whole cycle — one square
per day for ~40 days (`CYCLE_TOTAL_DAYS`) that grows **upward from the bottom-left**
(day 1 = bottom-left square, days run left→right along the bottom row, newest days
stack on top — Khaled, 2026-07-23), and a square lights up on any day a bag was
withdrawn (`withdrawn_on − start_date`).
Migration `007`, admin-only RLS (mirrors `feed`/`mortality`).
**Why:** Khaled chose a manual "سحب شكارة" action over deriving consumption from
age × a daily rate — the button exists precisely because the admin opens bags by
hand, so the log is the source of truth. The withdraw popup (A-13,
"امتي فتحت الشكارة؟") is now built — `addFeedWithdrawal` writes one `feed_withdrawal`
row per opened bag; the day drives the grid and migration `008` adds `withdrawn_at`
(time) so the bag-detail popup shows the exact moment.
**Bag type (بادي/نامي) — derived by order (Khaled, 2026-07-24):** no per-bag type
column. Bags opened chronologically are بادي until the cycle's required بادي count
(`round(expectedFeedBags.badi)`) is used up, then نامي — the admin's FIFO mental
model ("as long as there's still بادي, whatever I open is بادي"). Assumes بادي bought
≈ بادي required; revisit by storing the type on `feed` if that diverges.
**Bag detail popup (A-13, node 3238:10980):** tapping a lit grid square shows the
bag's number, type, the flock's age that day, and the day + time it was opened.
**Date:** 2026-07-23 (type/time additions 2026-07-24)

### T-22 — Admin home routes by cycle phase; expenses tile shows unit under the value
The admin home (`/admin`) is one page with four faces, chosen from
`getActiveCycleDashboard().phase`: none → A-10 empty · `raising` → A-11 dashboard
· `selling` → A-20 · `ended` → A-21 (the last two are placeholders until built).
The three headline tiles (`CycleStatCard`) render a big value alone — the
unit-under-value idea this decision originally introduced was dropped on
2026-08-18, see **D-20**. The feed "المطلوب" tile
shows بادي/نامي rounded to whole bags (`٤ / ١٤`) to match the design's compact
format; the underlying estimate keeps its halves.
**Why:** One page per role keeps routing simple and reuses the trusted
`app_metadata.role` gate. The unit-under-value pattern reconciles the
non-negotiable "unit always visible" rule with the design's small hero tiles.
**Date:** 2026-07-23

### D-21 — Opening the sale is confirmed, and sets the kilo price (node 3608:3838)
"بدء مرحلة البيع" no longer fires straight away — it opens a confirm dialog that
also asks **سعر كيلو الفراخ؟**, pre-filled with the current price. `startSelling`
now takes the price, writes it to **`settings.sale_price`**, then flips
`cycle.sale_open`.
**Why settings and not a column on `cycle`:** Khaled wants the price editable from
Settings afterwards, and nothing is lost — an order snapshots `unit_price` at
weighing (T-15), so a later change never rewrites an existing invoice (FR-5).
**Write order:** price first, sale flip second — a failed flip leaves the sale
closed and retryable, while the reverse could open the sale at the old price.
**Failure is an inline error, not a toast:** opening the sale is visible to every
customer; an unseen auto-dismissed toast would leave the admin waiting for orders
that can never arrive (T-09).
**Date:** 2026-08-18

### T-25 — Arabic text needs an optical lift when vertically centred
Almarai declares an ascent of **0.905em** but its tallest letters (ا / ل) only
reach **0.716em** — the extra 0.189em is headroom for marks (hamza, dots above)
that most of our UI strings never carry. CSS centres the *line box*, not the ink,
so in any vertically-centred pill or button the text always lands low. Measured
from `Almarai-Bold.ttf`, not eyeballed.
Fix: `--text-lift-ar` in `globals.css` (= half the dead headroom, **0.09em**) and
an `optical-center` utility that `translateY`s the text up by it. It goes on the
text **inside** the box, never on the box, so the box keeps its real height and
only the ink moves; the value is in `em`, so it scales with any font size.
Applied to `Badge` first. Apply it to any future centred pill/button showing
Arabic. Deeper descenders (final ع / م / ي reach −0.38em) argue for up to 0.18em;
0.09em is the conservative, string-independent figure — raise the one variable if
it still reads low.
**Why not asymmetric padding:** the correction has to scale with font size and
apply in several components; one variable plus one utility beats per-component
padding magic numbers.
**Date:** 2026-08-18

### T-24 — `<Icon>` must never force a `strokeWidth`
`HugeiconsIcon` copies whatever `strokeWidth` it is given onto **every** path in
the icon, and adds `stroke: "currentColor"` along with it. Most Hugeicons are
pure strokes so nothing looked wrong — but a few are hybrids whose main shape is
a stroke already converted to outlines (`fill`, no stroke of its own).
`store-verified-02` (الفراخ المتوفرة on A-20) is one: the forced stroke was
painted *around* the already-outlined store body, so it rendered at roughly
double the weight of the checkmark and circle beside it. Our wrapper now leaves
`strokeWidth` undefined unless a caller deliberately passes one.
**Why it's safe:** every icon in the pack carries its own `strokeWidth`, and
1.5 — the value we were forcing — is the standard, so the other 56 registered
icons render byte-identically. Bespoke SVG components (`NavIcon`,
`AdminNavIcon`, `ChickIcon`, `EmptyCyclesIllustration`) set their own widths and
are unaffected.
**Date:** 2026-08-18

### D-20 — Stat tiles show the bare number, no "جنيه" line (supersedes T-22's second half)
`CycleStatCard` no longer renders a unit under the value; the `unit` prop is
gone. The money tiles on A-20 (اجمالي الدخل · مصاريف الدورة · الديون · في
المحفظة) show the number alone, exactly as Figma draws them — the section
heading "الاحصائيات المالية" is what says they are money.
**Why:** Khaled, 2026-08-18. The tile is ~104px wide; a unit line under a
5-digit amount made the tile read as two stacked numbers.
**Scope — this is narrow:** CLAUDE.md rule 5 (every amount carries its unit)
still holds everywhere an amount appears in running text, a field, a badge, a
row, or an invoice. `formatCurrency` is unchanged and still appends جنيه — the
price badge on A-20 uses it. The exception is only these headline tiles, where
the label above the number already carries the meaning.
**Date:** 2026-08-18

### D-18 — The flock ledger on the selling dashboard (A-20)
The three "احصائيات الفراخ" tiles partition the flock with no overlap:
**تم بيعها** = birds in **delivered** orders only (Khaled: a bird counts as sold
when the customer actually takes it). **المطلوبة** = birds booked in orders that
are still running (pending / weighed / ready). **الفراخ المتوفرة** = chick count
− mortality − sold − requested, i.e. what is genuinely still sellable — the
number FR-11's auto-close watches, so the admin can never sell the same bird
twice. Implemented as `availableChickens` in `/lib/calculations/cycle.ts`.
**Why:** Khaled's mental model, and it makes the three tiles add up against the
flock instead of double-counting a bird that is booked but not yet handed over.
**Date:** 2026-08-18

### D-19 — "اجمالي الدخل" is tap-to-reveal, not permanently hidden
The blurred value in the Figma frame is deliberate: the cycle's total income
renders blurred and un-blurs when the admin taps the tile (Khaled). The whole
100px tile is the toggle (`RevealableStatCard`), so the tap target clears the
44px rule; tapping again hides it. Blur = "not for casual eyes / not final" is
now used in two places (this, and the disabled "بدء مرحلة البيع" button), so it
is the project's established treatment.
**Why:** the admin often has the phone visible to customers standing at the
scale; the day's takings shouldn't be readable over his shoulder by default.
**Date:** 2026-08-18

### T-23 — `components/admin/home` split by cycle phase
The admin home folder grew to 14 files covering three different screens, so it
was split: `shared/` (used by more than one phase — `CycleHeader`,
`CycleStatCard`, `StatSection`, `ChickIcon`), `raising/` (A-11 + A-13 + A-14),
`expenses/` (the A-15→A-19 sheet family), `selling/` (A-20). One tile component
(`CycleStatCard`) now serves both dashboards via `tone` / `raised` / `blurred`
props instead of a second near-identical card, and the settings gear became one
shared `layout/SettingsGear` instead of three copies.
**Why:** each admin-home face is a screen of its own; a flat folder made it
impossible to see which file belonged to which screen. The rule going forward:
a sub-feature of a section gets its own folder; anything used by two of them
moves up to `shared/`, and anything used outside the section moves to `ui/`.
**Date:** 2026-08-18

### T-15 — No `invoice` and no `debt` table (both derived on read)
Confirming D-05 at the schema level: the invoice = `orders` + `order_line` (actual weights × snapshotted `unit_price`) + `payment`; the debt = invoice total − sum(payments). Neither is a stored table. The price/cleaning price are **snapshotted onto `orders` at weighing** (`unit_price`, `cleaning_price`) so changing settings later never rewrites an old invoice (FR-5).
**Why:** Single source of truth; reassigning an order to another customer (FR-16) moves its invoice and debt automatically because both derive from the order. Verified against seed data — all totals/remaining computed correctly on read.
**Note:** The `debt` entity listed in BUILD-WORKFLOW Phase 1 is intentionally not a table for this reason; debt computation will live in `/lib/calculations` (Phase 2).
**Date:** 2026-07-22

### D-22 — The orders screen is always scoped to one cycle
`/admin/orders` never shows "all orders ever". It scopes to a single cycle,
defaulting to the **running cycle**, or — when none is running — the **most
recent cycle to end**, so the admin always lands on the orders that still matter.
The funnel in the toolbar picks any other cycle (its picker has no design yet, so
the funnel is drawn but inert for now).
**Consequence — the tabs change meaning on an old cycle (Khaled, 2026-08-18):**
in a finished cycle every order is complete, so `الجديدة` / `قيد التشغيل` are
meaningless there. The groups become **مدفوع / عليه فلوس / ملغي** instead. Those
are derived from the invoice (T-15), not from `order_status`, which is why they
are a later pass — `ADMIN_ORDER_TABS` stays the live set until then.
**Why:** orders belong to a cycle in the database and in the admin's head ("طلبات
الدورة اللي فاتت"); a global list would mix two flocks' accounting.
**Date:** 2026-08-18

### T-26 — The selected order tab lives in the URL, not in React state
**Amended by D-31 (2026-08-19): still in the URL, but no longer a server round
trip.** The reasoning below holds; only the mechanism changed.

`?tab=new|active|done` drives A-50, so the whole screen stays a server component
with no client-side state and no `"use client"` — the tabs are plain `<Link>`s.
Refresh, the back button, and a shared link all land on the same tab. An unknown
or missing value falls back to `الجديدة`.
**Why:** the application of T-02 to a screen whose "state" is really a view of
server data. It also means each tab is a fresh server render, so counts can never
go stale behind a client-side toggle.
**Related:** the tab counts are now one type, `OrderTabCounts`
(`Record<AdminOrderTabKey, number>`) in `queries/orders.ts`, produced by the pure
`tallyOrderTabs` and shared with the A-20 order tiles — they used to be two
different shapes (`fresh/inProgress/completed` vs the tab keys) describing the
same three numbers.
**Date:** 2026-08-18

### D-23 — Adding an order is a full-screen sheet, not a route
"اضافة طلب" opens A-56 as a `BottomSheet` with `size="full"` over the orders
list — a sheet that reads as a page. The list stays mounted behind it and returns
the instant it closes; there is no `/admin/orders/new` URL.
**Why:** Khaled, 2026-08-18 — "نافذة بس كأنها صفحة". It also keeps the list's tab
and scroll position, which a route change would throw away.
**Two flags on it:**
- **طلب يتيم** → `customer_id` null (FR-13). Ticking it clears and disables the
  customer picker so the two can never disagree.
- **لحد تبع العميل؟** → opens a name field written to `orders.on_behalf_of`. The
  invoice, the money, and the debt stay on the known customer; the name only
  records who the birds were actually for.
**The customer results list is an addition, not a design element** — the Figma
frame draws the search box with no results anywhere. Approved 2026-08-18 as the
smallest thing that makes the box usable.
**Date:** 2026-08-18

### T-27 — An order's price is never stamped at creation
`createOrder` writes the order and its lines but leaves `unit_price` and
`cleaning_price` null. They are snapshotted at weighing (T-15), so a price change
between booking and weighing is picked up, while an already-weighed invoice never
moves. The lines carry `approx_weight` only; `actual_weight` arrives on the
weighing screen into the same rows (D-13).
**Also:** if the `order_line` insert fails, the order row is deleted again —
a bird-less order would render as an empty card in the list and read as data loss.
**Date:** 2026-08-18

### D-24 — The order number is `cycle` + `order-in-cycle`
An order shows as `#1004`: the cycle's number (1, 2, 3 … per farm) followed by
the order's number inside that cycle, padded to three digits. Order 4 of cycle 1
→ 1004 (Khaled, 2026-08-18).
Both counters are real columns (`cycle.seq`, `orders.seq`) assigned by a
`before insert` trigger, with a unique index per farm / per cycle — so a number
is never reused and never shifts once the admin has read it out. Migration 009;
010 gives them a default of 0 so code can omit them (0 is the trigger's "unset"
sentinel, since a real number starts at 1). Composition lives in one place,
`formatOrderNumber` in `/lib/format.ts`.
**Why not derive it from the UUID:** it would look random, carry no order, and
could collide. The admin reads this number out loud to a customer.
**Date:** 2026-08-18

### D-03 amendment — a pending order reads "قيد المراجعة" on BOTH sides
The original decision had the admin see "في الانتظار" while the customer saw
"قيد المراجعة". The finished A-50 card (node 3295:9568) labels it
**"قيد المراجعة"** on the admin side too, and Khaled used the same wording when
asking for the card, so `ORDER_STATUS_LABEL.admin.pending` now matches.
The per-viewer split in the label map stays — the wording may still diverge on a
later status, and the customer app reads from the same map.
**Why:** the tab above the card already says "الجديدة"; the pill's job is to say
what is happening to the order, and "قيد المراجعة" says it on both screens.
**Date:** 2026-08-18

### D-25 — A cancelled order lives in the "المكتملة" tab
`ADMIN_ORDER_TABS.done` covers `delivered` **and** `cancelled`. The tab means
"the admin is finished with this order", whichever way it ended (Khaled,
2026-08-18) — FR-12 originally read it as delivered-only, which left a cancelled
order in no tab at all and therefore invisible.
**Why not a fourth tab:** the design's tab row is already at the width of a
320px screen, and a cancelled order is a rare, closed thing — not a working list.
**No effect on the dashboard:** `getSellingStats` filters cancelled orders out
before tallying, so the A-20 "المكتملة" tile still counts deliveries only, and
neither the money totals nor `availableChickens` (D-18) see them.
**The reason is required** and stored in `orders.cancel_reason` (migration 011);
the cancelled card shows it back, because "why didn't this customer get his
order" is exactly what gets forgotten. Cancelling is a critical action, so a
failure is an inline error inside the dialog, never a toast (T-09).
**Date:** 2026-08-18

### T-28 — The list-screen chrome is shared, not redrawn per screen
The green add pill (`ui/AddButton`) and the search box (`ui/SearchField`) are one
component each, used by the orders screen (A-50), the customers screen (A-30) and
the add-order sheet's customer picker (A-56) — three places that had drawn the
same search box by hand. `SearchField` renders a real input when given `onChange`
and static placeholder text when not; `AddButton` renders a real button when
given `onClick` and a plain pill when not.
**Why:** The design draws one add button and one search box for the whole admin
app, so three copies could only drift apart. The two modes exist because a screen
often lands before the thing behind its control does — a static box shows the
right shape without opening a keyboard that leads nowhere, and the same file
becomes live by passing one prop.
**Date:** 2026-08-18

### D-26 — "الآجل" is a filter in the URL, the customer count is only a readout
On the customers screen the «الآجل» pill toggles `?debt=1` and narrows the list
to customers who still owe money (A-31); the «٥ عملاء» pill reports how many rows
are showing and is not tappable. Total debt in the header always covers the whole
farm, filtered or not.
**Why:** Same reasoning as the orders tabs (T-26) — the choice survives a refresh
and the back button, and the screen stays a server component. Keeping the header
total unfiltered means the admin never loses sight of what the farm is owed while
looking at a subset.
**Date:** 2026-08-18

### D-27 — A customer row expands in place; its details are the way into his history
Tapping the top half of a customer row (A-30) opens a summary under it — orders in
the cycle, orders ever, invoiced, paid, and a paid-so-far bar — and tapping the top
half again closes it. Tapping the *opened* details will lead to that customer's
order history (a screen of its own), and the pen on the name line will open the
edit dialog (A-35). Neither exists yet, so both render non-tappable.
**Why:** The list stays scannable while any one customer can be inspected without
leaving the screen — which matters because the admin reads this list while on the
phone with the customer. Splitting "close" (top half) from "go deeper" (details)
keeps one tap from ever doing two things.
**Implementation note:** the toggle is an overlay button stretched across the top
half, with the content layers passing taps through. A wrapper button is impossible
— the WhatsApp and call shortcuts sit inside that area and are links.
**Date:** 2026-08-18

### T-29 — The paid-so-far bar fills from the physical left, not the logical start
`left-0` is deliberate on the row's progress bar: the design puts the «مدفوع»
label at the left end and grows the fill under it, with «إجمالي» at the right end.
**Why:** Everything else in the app is direction-agnostic, so a future cleanup pass
would naturally rewrite `left-0` as `start-0` and silently flip the bar.
**Colours:** green (`brand`) is the paid share, tan (`accent-tan`) the amount still
owed. The Figma export has them the other way round (Line 11 `#3F6246` track,
Line 12 `#CA955D` fill); Khaled settled it as green-is-paid so tan keeps meaning
"debt" everywhere in the app, including on the row above the bar.
**Date:** 2026-08-18

### D-28 — A settled customer reads green, not tan
The wallet and amount are tan while anything is owed and plain green at zero — on
each customer row and on the screen's total. Rendered once in `DebtAmount`.
**Why:** The admin scans this list for who still owes him; colour answers that
before he reads a single digit.
**Date:** 2026-08-18

### T-30 — `ContactLinks` puts the call button before WhatsApp
The pair reads number → call → WhatsApp right-to-left. Corrected from the original
order while building A-30: both designs (order card 3295:9577 and customer row
3281:5648) place the WhatsApp mark to the *left* of the call button, so the earlier
DOM order rendered them mirrored on the order card too.
**Why:** One component, one order, matching the design on both screens.
**Date:** 2026-08-18

### D-30 — An invoice total is whole pounds, rounded once
The order's grand total is rounded to the nearest pound: under 50 piasters is dropped,
50 or over becomes a pound. Per-bird charges and the weights stay exact — only the
total is rounded, and only once (Khaled, 2026-08-19).
**Why round at all:** nobody on this farm hands over change, and the total is spoken,
not shown — a price the customer can repeat back is a price he can check.
**Why not per bird:** rounding each of five birds and then adding can land more than
two pounds away from the sum of what was actually weighed. The number the admin says
out loud has to be the one the scale justifies.
**Where:** `toPounds()` in `lib/calculations/invoice.ts`, so every screen that shows a
total — the weighing sheet, the order card, the cycle's income — agrees by construction.
**Date:** 2026-08-19

### D-31 — A view of a loaded list is a filter, not a fetch
**Covers the orders tabs and the customers screen's «الآجل» filter.** Both keep their
place in the URL; neither goes back to the server for it. Shared mechanism: the
`useUrlParam` hook.

#### The orders tabs
A-50 reads every order of the cycle in one query and renders all three tabs on the
server. `OrdersBrowser` chooses which to show, and pushes `?tab=` with the browser's
own history API rather than the router.
**Why:** a tab used to cost a full trip — `auth.getUser` → `farm` → `cycle` →
`getOrderTabCounts` → `listOrders`, five queries each waiting on the one before it —
and none of it showed on screen, because `loading.tsx` only fires on a route change,
not on a changed search param. Khaled measured one to five seconds of a screen that
looked frozen (2026-08-19). Ordering the queries better would have reached four trips;
it is the trip itself that had to go.
**What this amends in T-26:** its two reasons survive. The tab still lives in the URL,
so refresh, back, and a shared link all land on it. And its worry — counts going stale
behind a client-side toggle — is now impossible by construction rather than by
convention: `tallyOrderTabs` counts the very rows the panels render, from one read.
`router.refresh()` after every write still brings both forward together.
**What it costs:** the whole cycle's orders travel in the first payload instead of one
tab's worth. On a flock's worth of orders that is the right trade — it is paid once,
on a screen that already shows a skeleton, and it buys back every tab press after it.
Should a cycle ever grow past what one payload should carry, the split is per cycle
(D-22), not per tab.

#### The «الآجل» filter
The customers screen already filtered in the browser — `CustomersList` holds every
customer and narrows them by search text *and* by debt. Only the debt half took the
long way round: `?debt=1` re-ran the page through auth → farm → cycle → customers to
fetch the identical rows, so that the browser could then apply a comparison it was
already able to make. The pill took about a second to light up (Khaled, 2026-08-19).
It is now state, still mirrored into the URL.
**What T-32 and D-26 said, and what survives:** "a view worth keeping across a refresh
belongs in the URL; a half-typed name does not." That holds exactly as written — the
filter is still in the URL. What changed is that being in the URL no longer implies a
trip to the server.
**Date:** 2026-08-19

### D-32 — The signed-in user is read from the token, not from the auth server
`auth.getClaims()` replaces `auth.getUser()` in the middleware and in both session
lookups (`getCurrentFarm`, `getCurrentCustomer`). The project signs its JWTs with an
asymmetric key (ES256), so the token is verified locally with WebCrypto against a
cached public key — no network call.
**Why:** every navigation paid for two auth round trips before a single row of its own
data was read — one in the middleware, one in the page's session lookup — and then a
third to find the farm. That tax was on every screen of both apps.
**Why it is not weaker:** `getClaims()` verifies the signature. A forged or edited
token still fails; what goes away is *asking someone else* to check a signature we hold
the key for. This is not `getSession()`, which trusts the cookie unread and must never
be used on the server.
**What still holds:** the middleware call also refreshes the session when the token is
near expiry — `getClaims()` does that first, so the cookie refresh the app depends on
is unchanged. That is why the call stays where it is.
**Caveat:** on a cold serverless instance the key set is fetched once before the first
verification; every request on that warm instance is then local.
**Date:** 2026-08-19

### D-33 — The invoice and the weights table are shared between both apps
`InvoiceSection` and `WeightsSection` live in `components/shared/invoice/`, not under
`admin/`. The admin's invoice sheet (A-63) frames them with its own header; the
customer's order details (C-41 / C-43) will frame them with theirs.
**Why:** they are the same figures read by two people. A second copy under `customer/`
would be two renderings of one bill, free to drift — and the day they disagree, one of
them is telling a customer a number the farm doesn't think it charged.
**What makes it safe:** both are pure views over the `Invoice` that `computeInvoice`
returns (D-05). They hold no state, fetch nothing, and know nothing about who is
reading — so they compose inside a server component in either app.
**Where the line falls:** anything that *acts* stays with its app. «دفع» and «تعديل»
belong to the admin's sheet; the shared parts only display.
**Date:** 2026-08-19

### D-29 — Registering and editing a customer are one sheet, not two
`CustomerSheet` serves both A-34 («تسجيل عميل جديد») and A-35 («تعديل بيانات
العميل»). Passing a `customer` puts it in edit mode; that changes the title, the
button label and the starting values, and nothing else.
**Why:** The two Figma frames are pixel-identical apart from those three things.
Two files would drift the moment either frame changes, and every fix would have to
be made twice.
**Date:** 2026-08-18

### T-31 — A modal sets `pointer-events` explicitly, never inherits it
`BottomSheet` sets `pointer-events-auto` on its scrim and panel when open (and
`-none` when closed) instead of leaving them to inherit.
**Why:** `pointer-events` is an inherited CSS property, and a sheet is mounted next
to whatever opens it. The pen on a customer row lives inside a `pointer-events-none`
pass-through layer (D-27), so its sheet rendered perfectly and ignored every tap
until the property was pinned down. Any future sheet opened from a similar layer is
now safe by default.
**Date:** 2026-08-18

### T-42 — A house order is a flag on the order, not a second kind of record
Birds the family takes for its own house are an ordinary `orders` row with
`is_house = true` and no customer (FR-36). Not a `withdrawal` table beside
`mortality`.
**Why:** the first instinct was a separate record, and reading the code changed
it. `availableChickens()` is `chicks − (mortality + sold + requested)`, so an
order **already** leaves the flock — a separate table would have meant editing
that calculation and every screen that shows «الفراخ المتوفرة», to arrive at the
same number. The flag changes only the money.
It also matches how the user talks: Khaled asked for «الطلبات بتاعة البيت», and
the act is identical to any other order — catch the birds, weigh them, clean
them. A model that mirrors what the person already does needs no learning.
**And it keeps the weight.** A withdrawal record would have been a bare count;
as an order it goes through the same weighing, so «البيت أكل كام كيلو» becomes a
real number instead of a thing nobody can answer.
**No customer, deliberately:** `customer_id` stays null (FR-13 already allows
it), which is what keeps a house order out of every per-customer debt tally
without those queries having to learn the column exists.
**Decided before A-52 is built,** so the weighing screen — the most important in
the project — is written knowing this case, rather than reopened for it later.
**Date:** 2026-08-19

### T-41 — Two installable apps from one origin, told apart by manifest `id`
The site serves two manifests: `/manifest.webmanifest` (`id: "/"`, «مزرعة بيتنا»,
starts at `/`) and `/admin.webmanifest` (`id: "/admin"`, «لوحة التحكم», starts at
`/admin`). The admin route group overrides `metadata.manifest`, the title and the
touch icon, so installing from any admin screen adds the dashboard icon.
**Why:** the father wants the dashboard one tap from the home screen, and his
customers want the shop — the same code, two doors. `id` is what browsers key an
installed app on, so two manifests on one origin install as two separate apps.
**`scope` is `/` on both, not `/admin`:** the sign-in screens live at `/login`
and `/pin`, outside `/admin`. Under the tighter scope the very first launch would
throw the admin out into a browser tab to type the PIN and back again — the app
would leave its own window exactly when that hurts most. Overlapping scope is
allowed; `id` is what keeps them two apps.
**The proxy must never guard a manifest.** The browser fetches one *without*
credentials, so a guarded manifest answers with a redirect to `/login` and the
app silently stops being installable. The matcher excludes `.*\.webmanifest`
rather than the one filename it used to name, so the next manifest is covered
before it is written.
**The limit, and it is not fixable:** two icons are two shortcuts, **not two
sessions**. Both apps are one origin and share one cookie jar, so the phone is
signed in as one person at a time. Opening the customer icon while signed in as
the admin lands on the dashboard, because the proxy sends each role to its own
home. In real use this never bites — the father's phone holds the dashboard, the
customers' phones hold the shop — but on one phone, switching means signing out.
**Date:** 2026-08-19

### T-40 — One z-index tier per kind of surface; no two share a number
The ladder is written down once, in `globals.css`: **40** bottom nav · **45**
sidebar drawer · **50** sheets (`BottomSheet`) · **55** dialogs (`Modal`) ·
**60** toasts. A new surface takes its own number — it never doubles up.

**Amended 2026-08-19:** sheets and dialogs used to share **50**, and the defect
came back exactly as this decision predicts it does. The split dialog, opened from
*inside* the weighing sheet, rendered underneath it. Same shape as the logout sheet
under the sidebar: a tie the browser breaks by DOM order, which no screen controls.
Dialogs now sit above sheets, for the same reason sheets sit above the drawer — a
dialog is opened *from* a sheet and has to be answerable over it.
**Why:** the sidebar and the sheets both sat on `z-50`. Equal z-index is not a
tie the CSS resolves by intent — the browser falls back to DOM order, and an
overlay is opened from whatever button happens to need it, so that order is
never something a screen controls. The logout sheet, opened from *inside* the
sidebar, came out underneath it.
Which side won the tie did not need diagnosing: **the tie itself is the defect**.
Giving the drawer its own tier below the overlays fixes it deterministically, and
would have fixed it whichever way round the symptom had appeared.
**Why the drawer goes below and not the overlays above:** a sheet is opened
*from* the sidebar and has to be answerable while it is open, and the toast tier
already sat above the overlays for the same reason (a validation message fired
from inside an open sheet must be readable). Moving the drawer down touched one
file; moving the other two tiers up would have touched three and re-opened a
relationship that was already correct.
**Sibling of T-36** — same lesson a third time: an overlay must not inherit its
rank from where it happens to be written.
**Date:** 2026-08-19

### T-39 — The proxy file lives in `src/`, and is named `proxy`, not `middleware`
`src/proxy.ts`, exporting `proxy()`. Not `middleware.ts`, and **not at the repo
root** beside `src/`.
**Why:** the root file was silently ignored by the dev server — no warning, no
compile line, no error. `next build` still listed it in the middleware manifest,
so everything looked wired up while **every guarded route answered as though no
guard existed**: an anonymous request to `/admin` rendered the admin home with a
200 instead of being sent to `/login`. It was only caught because a redirect bug
sent us reading the response headers. Moving the file into `src/` made the proxy
run on the first request, and made Next print the deprecation warning that named
the second half: Next 16 renamed the convention, so `middleware`/`middleware.ts`
now only warns, and `proxy`/`proxy.ts` is the current name (`npx @next/codemod
middleware-to-proxy` does the rename; we did it by hand, it is one file).
**Nothing leaked** — every admin page independently calls `getCurrentFarm()` and
redirects to `/logout` when there is none — but that is the second line of
defence, and it was carrying the whole load on its own.
**`/lib/supabase/middleware.ts` keeps its name:** it is Supabase's own file
convention for `updateSession`, not a Next one, and matching Supabase's docs is
worth more than matching Next's new vocabulary.
**Date:** 2026-08-19

### T-38 — Never build a redirect URL from `request.url`
Two forms, one per context, both measured rather than assumed:
- **Proxy** (`/lib/supabase/middleware.ts`): `NextResponse.redirect()` of a URL
  cloned from `request.nextUrl`. Next emits a same-origin proxy redirect as a
  **relative** `Location`, so it is correct on every host.
- **Route handler** (`/logout`): `redirectTo()` from `/lib/redirect.ts`, which
  sets a relative `Location` by hand. A route handler gets no such normalisation
  — it sends the absolute URL it is handed.

**Why:** `request.url` is the address the server was **bound** to. `next dev`
binds to `0.0.0.0` by default, so `/logout` answered
`Location: http://0.0.0.0:3000/login`; 0.0.0.0 means "every interface", not a
destination, and Chrome showed "can't reach this site" on a server that was
working perfectly. Independent of the `Host` header the browser sent — tested.
**And `request.nextUrl` is not the fix in a route handler:** it reports the dev
server's canonical `http://localhost:3000` and does **not** follow `Host`
either — also tested — so on the father's phone over the Wi-Fi it would redirect
the phone to *its own* localhost. The path is the only part the server truly
knows; the browser resolves a relative `Location` against the address it is
already on, which is right from the laptop, the phone, and behind Vercel's proxy
alike.
**Not the dev script.** `-H 0.0.0.0` in `pnpm dev` is exactly the `next dev`
default (`next dev --help`), so removing it changes nothing about this. It is
worth dropping only so the startup banner prints the real LAN IP instead of
`0.0.0.0`, which is the address you need when testing on the phone.
**Date:** 2026-08-19

### T-37 — Every route gets a `loading.tsx` shaped like its own screen
A route folder is not finished until it has a `loading.tsx` beside its `page.tsx`,
built from `Skeleton` / `SkeletonScreen` and laid out like the screen it stands
in for — same frame, same header, same row shape. A route never inherits a
parent's loading face, and a generic spinner is not an acceptable substitute.
**Why:** Next keeps the *old* screen on display until the new one is fully ready,
so on a real phone a tap produced nothing for one to five seconds. The problem
was never the speed — it was the silence, and this admin answers silence by
tapping again, which is the same failure mode the toast system exists to prevent
(BUILD-WORKFLOW §5). A skeleton that matches the screen also stops the layout
jumping when the real content lands. Inheriting a parent's file is worse than
having none: tapping the settings gear would flash a cycle-dashboard skeleton on
the way to a screen that looks nothing like one — so `/admin/settings` has its
own, and every future route does too.
**Second effect, free:** Next only prefetches a dynamic route when it finds a
`loading.tsx` next to it, so the bottom-nav tabs became genuinely instant, not
just visibly busy.
**Applies to the customer app as well** — those screens take their `loading.tsx`
as they are built, not as a sweep afterwards.
**Date:** 2026-08-19

### T-36 — Overlays render through a portal into `<body>`
`BottomSheet` and `Modal` `createPortal` into `document.body` instead of
rendering where they are written (behind `useIsHydrated`, since there is no
`<body>` to portal into on the server).
**Why:** `z-index` only ranks an element against its siblings **inside the same
stacking context**, and a positioned ancestor with a `z-index` creates one. When
the list screens gained a `sticky top-0 z-10` header (T-35), the add-order and
add-customer buttons moved inside it — so their sheets' `z-50` was suddenly
being measured *within* a z-10 header, and the bottom nav at z-40 painted over
them. Raising numbers would have fixed those two screens and left the trap set
for the next one: a sheet is opened from whatever button happens to need it, and
that button can sit anywhere. A portal removes the sheet from every ancestor's
ranking, which is the only arrangement that keeps being true.
**Sibling of T-31** — same lesson from the other direction: an overlay must not
inherit its behaviour from where it was declared.
**Date:** 2026-08-18

### T-43 — A weigh-out is kept on the device until it is saved, never on the server
The weights typed on A-52 are written to `localStorage` under the order's id on every
change, restored when the sheet is opened again, and deleted the moment `saveWeights`
succeeds. Nothing is sent to the server before the admin taps «حفظ الاوزان».
**Why keep it at all:** the admin weighs four birds, the phone locks in his pocket or
he taps the wrong thing, and four weights are gone — so he reweighs birds already in
the bag, or guesses. The paper notebook this app replaces never lost a line
(Khaled, 2026-08-19).
**Why not autosave to the database instead:** a half-weighed order would carry a real
`actual_weight` on some rows and none on others, and every read path — the invoice,
the cycle income, the customer's debt — would be quoting a price for birds that
aren't all on the scale yet. An order not yet priced is safe; an order priced wrong
is money. So the partial state stays somewhere it can't be mistaken for a fact.
**Consequence, accepted:** the draft is tied to one device and one browser. On a farm
with one admin phone that costs nothing, and it is why the restore announces itself
with a toast — weights appearing on their own must not read as "the app saved it".
**Date:** 2026-08-19

### T-44 — The app doesn't let you select text, and refuses to be translated
Two global rules in the root layout, both aimed at the phone.
**No selection:** `body` carries `user-select: none` + `-webkit-touch-callout: none`.
A long press used to paint the word blue and open the "copy / share / search the
web" callout right on top of the button being aimed at. Both our users press and
hold by accident — the admin taps with busy hands while weighing, the customer is
elderly and slow to lift a finger — and neither has any use for copying a label.
Inputs, textareas, selects and `[contenteditable]` opt back in (you can't edit text
you can't put a caret in); anything else that must be copyable one day uses
Tailwind's `select-text`.
**Not the tap highlight:** `-webkit-tap-highlight-color` is deliberately left alone.
It is the only free "I registered your tap" feedback on a slow connection, and rule
11 says every action must be visibly acknowledged.
**No translation:** `<html translate="no" class="notranslate">` plus
`<meta name="google" content="notranslate">`. The interface is already Arabic, but a
customer whose browser auto-translates every page into Arabic gets it re-translated
anyway — machine Arabic over our Arabic, with farm words («دورة», «فرخة», «الآجل»)
coming out as something else entirely, and no prompt to decline it. The three
signals are all read by different browsers, so all three are set.
**Date:** 2026-08-20

### T-47 — The feed table records which feed it was
`feed.phase` (`badi` | `nami`, migration 013). The purchase form always asked for
the two separately and then threw the label away, writing one row per phase with
nothing to say which was which — so the readers inferred it back: bags attributed
بادي-first, on the reasoning that the flock eats بادي first so he buys it first.
**Why change it:** the inference is right most of the time and wrong exactly when
it matters — the cycle he happens to buy نامي early. The form is already asking
him the question; storing the answer is cheaper than reconstructing it, and it is
the pre-filled "what's still to buy" count on A-15 that gets it wrong (Khaled,
2026-08-20).
**Backfill, once:** existing rows get the old rule applied and frozen. Left
nullable, and `purchasedBagsByPhase` still folds nulls in بادي-first, so a
hand-imported row is never rejected for want of a phase.
**Withdrawals keep the inference.** The admin opens a bag; he does not tell the
app which kind, and asking him mid-cycle is the friction the app exists to remove.
Purchases are a form he is already filling in — withdrawals are one tap.
**Date:** 2026-08-20

### T-45 — Every overlay pins its title and its close button; only the body scrolls
`BottomSheet` already took a `header` that stays put while the body scrolls under
it. That is now the rule for **all** overlays, and `Modal` gained the same prop:
the card is capped at `85svh`, the header sits above the scroller, and the body
scrolls inside.
**Why:** the way out must never scroll away. The admin opens «انشاء دورة جديدة»,
scrolls to the chick count, changes his mind — and the ✕ is somewhere above the
top of the sheet. The paper notebook you just close; a sheet with the close
control off-screen reads as stuck, and the recovery he reaches for is the browser
back button, which leaves the screen behind it (Khaled, 2026-08-20).
**Why `Modal` needed a height cap too:** it had none at all. A dialog taller than
the viewport — the split dialog with several bags, any dialog with the keyboard up
— simply ran off both ends of the screen with nothing to scroll.
**Where the side padding lives:** on the scroller, not the card. A scroll
container clips whatever touches its edge, and the fields inside these dialogs
have a focus glow that reaches ~4px past their box.
**Not converted:** the logout sheet and the feed-withdrawal detail card — short,
and neither has a ✕ that could scroll away.
**Date:** 2026-08-20

### T-46 — The expenses forecast reads the last cycle, not a constant
On the create-cycle sheet (A-41) only the chick cost is real — count × price, both
typed by the admin. The other two lines are read off the farm's own history:
**feed** = expected bags × the price of the last 50kg bag actually bought;
**everything else** (water, electricity, medicine) = the last cycle's total for
those, scaled by flock size (`prev.otherExpenses × count ÷ prev.chickCount`).
**Why:** a feed bag doesn't cost what it cost last season, and «١٢٠٠ جنيه» hard-coded
in the source is a number nobody on the farm can correct. His own last invoice is
both fresher and answerable — if it looks wrong he knows why (Khaled, 2026-08-20).
**Why the whole cycle before, not an average of several:** the last cycle is the
one he remembers. An average across three cycles is a better statistic and a worse
explanation, and this number's job is to be sanity-checked at a glance.
**Straight-line scaling, accepted:** it treats every pound as per-bird, and the
electricity bill isn't. Still far closer than the `0` this line used to contribute.
**Fallbacks:** no bag ever bought → `ASSUMED_FEED_BAG_PRICE` (first cycle only);
no previous cycle → other expenses contribute nothing rather than a guess.
**Feed kg per chick confirmed** the same day: ٠.٧٥ بادي + ٢.٧٥ نامي — no longer
provisional.
**Still a forecast.** `cycleAccounting` (FR-19) never reads it; real money comes
from the `feed` and `expense` tables.
**The card opens (`ExpectedExpensesCard`).** Closed it is the stat tile the design
draws — caption, total in red. Tapped, it shows the three lines with the sum
behind each: «٣٥ شكارة × ١٤٥٠ جنيه», and which flock the other expenses came from.
Only the total belongs on screen every time; the workings matter on the first
cycle after a price change, when the question is «هو بيحسب الشكارة بكام؟» — and a
number he can check is a number he can trust (Khaled, 2026-08-20).
**Same price pre-fills the purchase form** (A-15): one read,
`getLastFeedBagPrice`, serving both screens, so they can't drift apart.
**Date:** 2026-08-20

### T-35 — One scroll container per screen, sized in `svh`, header held by `sticky`
The rule every list screen follows from now on: **`<main>` is the only thing that
scrolls.** A screen never puts a second `overflow-y-auto` inside it. Anything
that must stay visible — a toolbar, filter pills, a search box, tabs — goes in
one `sticky top-0 z-10 bg-background` block at the top of the page, and the rows
flow underneath it. Applied to the orders screen (A-50) and the customers screen
(A-30).
**Why not a nested scroller:** it looks correct and behaves badly on a phone. A
swipe can move either box, and whichever the browser picks, the other still has
slack to give — so the list reaches its end with the last card under the tab bar
and one more swipe drags the whole header up. Matching the two heights exactly
is not a fix; the second scroller is.
**And the shells are sized in `svh`, never `dvh`.** `dvh` is the viewport *right
now*, so the shell grew by ~60px the instant the browser retracted its address
bar and everything under the tab bar jumped into view mid-swipe — reported twice
as a scrolling bug on two different screens before the cause was found, because
it is not scrolling at all. `svh` is the height with the browser UI showing: a
number that never changes. `overscroll-contain` on `<main>` keeps a swipe past
the last row from reaching the document, which is what invites the retraction.
Both are moot once the app is installed (no address bar), which is exactly why
it never reproduced on a laptop.
**Also:** `no-scrollbar` (globals.css) on rows that scroll sideways — weight
chips, order tabs, expense categories. They are swiped, never dragged, and a
grey system bar under designed chips reads as a rendering fault.
**Date:** 2026-08-18

### T-34 — A session the app can't place is ended, never routed
Found on the first deploy: the owner's auth account carried its role in
`user_metadata` (written by an early build) instead of `app_metadata`, where the
middleware reads it (D-14). The account signed in fine and then belonged to
neither app — the middleware sent it to the customer home, the customer home
found no customer row and redirected to `/login`, and the middleware saw a live
session there and sent it home again. **ERR_TOO_MANY_REDIRECTS, with no screen
left to tap.** Three changes, because the loop and its trigger are separate bugs:
1. **The middleware ends a session whose role is neither `admin` nor `customer`**
   (local sign-out + `/login`) instead of guessing a home for it.
2. **`/logout`** — a GET route that clears the session and then goes to `/login`.
   Every page that finds a session but no matching row redirects *there*, not to
   `/login`, so the dead end can never close into a circle again. It is exempt
   from every middleware rule, including "signed in → go home".
3. **`signIn` repairs the role on the way through** — if `app_metadata.role`
   doesn't match, it is written and the sign-in is repeated, because the session
   token is stamped with `app_metadata` when it is minted, so the first token
   would still lack the role. Skipped entirely on a healthy account.
**Why not just fix the one row:** the row was fixed too, but a redirect loop is
the worst possible failure for these users — there is no error to read, no button
to press, and clearing browser data is not something this admin will do while
standing at a scale. The exit had to exist in the code, not in the data.
**Date:** 2026-08-18

### T-33 — The PWA ships in two stages; the manifest is a typed route, not a static file
Stage one (now): `src/app/manifest.ts` + app icons + `appleWebApp` metadata, so the
app installs to the home screen and opens **standalone** — no URL bar, no tabs.
Stage two (Phase 8): service worker, offline caching, the install banner (FR-2),
notifications.
**Why the split — the service worker is deliberately deferred, not forgotten:**
every screen in this app renders live server data (orders, weights, payments,
debts). A cache-first service worker added now would let the admin open the app
and act on a **cancelled order or a stale balance** — a worse failure than not
working offline at all. It lands once the screens are finished and we can decide
per route what may be cached (shell and fonts: yes; any page holding money or an
order status: never).
**Why a typed route instead of `public/manifest.json`** (which the structure in
BUILD-WORKFLOW section 2 lists): `MetadataRoute.Manifest` type-checks the file at
build time. A misspelled key in a static JSON manifest fails silently — the
install prompt just never appears on the phone, with nothing in the console —
and this is exactly the kind of bug a designer testing on a phone cannot diagnose.
Next.js links it from the root layout automatically at `/manifest.webmanifest`.
**iOS needs both:** Safari ignores the manifest, so `appleWebApp` +
`apple-touch-icon.png` carry the same information again in the metadata.
**`formatDetection: { telephone: false }`** stops iOS auto-linking runs of digits
— on these screens a number is almost always a weight, a price, or an order
number, and the real phone numbers already have their own buttons (`ContactLinks`).
**Date:** 2026-08-18

### T-32 — Customer search filters in the browser; the «الآجل» filter lives in the URL
The search box on A-30 is client state over the list the page already loaded. The
debt filter stays a URL param (D-26).
**Why:** Two different lifetimes. A view worth keeping across a refresh, a share, or
the back button belongs in the URL; a half-typed name does not — and pushing a
param per keystroke would mean a server round trip per letter, on a list of tens of
rows that is already in memory. Same reasoning as the add-order sheet's picker, and
both now share one matcher (`lib/search.ts`).
**Arabic matching:** names are normalised as *typed*, not as spelled. Alef, ya,
ta-marbuta and hamza variants collapse to one form and tashkeel/tatweel are dropped;
the definite article «ال» is ignored at the start of every word on both sides
(«الشيخ احمد» finds «شيخ احمد»); matching is word-by-word so order doesn't
matter; and a second pass with spaces removed catches «عبدالله» ↔ «عبد الله».
A query containing digits is treated as a phone fragment, Arabic-Indic digits
included.
**Why so forgiving:** a near-miss that returns nothing doesn't read as "typo" to this
admin — it reads as "this customer isn't registered", and he adds them a second time.
Duplicate customers split one person's debt across two rows, which is the expensive
failure. False positives cost him one glance.
**Date:** 2026-08-18
