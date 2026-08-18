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
