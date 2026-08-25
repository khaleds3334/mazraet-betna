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

**Amended 2026-08-21 (Khaled) — the snapshot moves from weighing to ordering.**
`unit_price` / `cleaning_price` are now stamped in `createOrder`, not in the
weighing action. Everything else about T-15 stands: the invoice is still derived,
and an old invoice still never moves when settings change.
**Why the moment matters:** the customer is quoted a price when they order. Under
the old rule, an order booked on Monday and weighed on Wednesday was billed at
Wednesday's price — so raising the kilo price mid-sale silently re-priced orders
the farm had already promised. FR-5 ("applies to new sales, not ones already
recorded") reads either way; the customer's understanding does not.
**Consequence:** orders taken before this change still have `unit_price = null`
and are stamped at weighing by the old fallback, which is the closest we can get
to a price nobody recorded. Nothing to migrate — the columns already existed.

### T-47 — The sale switch writes immediately; the rest of A-70 waits for «حفظ»
Settings (A-70) has two save behaviours on one screen. «حالة البيع للمزرعة»
writes on tap; the price, cleaning fee, weights and date are committed by the
button.
**Why:** closing the sale is the only control on the screen that is visible to
someone else the instant it lands. An admin who closes the sale and walks away
from an unsaved screen has told the customers nothing, and orders keep arriving
for birds he has decided not to sell. The others are his own numbers, where a
half-edited screen he can still abandon is the safer default.
**What it does not do:** it never starts or ends a cycle's selling *phase* —
that stays on the cycle (A-44). It only answers "are we taking orders right now",
which is why it is disabled when no cycle is selling, and why re-opening requires
`sale_closes_at` to already exist: that column is set by the phase and never by
this switch, so it is how the two are told apart.
**Date:** 2026-08-21

### T-48 — Between cycles the customer's countdown rolls instead of expiring
With no cycle to date the next sale from, the home counts down to an estimate:
`SALE_START_ROLL_DAYS` (34) out from the last cycle's end, pushed forward another
6 days every 6 days that pass with no new cycle. The admin's own date (A-70)
overrides it; registering a cycle replaces it outright.
**Why:** a fixed date reaches zero. The customer's home would then say the sale
starts today while the farm has not even bought chicks — the one thing a
countdown must never do is come true when nothing is behind it. Rolling keeps the
answer honestly vague ("about a month") until someone commits to a real date.
**Why derived, not stored:** expressed as whole 6-day steps from `ended_at`, so
the answer depends only on that timestamp and the clock. Two devices agree, and
nothing has to run on a schedule to keep a stored date fresh.
**Date:** 2026-08-21

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

### D-34 — A running cycle's row leads to the home dashboard, not to a cycle page
On the cycles list (A-42), a **finished** cycle opens its own page
(`/admin/cycles/[cycleId]`, A-45). A **running** one goes to `/admin`.
**Why:** the home dashboard already *is* the running cycle's page — its age, its
feed, its mortality, its expenses, its sale. A second page for the same cycle would
be a copy to keep in sync, and the admin would have two places to look for one
answer. History gets a page; the present already has one.
**Consequence:** the row's actions («تسجيل نافق» / «تسجيل مصاريف») are the
dashboard's own components, not new ones — one form per thing recorded, reachable
from either screen.
**Date:** 2026-08-20

### D-35 — «انشاء دورة جديدة» only exists while no cycle is running
The toolbar at the top of the cycles list appears when the farm has no active cycle,
and is absent otherwise — which is how the design draws A-42 against A-43.
**Why:** a farm raises one flock at a time (FR-4), enforced in the database by a
unique index. A button that is always visible would be a button the app refuses half
the time, and a refusal this user did nothing to earn reads as a broken app. The
create-cycle path stays exactly where it already was: the home CTA (A-10) and the
empty state (A-40), both of which only exist in the same "nothing is running" state.
**Date:** 2026-08-20

### T-48 — Cycle history is read as five flat queries, joined in memory
`listCycles` reads cycles, mortality, expenses, feed and orders as five queries
scoped to the farm, then groups them by `cycle_id` in JS — not one query per cycle,
and not a database view.
**Why:** a farm runs a handful of cycles a year, so its whole history is a few
hundred rows. Five reads cost the same whether there are two cycles or twenty, where
per-cycle queries grow with the list. A view would have to pre-aggregate money, and
money on this project is never stored pre-totalled (D-05) — the profit on a row is
recomputed from the orders' own lines and payments every time, so correcting a
weight moves it on the next read.
**Date:** 2026-08-20

### D-36 — «انتهاء فترة البيع» ends the cycle, asks first, and is refused over open orders
The button at the foot of the selling cycle's row (A-44) closes the cycle for
good: the sale shuts, the cycle stops being the farm's active one, and `ended_at`
records when. It answers the question that had been open since A-20 was
built — *who ends a cycle?* — the answer being: the admin, from the cycles list,
not from the dashboard (Khaled, 2026-08-20).

Three rules around it:
- **It asks first.** The design draws no dialog, so it borrows the shape of the
  one that opens the sale (A-23) — the same question in the other direction. The
  button is full-width and easy to hit while standing over a scale, and there is
  no undo.
- **Open orders block it.** While any order is `pending`, `weighed`, or `ready`,
  ending is refused and the dialog says how many. A cycle that closes over an
  unfinished order strands it: the orders screen then looks at the *next* cycle,
  and that order is only reachable through history. He finishes them first.
- **Failure is an inline error, never a toast** (T-09). A toast that
  auto-dismisses unseen would leave him believing the cycle closed.

The count is checked twice — once for the dialog, once inside the action — because
the number the screen rendered with can be minutes old and a customer can order in
between.
**Date:** 2026-08-20

### T-49 — `components/admin/shared` — a piece used by two admin screens moves up
Extends T-23's rule one level. Anything used by two *screens* (not two faces of
one screen) leaves the folder it was born in and moves to
`components/admin/shared`: `ChickIcon`, `RecordActions` (the تسجيل مصاريف /
تسجيل نافق pair), `RecordMortalityButton`, `RecordFeedWithdrawalButton`,
`FeedTracker` (the three feed tiles + سحب شكارة), and the whole `expenses/` sheet
family. `home/shared/` keeps only what the two dashboards share with each other
(`CycleHeader`, `CycleStatCard`, `StatSection`).
**Why:** the cycles list (A-43/A-44) needs the same record actions and the same
feed store the raising dashboard has. Importing them out of `home/raising/` would
have made one screen reach into another screen's private folder — which is how a
folder stops meaning anything. A component that two screens use belongs to
neither.
**The rule, stated once:** one user → live in that screen's folder (so
`EndSellingButton` sits in `cycles/`, and `StartSellingButton` stays in
`home/raising/`); two or more → `components/admin/shared`; used by both apps →
`components/shared`; part of the design system → `components/ui`.
**Also extracted:** `ui/ConfirmActions` — the confirm/«الغاء» pair at the foot of
a confirm dialog, drawn identically by A-23 and by the end-of-cycle dialog.
**Date:** 2026-08-20

### D-37 — Between cycles the home reports the last cycle, but the farm's debt
The idle home (A-21) shows three figures: **ربح الدورة** and **اخر المصاريف** from
the cycle that just closed, and **الديون** across the whole farm — every cycle, not
just the last (Khaled, 2026-08-20).
**Why:** with nothing running, the only money question left is *who still owes me*.
Scoping it to the last cycle would hide a debt from two cycles ago behind a screen
that looks like a summary of everything. The line above the tiles («تم الانتهاء من
اخر دورة») is what tells him the other two are the last cycle's.
**Date:** 2026-08-20

### T-50 — Each series on the cycle chart is scaled against itself
The comparison chart on A-21 plots average weight, profit and expenses side by side.
Each series is measured against its own tallest bar, not against a shared maximum.
**Why:** they are not the same kind of number. An average weight is ~٢ and a cycle's
expenses are ~٢٢٠٠٠, so on one scale the weight bar is a fraction of a pixel —
in the data and invisible on the screen. Per-series scaling makes every colour
answer the question the chart exists for: *which cycle did better at this?* The
trade-off is stated plainly: heights are comparable **down a colour**, never across
colours, which is why the bars carry no printed numbers and A-22 (the tap-for-detail
popup) is where the real figures will live.
**Also:** the chart is hidden below two cycles — measured against itself, a lone
cycle's every bar stands full height and reads as "everything was at its best".
**And:** because the heights are relative, the real figures must be one tap away —
the whole bar group opens A-22, the cycle's summary card.
**Date:** 2026-08-20

### T-51 — A negative number is wrapped in an LTR isolate
`formatArabicNumber` and `formatCurrency` wrap a negative value in U+2066…U+2069.
**Why:** the minus sign is bidi-neutral and Arabic-Indic digits are classed as
"Arabic numbers" rather than "European numbers", so the two never bind. Inside an
RTL paragraph the sign drifts to the far side and `-١٩١٥٩` renders as `١٩١٥٩-` —
which reads as a number with a stray dash after it. The isolate pins the sign to the
left of its digits without affecting the text around it.
**Where it shows:** a cycle that ended under water (sold short, or ended early). The
label stays «ربح الدورة» and the tone turns red — green on a loss reads as a win
(Khaled, 2026-08-20).
**Date:** 2026-08-20

### D-38 — «الدورة الحالية» means the selling cycle, or the last one to end
One definition, in `getDefaultOrdersCycle`, for every screen that says the words:

1. the cycle **selling** right now — that is where orders are being placed;
2. otherwise the **last cycle to end** — during التربية nobody is ordering, and
   what still matters is who owes for the flock just sold;
3. otherwise whatever cycle exists at all — a farm's first, still being raised.

**Why it changed:** the rule was "active first, then newest", which pointed at a
**raising** cycle the moment one started. The day the admin registers a new flock,
the orders screen would empty out and every customer's «طلبات الدورة» would drop to
zero — on exactly the day last cycle's debts still need chasing.
**Consequence:** during التربية the orders screen shows the previous cycle's
orders, which is why booking is gated separately (D-39) — otherwise a new order
would land on the raising cycle and vanish from the screen that created it.
**Date:** 2026-08-20

### D-39 — An order can only be booked while the sale is open
`createOrder` refuses unless the farm's active cycle has `sale_open`. The sheet
(A-56) says so before the form is filled in, with both save buttons inert; the
button that opens it stays live, because a dead pill explains nothing and the
sheet is where the reason fits.
**Why:** birds in التربية are weeks from ready — an order booked against them
promises a date nobody can keep. And with D-38, the orders screen is looking at the
previous cycle at that moment, so the new order would be invisible the instant it
was created.
**Date:** 2026-08-20

### D-40 — A customer's money is read twice: lifetime, and this cycle
`CustomerSummary` carries `debt`/`invoiceTotal`/`paidTotal` for everything the
customer has ever owed, and `inCycle` for the same three figures on الدورة الحالية.
- the row's **debt** and the screen's «اجمالي الآجل» stay lifetime — that is what
  the list is sorted and filtered by, and what the farm is actually owed;
- the row's **paid-vs-owed bar** reads `inCycle`;
- the history sheet's debt figure follows whichever chip is selected.

**Why:** a bar summing five years of business says nothing about the flock being
collected for this week, and barely moves when a payment lands on it (Khaled,
2026-08-20). Both numbers are real; they answer different questions, so each is
shown where its question is being asked.
**Date:** 2026-08-20

### D-41 — The orders screen has a working face and an archive face
The funnel picks the cycle; what the cycle is doing picks the screen.

**Selling** → «اضافة طلب» and the three tabs of FR-12.
**Anything else** → no add button, no tabs. The toolbar instead carries the
«المكتملة» chip with the cycle's order count and the cycle's name, and the body is
one list of everything in it.

**Why:** an order can't be booked outside the sale (D-39), so the button would be a
button that refuses. And `endCycle` won't close a cycle over an open order, so a
closed cycle holds nothing but completed ones — «الجديدة» and «قيد التشغيل» are two
tabs guaranteed to be empty, and a tab bar where two of three are always zero
teaches the admin to stop reading it (Khaled, 2026-08-20).

The archive chip is the tab bar's own `OrderTabChip` rendered without a handler,
so the two can never drift apart visually.
**Date:** 2026-08-21

### T-52 — The cycle picker goes through the router; the tabs never do
Two filters on one screen, deliberately built on different mechanisms.

**Tabs** — `useUrlParam`, `history.pushState`, no server round trip. The three
lists are already on the page (D-31).
**Cycle** — `router.push(?cycle=…)`, a full server render. Another cycle is
another list; there is nothing on the page to filter.

`useTransition` covers the gap: the dialog stays open and the chosen row dims
while the new page is fetched, instead of a dead tap on a slow connection.
**Why it's worth writing down:** the two look like the same kind of control and
are not, and reaching for `useUrlParam` here would show the previous cycle's
orders under the new cycle's name.
**Date:** 2026-08-21

### D-42 — An orphan order leaves paid, or it doesn't leave
`deliverOrder` refuses to hand over an order with no customer on it unless the
invoice is settled in full. The payment dialog says so before the tap, with both
«لم يدفع» and any partial amount disabled.

**Why:** an orphan order belongs to nobody (FR-13), and every per-customer debt
tally leaves it out on purpose — there is no one to carry it. Handing the birds
over unpaid therefore doesn't create a debt the app will chase, it **deletes the
money**: the birds are gone, the invoice exists, and nothing anywhere is owed.
Every other order can go out unpaid precisely because a customer's name is on it
(FR-17).

**A house order is the deliberate opposite** and passes untouched: it is nobody's
*because* it was never a sale (FR-36), so there is nothing to collect.
**Consequence:** «انشاء طلب باسم عميل» without picking a customer is now a choice
with a price attached — the birds can't leave on credit. That is the right price;
an anonymous debt is not a debt.
**Date:** 2026-08-21

### D-43 — Feed is counted by the half bag, and every bag says which feed it was
`feed.bags` and `feed_withdrawal.bags` are `numeric(6,2)`, constrained to halves;
`feed_withdrawal.phase` records بادي/نامي the way migration 013 did for purchases
(both in migration 017). The withdraw popup (A-13) gained two controls that are
not in the Figma file — a «نصف شكارة» checkbox and a بادي/نامي pair — added on
Khaled's word (2026-08-21).

**Why:** a 50kg sack is bought and opened by the half on this farm, and `int` was
truncating that in silence. And the store is not one pile: بادي and نامي are
counted apart, so an opening has to say which one it came out of or the two
counts drift.

**Both controls arrive answered**, the way the day and the time already did — the
admin is standing at the store with his hands busy, and the popup's job is to be
tappable, not to be a questionnaire. He can override either, and his answer is
what gets stored.

**Which feed comes next is decided by quantity alone** (`nextWithdrawalPhase`):
bags are بادي until the cycle's بادي requirement has been opened, then نامي. The
flock's **age** was the other candidate — "after day ١٥–١٧ it's all نامي" — and
was turned down: a large cycle can reach day ١٦ with بادي still in its quota, so
the two rules disagree exactly where it matters, and a default the admin can't
predict is worse than one that is occasionally worth changing.

**This supersedes the withdrawal half of T-47**, which kept withdrawals inferred
on the grounds that asking mid-cycle was friction. It is not friction when the
answer is already filled in.
**Date:** 2026-08-21

### D-44 — «العلف المطلوب» is what is still to buy
The tile on A-11/A-44 and in the purchase form shows the cycle's estimate **minus
what has already been bought**, per phase, reaching ٠ / ٠ once the store is
complete. It is the same subtraction that pre-fills the purchase form's bag
counts, so the number he reads and the number he is handed are one number.

**Why:** it used to hold the whole cycle's forecast for the whole cycle, so a full
store still read «١.٥ / ٥.٥» — true, and useless. Standing in the feed shop the
only question is how many more (Khaled, 2026-08-21).

**And it prints its halves.** The tile used to round to whole bags to stay compact
(the display note in **T-22**, now retired) while the create-cycle sheet showed the
same cycle's halves: registering ١٠٠ كتكوت against «١.٥ و ٥.٥» opened a dashboard
saying «٢ و ٦», and one of the two had to be wrong.
**Date:** 2026-08-21

### D-45 — A bag is named within its own feed, and says what came before it
The bag-detail popup (A-13) reads «الشكارة الأولى بادي» / «نصف الشكارة الثانية
بادي», with «أكلوا قبلها» underneath. The ordinal counts **within the phase** and
restarts at نامي; a half opening is prefixed «نصف» and does not advance the
ordinal past the bag it is half of; «أكلوا قبلها» is every bag opened before this
one, both phases together.

**Why:** the number used to be a running count across the whole cycle, and a half
bag advanced it as if it were whole — so «الشكارة رقم ٣» could mean two and a half
bags of two different feeds. The farm counts بادي and نامي separately, and this
popup exists to answer "which bag was that?" in the terms he thinks in (Khaled,
2026-08-21).
**Date:** 2026-08-21

### T-53 — No overlay scrolls sideways, and the expense sheet opens fresh
`overflow-x-hidden` alongside the `overflow-y-auto` on `BottomSheet` and `Modal`.
CSS computes the other axis from `visible` to `auto` the moment one axis is
scrollable, so **one element a pixel too wide turned an entire sheet into a
horizontal scroller** — which is what the expense sheet was doing. Hiding it is
not the same as fitting it, so the content was fixed too: `NumberStepper` shrinks,
the bag rows wrap at 320px, and the expenses table's item column wraps instead of
widening the row.

**The category chips are pinned with the title.** Same reasoning that put the ✕ up
there (T-45): a form long enough to scroll is exactly the one you want out of.

**Closing that sheet without saving discards the typing** — the forms are keyed on
an opening counter, so each opening remounts them. The other sheets keep
half-finished work on purpose; this one opens on figures the app worked out (bags
still to buy, the last bag's price), and a half-edited number sitting in that slot
is indistinguishable from a default (Khaled, 2026-08-21).
**Date:** 2026-08-21

### T-54 — Press-and-hold repeats in gears, and never changes the amount
`StepButton` repeats while held: 450ms before the first repeat, then gaps of
260 → 130 → 60ms as the hold continues. **The step itself never changes.**

**Why not accelerate the amount too:** it is the obvious way to make a long run
fast, and it makes the number unpredictable — the admin looks up from the store
and the count has jumped by five. These are bags of feed and pounds of money, and
he can always type the number instead.

**The bag price steps by ١, not ٥٠.** The field opens on what he last paid
(T-46), so what he does there is nudge it — and ٥٠ could not reach ١٤٧٠ from
١٤٥٠ at all. Holding covers the distance when the gap is real.
**Date:** 2026-08-21

### D-46 — The feed tiles hold two figures each, and colour them apart
«العلف المتوفر» is split into بادي / نامي the way «العلف المطلوب» already was, and
each side of each pair colours on its own (`FeedPhasePair`).

**Red is one condition said in two places:** a feed whose store has run out. In
المتوفر it marks the `٠` — that pile is gone. In المطلوب it marks the bags still
owed to the cycle, because owing bags is ordinary while owing them with an empty
store is the flock going hungry tomorrow. المطلوب at `٠` never reddens: nothing
more to buy is not a problem, whatever the store holds.

**Why the pair rather than one number:** the two feeds are separate stores, so one
colour for both says the wrong thing about one of them — «٠ / ٣» is an emergency
on the left and perfectly fine on the right, and this tile is read at a glance
while standing in the feed store (Khaled, 2026-08-21).

**A surplus shows as a negative, in green.** `remainingFeedBags` no longer clamps at
zero: buying ٤ بادي against an estimate of ٣ reads `-١`, in `success` green. The
estimate is a forecast, not an allowance, so the extra bag is worth seeing — and
`٠` would claim he bought exactly enough, which is a different fact.

*Colour revised the same day:* it was lime first, and lime then became بادي's own
colour (D-48) — a lime figure would have read as "about بادي" instead of "a
surplus". Red was the other candidate and is wrong for the same reason the rest of
D-47 is: red in this very tile already means feed is owed with an empty store, and
one colour cannot say both «ينقصك» and «عندك زيادة». Callers needing a count clamp it themselves; the
purchase form's steppers still open at zero, since «اشترِ ناقص واحد» is not a thing.

**«تسجيل مصاريف» replaces حفظ when the store is empty.** A disabled button explains
nothing; this one closes the popup and opens the purchase sheet — closing first
because a sheet sits *below* a dialog on the layer ladder (T-40).
**Date:** 2026-08-21

### D-47 — Red is rationed: it means "decide something", not "this is money"
The «مصاريف الدورة» tile is **brown** (`accent-brown`) while spending tracks the
forecast, and turns **red** only once it passes «المصاريف المتوقعة» — the figure
A-41 showed when the cycle was registered, now stored on the cycle
(`estimated_expenses`, migration 018).

**Why:** the raising dashboard had three reds on it at once — the expenses tile
(red for merely existing), the mortality figure, and whichever feed count had run
out. A colour that appears everywhere stops being read; the admin glances at this
screen between other work, and red has to earn the glance (Khaled, 2026-08-21).
Mortality keeps it — a rising death count is the thing on this screen he most
needs to catch — and so do the feed figures (D-46), which mean the flock goes
hungry tomorrow. Spending money is simply what a cycle does.

**Stored, not recomputed.** The forecast prices feed at the last bag bought, so
re-deriving it mid-cycle would move the line every time he buys feed at a new
price: «فوق المتوقع» would then be reporting the market, not his spending. The
figure kept is the one he was told.

**Cycles created before 018 have no forecast and stay brown** — no line, no
verdict. Same for «اخر المصاريف» between cycles: that cycle is closed, and there
is nothing left to decide about it.
**Date:** 2026-08-21

### D-48 — بادي and نامي have a colour, and a half bag shades half its day
`lib/feedColors.ts` is the one definition: **بادي = lime** (`primary-hover`),
**نامي = tan/orange** (`accent-tan` as a figure, `accent-orange` as a fill). The
«العلف المسحوب» tile splits into the two feeds and prints each in its own colour,
and the consumption grid under it fills each day in the same two — so a lime square
and a lime figure are read as the same fact, which is the only reason to give them
a colour at all (Khaled, 2026-08-21).

**Text and fill are separate entries** in that file: the token that reads well as a
number is not the one that reads well as a filled 20px square.

**A half bag shades half its square**, cut corner to corner — first half on the
left, second on the right, so the two halves of one bag would tile the square
between them. A half used to fill the day exactly like a whole bag, which made a
cycle run on halves look twice as hungry as it was. Two halves on one day fill it
whole, since that is what they are.

**Past the estimate is green — on the grid square only.** The «العلف المسحوب» tile
keeps each feed's own colour whatever the total reaches: it is a running total, and
recolouring the whole of it says every bag went past the estimate when only the last
one did (Khaled, 2026-08-21). The grid marks the bag itself, which is the thing that
actually crossed the line. Green rather than red, and the same green a surplus in «العلف المطلوب» takes: «زيادة عن المطلوب»
is one idea and gets one colour wherever it appears (Khaled, 2026-08-21). It was red
for half a day, which had the further problem of burying the phase colours it was
supposed to sit alongside — the second بادي bag of a ١.٥-bag cycle went red, and the
lime never got seen.
**Date:** 2026-08-21

### D-49 — A cycle also can't close over a bird nobody took
`endCycle` already refused while an order was still open (D-36). It now refuses
while «الفراخ المتوفرة» is above zero as well, and the confirm dialog says which of
the two is holding it up before he taps.

**Why:** the tile the whole selling dashboard is built around says birds are still
available — free to sell, nobody's — and closing the cycle would walk them into
history with it. There is no undo, and nothing downstream ever asks where they
went: the flock leaves through orders or through mortality, and «متوفرة» means
neither has happened yet. Either sell them, or record them as نافق — both are one
action away, and both are the truth about a bird that isn't there any more
(Khaled, 2026-08-21).

**Orders are named first** when both apply. Clearing the orders is usually what
empties the flock too, so leading with the birds would send him to fix the second
thing first.

**The count comes from `countAvailableChickens`**, which uses the same three inputs
and the same `availableChickens` as the dashboard tile. A second definition of
"what is left of the flock" would eventually disagree with the number on screen,
and being refused for a reason the screen doesn't show is worse than not being
refused at all. It is read after the order check, so «متوفرة» in the message can
only mean birds nobody has asked for.
**Date:** 2026-08-21

### D-50 — «تأكيد الطلب ووزن الفراخ» books the order and opens the scale on it
The second button on A-56 now does what its label says: it saves the order, closes
the sheet, and opens the weighing sheet (A-52) on the order it just created. Until
now it saved exactly like the first button — a placeholder from before A-52
existed.

**Why it earns its own button:** an order the admin types himself is usually one
he is typing with the customer in front of him and the birds about to go on the
scale. Booking then hunting the new card down in the list is two steps for the
thing that was always going to happen next.

**The order is fetched back after the save**, through `fetchOrder` — a server
action wrapping the `getOrder` query, the same shape as `fetchCustomerOrders`. The
weighing sheet reads a whole `OrderListItem`, and assembling one client-side from
the form would be a second, quietly different definition of an order.

**If that read fails the order is still booked.** The sheet closes and reports
success rather than leaving him on a form whose save already went through — which
is the state that produces the same order twice.

**The weighing sheet is held by the launcher, not by the add sheet.** The add
sheet has closed by the time it opens, and two sheets on the same layer rank by
DOM order rather than by intent (T-40). It mounts only once there is an order, so
its weighing draft is keyed to that order from its first render.

**The customer search focuses as the sheet opens.** Picking the customer is the
first thing every order needs, and the tap to reach the field is one the admin
makes with a hand that is holding something else (Khaled, 2026-08-21).
**Date:** 2026-08-21

### D-51 — The selling home's header is pinned, takes orders, and its tiles open them
Three changes to A-20, all the same idea: this is the screen the admin is standing
on when a customer walks up, so what he needs from it should not require scrolling
back or navigating away (Khaled, 2026-08-21).

**«اضافة طلب» sits facing the settings gear.** It is the same `AddOrderLauncher`
the orders screen uses, so there is one add-order sheet in the project rather than
two that drift — and «تأكيد الطلب ووزن الفراخ» works from here too (D-50).

**The header is `sticky`.** It holds the kilo price, whether the sale is open, and
the way to take an order; none of that stops being true because he scrolled down
to read the figures. The page's side padding moved onto the two blocks so the
pinned one can paint the full width — otherwise the figures slide past it through
the gutters (T-35).

**Each order tile opens its own tab** — `/admin/orders?tab=new|active|done` —
**but only when it has orders in it.** This settles the open question in
`PROGRESS.md`: option ب. «٠ طلبات جديدة» is an answer, not an invitation; tapping
it would open a list saying the same thing one screen further from home, and a
control that sometimes does nothing teaches him that tapping is not worth trying.
The tile itself is unchanged in both cases — only the wrapper differs, the same
arrangement `CycleExpensesCard` uses.
**Date:** 2026-08-21

### D-52 — Numbers are typed as digits, and the caret sits where the number ends
Three changes to how the admin types a number, all from the same session with the
app in his hand (Khaled, 2026-08-21).

**`dir="ltr"` on every numeric field** — `Stepper`, `NumberStepper`, and the
weighing row. Digits lay out left-to-right wherever they sit, even inside an RTL
paragraph, so an RTL input puts the caret at the *far* end of the number: to fix
the last digit of «١.٥٢٠» he had to reach past the ١, on the opposite side from
the digit he was looking at. Every one of these fields is centred, so nothing
moves on screen; only the caret goes where it belongs. (Related to **T-51**, which
is the same bidi behaviour showing up in output rather than in input.)

**The weighing field places the decimal point itself.** He types `2250`, the field
reads `٢.٢٥٠`. No bird weighs ten kilos, so the first digit is always kilos and
everything after it is grams — there is exactly one place the separator can go.
Reaching for a dot on a phone keypad, one-handed, over a scale, to type a
character that carries no information is a tap that exists for the software's
benefit. The point appears with the first digit and stays put, so a half-typed
`٢٢٥` reads as two and a quarter kilos rather than as two hundred. `inputMode` is
`numeric` now, not `decimal`. Typing the dot anyway still works — it is stripped
with everything else that isn't a digit and lands in the same place.

**The digits are Arabic-Indic as they are typed, not after.** The field holds the
digit stream and renders it formatted, instead of letting the phone's own Latin
text sit in the box until something converts it (rule 3).
**Date:** 2026-08-21

### D-53 — The orders search filters cards the browser already has
«ابحث باسم العميل او رقم الطلب» works. It matches the way the customers screen
does — articles dropped, spelling forgiven — and a query of digits also matches the
**order number**, since that is as likely to be what he is holding as a phone
number, and neither is worth making him pick a mode for (`matchesOrder`).

**The cards stay server-rendered.** Each order travels to `OrdersBrowser` as a
finished node plus the four fields the search needs; filtering chooses which of the
built cards to place. So searching costs no round trip and no re-render of a
screenful of cards — the same reasoning that made tab switching free (D-31).

**The query stays out of the URL,** unlike the tab: it is a glance at the list, not
a place to come back to.

**An empty tab and an empty search say different things.** «لا يوجد طلبات جديدة»
means the tab is empty; «مفيش طلب بالبحث ده» means the tab has orders this query
doesn't reach. Using the first for both would read as if the orders had gone.

**The archive face searches too** — it now goes through `OrdersBrowser` with its
tab bar hidden rather than through `OrdersShell` directly. A finished cycle is
exactly where he goes looking for one particular order.
**Date:** 2026-08-21

### D-54 — In the split dialog, ± moves a bird between bags
«تقسيم الفراخ وزنات مختلفة» (A-53) splits an order; it never changes how many
birds are in it. The ± buttons now honour that literally: ﹣ takes a bird out of a
bag and puts it in the bag **below**, creating that bag if there isn't one, and ＋
takes it back from the same place, so the two undo each other.

**Why this and not what it did before:** ﹣ used to just lower a count and leave
the birds unaccounted for, so the dialog answered a split with «لسه ٣ فراخ من غير
وزنة» and made him go and create the second bag himself. The move he wanted was
always the same one — «خد واحدة من دي وحطها في التانية» — and now it is one tap:
he opens on «٤ فراخ» and taps ﹣ (Khaled, 2026-08-21).

**The counts therefore add up on their own.** «حفظ» can still refuse, but only for
a split that arrived already broken — a draft saved before this rule existed.

**The last bird in a bag stays put.** Emptying a bag is what the bin is for, and
the bin says where the birds went; a ﹣ that made a row vanish would not.

**The rules live in `splitBatches.ts`,** not in the dialog: where a bird goes is
the part with the thinking in it, and it reads better as five named functions than
as five branches inside a component.

**The row is fluid, and the select draws its own arrow.** Fixed widths
(`w-26` + `w-36` + the bin) ran past the dialog's padding at 320px; and the native
select arrow was a few pixels tall on whichever side the platform chose, so it is
replaced by the app's own `arrowDown` at 24px on the right — the leading edge in
RTL, the same as every other field (`PickerField`).
**Date:** 2026-08-21

### D-55 — Once an order is split, birds are added and removed only in the split
On the weighing sheet (A-52), «اضافة فرخة اخري» and the bin on the last row
disappear as soon as the order has more than one bag.

**Why:** both act on the *end of the list*, which is one particular bag, while a
split is an arrangement of all of them. A bird appended to the last bag is a bird
the split never allotted; one trimmed off it silently empties a bag the customer
was already quoted for. Neither is visible as a mistake — the totals still look
plausible, and the arithmetic only fails later, at the invoice (Khaled,
2026-08-21).

**Where they go instead:** «تقسيم الفراخ وزنات مختلفة», which is the one screen
where the counts are shown adding up to the order (D-54), and where ± moves a bird
rather than inventing one.

**Unsplit orders are untouched** — one bag is the end of the list, so trimming and
appending mean exactly what they say (FR-14ج).

### D-56 — A weighing draft is kept for any unsaved work, and the sheet's scroll stays in the sheet
Two bugs behind one report: the admin split an order, the page refreshed under him
while he was scrolling, and the split was gone (Khaled, 2026-08-21).

**The draft was only restored if a weight had been entered.** `openingState` tested
for a non-null `actualWeight`, so a split — which changes bagging and asked
weights, not actual ones — was written to the device and then ignored on the way
back in. The test is now a comparison: restore the draft when it **differs from
the order the server has**, whatever the difference is. A split is a decision about
a customer's order and is worth no less than a number off the scale. Comparing also
settles what the old test was really guarding against: a draft identical to the
server isn't restored, because there is nothing in it to restore.

The restore toast now says «الشغل» rather than «الأوزان» — an order can come back
re-bagged with no weight on it at all.

**And the refresh should not have happened.** A swipe that ran out of list carried
on into the document, which on a phone is how the browser is asked to reload.
`overscroll-contain` on the three scrollers that can be flicked — `BottomSheet`,
`Modal`'s body, and the weighing list itself — keeps the gesture where it started.
The document already had `overscroll-none`, but an overlay portalled into `<body>`
is its own scroll container and chains into it.

**Kept: nothing is sent to the server until «حفظ الاوزان».** An order half-priced
is worse than one not yet priced. The draft is the safety net for that choice, so
the net has to hold everything the choice puts in it.
**Date:** 2026-08-21

---

### D-57 — Closing the sale is not ending the cycle
**مرحلة البيع** is a stage of the flock's life: it opens with «بدء مرحلة البيع» and
closes when the cycle itself does — «انهاء فترة البيع», which is `endCycle` and
refuses while any order is open or any bird unsold. **`sale_open`** is a switch
*inside* that stage: are we taking orders right now.

Six places each derived the phase as `sale_open ? "selling" : "raising"`, which
collapsed the two. Closing the sale for an afternoon walked the cycle backwards
into التربية: the raising dashboard appeared on the admin's home for a flock being
sold, and the orders screen became the archive of a cycle still full of pending
orders.

The rule lives in `lib/cyclePhase.ts` and every screen reads it there. What marks
the stage is **`selling_started_at`** — its own column, written once by «بدء مرحلة
البيع» and read by nothing else (migration 023).

It was `sale_closes_at` at first, which is also set when the sale opens. That was
wrong for a reason worth keeping: `sale_closes_at` is the date the customer's
home counts down to, and the admin moves it freely from settings. A field he
thinks of as a countdown number must not be able to walk a cycle back into
التربية (Khaled, 2026-08-22). Two writes existed only to protect that overload —
a manual close and the auto-close each stamped a made-up end date onto a cycle
that had none — and both are gone: closing a sale now touches the switch and
nothing else. The old tests remain inside `isSellingPhase` as a fallback for rows
migration 023 has not reached, and can only ever say "selling" about a cycle that
really is.

**And the forecast moved out of the cycle entirely** (migration 024, same day).
`sale_closes_at` was a prediction sitting among facts: dated five days out when
the sale opens, moved freely from settings, and never a record of anything. It
now lives in `settings` beside `sale_starts_at`, where the other forecast already
was, and the cycle gained `selling_ended_at` — the moment this flock actually
stopped taking orders, written by the manual close and by the auto-close alike.

The split is by **kind**, not by owner:

| | forecast, editable | fact, written once |
|---|---|---|
| next sale opens | `settings.sale_starts_at` | `cycle.selling_started_at` |
| this sale closes | `settings.sale_closes_at` | `cycle.selling_ended_at` |

That is what killed the real confusion: the one date field on A-70 was writing to
**two different tables** depending on whether a sale was open, which is why an
`editingSaleEnd` flag had to travel from the screen to the action to say which.
It still says which *column*, but the second write — a whole update against
`cycle` — is gone.

**Why it matters beyond the bug:** any new screen that asks "is this cycle
selling" must call `cyclePhase`, never read `sale_open`.
**Date:** 2026-08-22

### D-58 — Booking is capped at the flock; the scale is not
`createOrder` refuses an order for more birds than are available, and refuses
entirely at zero — `countAvailableChickens`, the same count the «الفراخ المتوفرة»
tile shows and the same one `endCycle` will not close over. The add-order sheet
caps its stepper at that number and says why when «+» stops moving; the action is
the half that holds when the sheet has gone stale, which it does the moment
another order is booked while it is open.

**The order that takes the last bird closes the sale** (FR-11). It closes the
*sale*, not the cycle (D-57), and writes byte for byte what a manual close writes,
so there is one closed-sale state and not two. The switch in settings brings it
straight back if birds turn up — a miscount, or a cancelled order handing its own
back.

**«تسجيل نافق» has the same ceiling** (added 2026-08-22). A cycle of fifty that
had sold forty-two and lost six accepted five more dead and came out having
produced fifty-three. Birds already sold or promised to an order are not free to
die either — that is a cancelled order, not a mortality row — so the ceiling is
the same «الفراخ المتوفرة». `NumberStepper` gained `max`/`onMax` for it, the way
`Stepper` did for the order sheet.

**Running out closes the sale, and says who closed it** (migration 025).
`sale_auto_closed` is the difference between a close the admin made and one the
flock made: he reopens his own, and cannot reopen the flock's — there is nothing
to sell. `selling_ended_at` is stamped either way.

It was derived at first, on the reasoning that a stored auto-close would have to
be undone by hand. That was wrong twice over. Deriving it meant every screen
redoing the same reasoning, and two got it wrong the same day — the admin's badge
read `sale_open` alone, and the customer's copy of the count ran through his own
session where RLS hides other people's orders (T-58). And the moment the flock
sold out went unrecorded, so `selling_ended_at` stayed null even after the cycle
closed (Khaled, 2026-08-22).

Undoing it by hand is not needed either. **`syncSaleWithFlock` settles it in
both directions and is the only place either happens** — it closes the sale when
the flock reaches zero and opens it when birds come back, and it never touches a
sale the admin closed himself.

**Call it from anything that changes «الفراخ المتوفرة».** Today that is booking
an order, cancelling one, weighing (a bird removed under FR-14ج, or one added),
and recording mortality. It started as two half-rules — an order closed the sale,
a cancellation opened it — and the half that was missing showed up within the
hour: a bird recorded as dead took the flock to zero and left «البيع متوفر»
standing over an empty farm (Khaled, 2026-08-22). Birds leave two ways and come
back two ways; one function has to know all four.

The drift a stored state invites is not theoretical — it happened twice in one
evening, both times because a writer did not call the sync. The writer that
forgets is always the one added later, and FR-16 (editing an order) is next.

**So the rule also lives in the database** (migration 026). Triggers on
`order_line`, `orders` and `mortality` run the same logic in plpgsql, so the
sale follows the flock whatever moved it — an action that forgets to call the
TypeScript copy, a future writer nobody wired in, or a correction typed straight
into the table. `private.sync_sale_with_flock` is SECURITY DEFINER for the reason
the RLS helpers are: it counts rows the caller may not be allowed to see, which
is the failure in T-58 arriving from the other side.

The TypeScript copy stays. It is where the reasoning is written in prose, it
costs one read, and a belt is worth keeping when the braces are invisible. Both
may run on the same write; the second finds nothing to do.

Verified by moving birds in the database with no app involved at all: deleting a
mortality row reopened the sale, and putting the birds back closed it again and
stamped `selling_ended_at`.

**«اضافة فرخة اخري» while weighing is deliberately not capped.** That screen is
the admin standing over the birds with a customer waiting, and what is on the
scale is more true than what the flock row says. A block there stops real work to
defend a number that is already wrong. Booking is where birds get promised, so
booking is where the promise is checked.
**Date:** 2026-08-22

### D-59 — A house order carries no money anywhere
The family's own birds leave the flock like any other order but were never a sale
(FR-36): no revenue, no debt, nobody to collect from. Its amount due is therefore
**zero wherever the question is asked** — «دفع» is gone from the delivered card
and from the invoice sheet, «تم استلام الطلب» closes it without the payment
dialog, and the invoice shows what the birds came to and stops there, with no
«المبلغ المدفوع» or «المبلغ المتبقي».

Its badge on a delivered card reads **«مش محسوب»** in the settled style — not «تم
الدفع», which would claim money changed hands, and not a debt owed to nobody.

**And it is out of the cycle's money too** (added 2026-08-22). The selling
dashboard had always dropped house orders before summing, but the cycle detail
page and the cycles list had not — so «الديون» on a cycle stood higher than the
sum of what every customer owed, by exactly the house order's total. A house
order has a total and no payments, so it counted as both income and debt on the
two screens that forgot it.

Fixed alongside: `sumInvoices` clamps debt **per order** rather than netting it
across the cycle. Someone who overpaid by a hundred does not settle someone
else's hundred — the customers screen had always clamped, and the cycle screens
had not.

`recordPayment` refuses one outright. Nothing offers it, which is exactly when a
guard is worth having: a payment against a house order is money arriving from
nowhere, and it would land in the farm's takings.
**Date:** 2026-08-22

### D-60 — The admin's sale-start date wins while a flock is raised
«فترة البيع تبدء في» was written to the farm's settings whatever the farm was
doing, but the customer's home only read it **between** cycles — with a flock
being raised it counted to the flock's own ready date and nothing else. So the
date set while raising went nowhere, which is the state the admin is in every time
he has a reason to set one.

His date wins now, overruled only by dates that are no longer about this flock:
one falling **before the birds are ready**, and one that has **already passed**.
The field is floored at the ready date — the picker greys out every earlier day and
`saveSettings` refuses one anyway, since the date arrives in an action a stale
screen can still call.

**And the countdown never sits at zero.** The ready date reaches zero and stays
there while the admin has not opened the sale yet; past it the target becomes the
start of tomorrow and moves with it. Never more than a day, which is the honest
size of the wait, and never nothing. Same principle as the between-cycles rolling
estimate.
**Date:** 2026-08-22

### D-61 — The settings screen says what it is holding
Everything on A-70 except the sale switch is edited freely and committed by «حفظ
الاعدادات», so two things follow from that and are not optional.

**The save button is blurred and inert until something differs** from what the farm
has — the same "not yet" treatment «بدء مرحلة البيع» wears, shared from
`buttonStyles`. A live save button on an unchanged screen invites a tap that does
nothing and teaches the admin the button means nothing.

**Leaving with unsaved work asks first.** A screen registers a `leaveGuard`
(`lib/leaveGuard.ts`) and both ways out — the back arrow and the phone's back
gesture — consult it. Three answers: save and go, go and lose it, or dismiss and
stay with everything still on screen. A refused save keeps him there with the
error rather than leaving anyway.

The contact number saves with everything else; its own «حفظ رقم التواصل» is gone,
because a second save button on a screen that already has one only asks which of
the two he needs.
**Date:** 2026-08-22

---

### T-55 — Nothing in the app pushes a history entry
**Every `<Link>` and every router call replaces.** This is a standing constraint,
not a style preference: it is what lets the phone's back gesture mean something.

`BackGuard` (mounted once per shell) turns back into three answers — close the
overlay on top, ask a screen holding unsaved work (D-61), go home in one press,
and on home «دوس رجوع تاني عشان تخرج من التطبيق» before the app closes. It works by
keeping one spare history entry on top of the real one, with no URL of its own, so
the gesture spends the guard instead of the page and the handler is free to decide
what the press meant.

Closing a PWA cannot be called — the app exits when the gesture finds the history
empty, and only then. So the exit spends the whole stack in one `go(-index)`, and
that index is countable **only because the guard is the one thing that pushes**. A
stray `push` leaves the count short and the app takes an extra press to close.

Two traps, both paid for once already:
- **Never infer the guard from `history.state`.** The router owns that object and
  rewrites it on its own schedule — dropping foreign keys when it navigates,
  keeping them when it restores. `BackGuard` holds the answer in a ref.
- **Never navigate from inside the `popstate` handler.** The router's own listener
  runs after ours and restores the entry that was just popped, overwriting a
  `router.replace` dispatched from in there — the press appears to do nothing.
  Going home is queued for the next task.

Overlays register themselves in `lib/overlayStack.ts` from inside `BottomSheet`,
`Modal` and `Sidebar`, never at a call site, so every overlay in the app answers
the gesture without any screen asking. Registration order is stacking order.
**Date:** 2026-08-22

### T-56 — Writes to the `farm` table go through the service-role client
`farm` carries a select policy and **nothing else** (002_rls), deliberately: an
update policy there would also reach the browser's own token through PostgREST,
and `owner_phone` lives on that table — an admin could move his own login number
without the PIN check and without the auth account moving with it, which is the
lockout `changeLoginPhone` exists to make impossible.

The trap: an RLS-bound update against a table with no update policy **is not an
error**. It matches no rows, writes nothing, and comes back clean. That is how the
contact number reported a save that never happened for as long as it existed.

So farm writes use `createAdminClient()` — safe because the id is
`getCurrentFarm`'s answer about who is signed in, never one that arrived with the
request — and they read their row back, so a write that touches nothing is refused
out loud instead of congratulated.
**Date:** 2026-08-22

### T-57 — The customer's home re-reads on return, not on a timer
Whether the sale is open, and the date the clock counts to, are server-rendered
once and then held; the clock itself keeps ticking in the browser. The admin
opening the sale, closing it, or moving the start date never reached a copy of the
page already sitting on someone's phone.

`RefreshOnReturn` calls `router.refresh()` when the app comes back to the front
after twenty seconds away — long enough that glancing at a notification does not
count, short enough that putting the phone down does. Server components re-run and
client state is left alone, so nothing typed or open is lost.

**Deliberately not a poll and not a socket.** These customers are elderly and
rarely close anything, so returning to an app left open is the normal case, not
the edge one. The single case left — a phone awake on that exact screen at the
moment the sale flips — would cost a connection open on every customer's phone all
day, and the customer discovers it the moment he tries to order.
**Date:** 2026-08-22

### D-62 — Feed left in the store is a question, not a wall
Ending a cycle already refuses over an open order (D-36) and over a bird nobody
took (D-49). Feed still in the store is a third thing, and it is different in
kind: leftover bags are **not a mistake**. The admin buys a little over, or the
flock eats less than the forecast allowed for, and both are ordinary.

But they mean one of exactly two things, and only he knows which:

- **they were opened and he forgot to log it** — real consumption missing from
  the grid and from «العلف المسحوب»;
- **they were never taken for this flock** — and its expenses are carrying feed
  it never ate, which lands straight in the cycle's final profit (FR-19).

Both become invisible the moment the cycle closes, so `endCycle` will not close
one until he answers. Either answer lets him through — that is what makes it a
question rather than a wall.

**«اتسحبت»** writes withdrawals dated today, split بادي/نامي the way the store
actually holds them: the two piles are counted apart (D-43), so one lump row
would leave the phases disagreeing with the grid they draw.

**«مااتاخدتش»** takes the bags off the purchases, **newest first**. The bags
still in the store are the ones bought last, so their own price is what comes
off; averaging the cost across the cycle would charge this flock for feed at a
price it never paid. A purchase reduced to zero is deleted.

The question is asked only once the other two are clear — clearing an order can
open a bag, and asking about a number that is still moving is asking twice.

**Known limit, deliberately not solved yet:** «مااتاخدتش» removes the money from
this cycle and does not carry the bags into the next one, because outside a cycle
there is no store to carry them to. The farm's total spend is therefore
understated by that purchase until the next cycle records its own. Carrying stock
between cycles is its own feature.
**Date:** 2026-08-22

### D-63 — «لاحقاً» on the install banner is for this visit only
The banner that offers to put the app on the home screen (FR-2, Figma 3799:4013)
dismisses without writing anything to the device. Open the site again and it is
there again.

It first shipped with a week-long snooze, on the reasoning that being asked every
visit is nagging. It is not the same thing here: this is the one action that
makes the app usable the way it was designed to be — a home-screen icon, no URL
bar, a full-height screen for an admin standing over a scale — and a user who
puts it off is a user who has not got there yet, not one who has said no
(Khaled, 2026-08-22).

It stops for good only when the app is really installed: `appinstalled` catches
that during the visit, and the standalone check catches it on every visit after.
Nothing else silences it, which is the point.

**The banner is one component for both apps.** Every word arrives as a prop —
title, body, the iOS line, and both labels — because the two halves are two
installed apps with two manifests and two icons, and each has to say its own
thing about its own. Mounted on the admin shell; the customer's copy comes with
that app.

On iOS «تحميل» has nothing to open — Safari installs from its own share menu — so
it turns the second line into how to do it by hand. The design draws one banner,
and that is the only shape it has for a thing it cannot do. The banner never
appears on a browser that can do neither, so the button never lies.
**Date:** 2026-08-22

### D-64 — «مغلق» is three different states, and the countdown says which
The customer's home had two readings, open and closed, and the closed one
counted down to the flock's ready date. For a cycle already selling that date has
passed, so it rolled to tomorrow — and a sale that had run out of birds told the
customer it opened tomorrow (Khaled, 2026-08-22).

Four states now, each with its own countdown and its own words:

| | badge | counts down to |
|---|---|---|
| `open` | البيع متوفر | the end of the window |
| `paused` | البيع مقفول مؤقتا | the admin reopening it — 8 hours, rolling |
| `sold-out` | البيع مغلق, «البيع خلص لهذه الدورة» | nothing: zeros, and no date |
| `waiting` | البيع مغلق | the next sale starting |

**Paused counts in hours.** He closes the sale for an afternoon — he is out, or
the birds are not ready to hand over — and reopens it when he is back. Eight
hours is the honest unit, and it rolls for the same reason every estimate here
rolls: a countdown that reaches zero promises a sale opening at that moment, and
he has promised no particular hour.

**Both sides read the flock before the switch.** The admin's badge said «البيع
متوفر» over an empty flock for a while after this landed, because it was still
reading `sale_open` — which nothing turns off any more. A state that is worked
out has to be worked out everywhere it is shown, or the two halves of the app
disagree in front of the same farm.

**Sold out shows zeros on purpose.** It is the one state with nothing to count
to: this flock is finished and the next belongs to birds nobody has bought. The
boxes read ٠٠ and the date beside the label is dropped — a dash there would be a
second way of saying the same nothing.
**Date:** 2026-08-22

### T-58 — A fact the customer is entitled to may have to be read past RLS
The customer's home says whether the farm has anything left to sell. That is one
number — «الفراخ المتوفرة» — and it cannot be counted through the customer's own
session, because RLS is doing its job: he sees his own orders and nobody else's,
and `mortality` is admin-only (002_rls).

So counted through his session, a cycle whose hundred birds were all spoken for
came back with a hundred available, and his home said «البيع متوفر» over an empty
farm while the admin's screen — running the same function on his own session —
said it had sold out. The check was there; the number it read could not be right
(Khaled, 2026-08-22).

That instance is gone — the state is stored now (migration 025) and the customer
reads one flag rather than recounting a flock he cannot see. **The rule stands,
and the customer app being built next is where it will come up again:** when a screen must
state a fact *about the farm* rather than about the reader, ask whether the
reader's own policies can even see the rows it is made of. If they cannot, reach
past RLS **deliberately and in a named function**, and only where all three hold:

- the answer is an aggregate — a count, a total, a yes/no — never rows;
- it concerns the farm the reader's session already resolved to, never an id
  that arrived with the request;
- the reader is already being shown that fact anyway, so nothing new is exposed.

A silent wrong number is the worse failure. It has no error, no empty state, and
no way to notice — it just quietly disagrees with the other half of the app.
**Date:** 2026-08-22

### D-65 — A pickup slot is a name *and* a clock value
`settings.pickup_slots` is `jsonb`: `[{"time":"16:30","label":"بعد صلاة العصر"}, …]`
(migration 027, replacing the `pickup_times text[]` of four clock values). The
**label** is the only half either app ever renders — the customer picks it on
C-24, and the admin's order card shows the same words back. The **time** is never
shown; it exists so the slots can be ordered and so the app can tell that one has
already gone by.
**Why both:** the design offers «قبل صلاة الظهر», not «١٢:٠٠» — that is how these
customers name a time of day, and an elderly one should not have to convert. But
names cannot be compared, and Khaled's requirement was precisely a comparison:
someone ordering at five in the afternoon must not be offered this morning's slot
(Khaled, 2026-08-23). Storing only names loses that; storing only clock values
loses the reading.
**The six slots** come from the design (node 3155:4717): في التاسعة صباحا · قبل
صلاة الظهر · بعد صلاة الظهر · قبل العصر · بعد صلاة العصر · قبل المغرب.
**⚠️ The clock anchors are estimates** (09:00 · 11:00 · 13:30 · 15:00 · 16:30 ·
17:30). Prayer times move through the year; these are pegs for ordering and for
"has it passed", not a claim about when Dhuhr is. **Review them.**
**A slot has no settings UI yet** — A-70 does not edit the list. Deferred.
**Date:** 2026-08-23

### D-66 — The tray's eleven states are preloaded, not swapped
The counter's tray illustration (C-20) has eleven images — an empty tray through
ten birds, with ten also standing for "more than ten" (Khaled's Figma set
1535:7044 uses one file for variants 10 and 11). All eleven render at once,
stacked, and only `opacity` changes as the count moves.
**Why:** swapping one `src` for another makes every tap a fetch the first time
and a decode every time. On the mid-range Android these customers carry that is a
visible blink, on the one control the screen is built around. Rendered together
they load once when the screen opens, and counting up is then a CSS property
change with nothing to load.
**Cost:** ~١٤٠ ك.ب for the set — eleven WebP files of about ١٣ ك.ب each, exported
at 408×324 (the design's 136×108 at 3×). All eleven are exported at exactly the
same size so they stack to the pixel and nothing shifts as the count moves.
A sprite sheet was considered and rejected: one request instead of eleven small
ones on HTTP/2 is not worth losing the ability to re-export a single tray.
**Date:** 2026-08-23

### T-59 — `available_chickens()` — the customer's count, taken with definer rights
A `SECURITY DEFINER` function in `public`, granted to `authenticated`, returning
the birds still free to sell on a farm's active cycle (migration 027). The
customer's order form caps its counter with it.
**Why:** counting through the customer's own session returns the whole flock —
RLS hides other customers' order lines and every mortality row, so the
subtractions all come out at zero. This is **T-58 arriving from the third side**,
and it meets that decision's three conditions exactly: the answer is an aggregate
and never rows; it concerns the farm the session already resolved to; and the
customer is being shown that number anyway. It refuses outright for a farm the
caller is neither the admin nor a customer of, so the definer rights buy one
number and no more.
**Date:** 2026-08-23

### T-60 — T-09 is about the admin; the customer's order errors use the toast
Rule 11 / T-09 says a failure in a critical action renders a persistent inline
error, never a toast. **The customer's order screen is an explicit exception**
(Khaled, 2026-08-24): validation and save failures on C-20 go through
`toast.error`.
**Why the rule doesn't reach here:** T-09's reasoning is about the *admin* — he
works standing over a scale with his hands busy and may not be looking at the
phone when a message flashes, so a payment that failed must stay on screen. The
customer is holding the phone and looking at it.
**And the inline error failed worse.** On a form this long it rendered at the
foot of the page — below the fold and behind the fixed confirm bar — so it was
not merely missable, it was never seen. A message that fades is worse than one
that stays; a message that never appears is worse than either.
**What stays inline:** the two *standing states* — «الفراخ خلصت» and the sale
being closed. Those are not the result of a tap; they sit next to the button they
are explaining, before anything is filled in.
**Unchanged:** every admin screen. Weighing, payment, cancelling an order and
ending a cycle keep their inline errors, for the reason T-09 gives.
**Date:** 2026-08-24

### T-61 — Time is read on the farm's clock, never the server's
`lib/pickupSlots.ts` resolves "what day is it" and "has this slot passed" through
`Intl.DateTimeFormat` on **`Africa/Cairo`** (`farmToday`, `farmClock`), not
`new Date()`'s local values.
**Why:** half of these calls run in a Server Component or a Server Action, on a
machine set to UTC — two hours behind the village, three in summer. Left alone
the app would have offered a 17:30 pickup at 19:00, and between midnight and 3am
the day strip would have opened on a date that had already gone. `Intl` also
knows when the offset changes, so there is no DST table to maintain.
**Reach:** the day strip's range, the form's opening default, and `placeOrder`'s
own re-check all read the same clock, so the screen and the action can never
disagree about what day it is.
**Date:** 2026-08-24

### T-62 — `bleed-screen`, and the dead class it replaced
A row that runs to the edge of the phone while the page keeps its gutter uses the
`bleed-screen` utility (`globals.css`). `--bleed-trim` subtracts from its padding
for rows whose items carry empty space inside them — a `WeightBadge` is a 70px
box around a 54px glyph, so without an 8px trim the badges' ink starts further in
than the heading above them.
**Why it exists:** the pattern was written as `-mx-screen px-screen`, and **there
is no `mx-screen` utility** — only `px-screen`. The negative margin was never
generated, so two rows (the weights row in settings, and the day strip) had been
sitting inside a second gutter with nothing to show for the class (Khaled,
2026-08-23). It read correctly and did nothing, which is the worst kind of wrong.
**Lesson:** a Tailwind class that does not exist fails silently. Custom utilities
only generate the names they declare — negatives are not free.
**Date:** 2026-08-23

### D-67 — «التأكيد و الذبح» is a timestamp on the order, not a fifth status
Between «تم وزن الفراخ» and «جاهز للاستلام» the customer reads the invoice and
releases the birds for slaughtering (C-41). The order then shows
«يتم الذبح و التنظيف» to the customer and «تم تأكيد السعر» to the admin. That
stage is stored as `orders.price_confirmed_at` (migration 028) and read back by
`orderStage()`; `orders.status` does not move.
**Why not a status:** the four statuses are the four things the **admin** does —
each one is a button he presses. This is the one thing the *customer* does, and
it changes nothing about the admin's work: he still marks the order ready when it
is ready. A fifth status would sit in the middle of his tabs (`ADMIN_ORDER_TABS`)
as a group he never acts on, and every screen that groups, counts or advances by
status would have to learn to step over it. `advanceOrder`'s `STAGE_BEFORE` chain
would need a branch for an order that may or may not have passed through it.
**What it buys:** one nullable timestamp beside `weighed_at`, `delivered_at` and
`cancelled_at` — the moments an order passed through, kept the way the schema
already keeps them — and one derivation both apps read.
**The two apps name it differently** (D-03), and that is the point: the customer
is waiting for birds to be cleaned, the admin is being told he may start.
**Date:** 2026-08-25

### T-63 — A definer function *is* the permission, when RLS can only say "the whole row"
The customer's «التأكيد و الذبح» writes through `public.confirm_order_price()`,
a `SECURITY DEFINER` function granted to `authenticated` — not through a new
policy on `orders`.
**Why:** `orders_update` is admin-only on purpose (D-04 — the customer app cannot
edit or cancel an order). RLS grants access to **rows**, not columns: a policy
sees the finished row and cannot tell which fields moved, so a policy letting the
customer set `price_confirmed_at` would equally let them set `status`,
`unit_price` or `cleaning_price`. There is no `WITH CHECK` that can compare the
new row to the old one.
**What the function is instead:** the whole permission, written out — one column,
one order, only for the customer who owns it, and only while it is `weighed`. It
returns null rather than raising when none of that holds, and the action turns
that into one Arabic sentence without telling the customer which condition failed.
**Idempotent** (`coalesce(price_confirmed_at, now())`): a customer whose tap
looked like it did nothing taps again — that is the reason rule 11 exists — and
the second tap must not rewrite the moment of the first.
**Same family as** `available_chickens` (T-59) and `create_farm`: definer rights
buy exactly one narrow thing and no more.
**Date:** 2026-08-25

---

## Session — 2026-08-25 (order screen, second pass)

### D-68 — The confirm bar is part of the bottom nav, not a panel above it
«تأكيد الطلب» and its read-back are rendered **inside** `BottomNav`, through a
portal (`NAV_SLOT_ID`). The nav grows taller when they unfold into it.
**Why:** drawn as its own fixed panel, the pair was two white surfaces with two
top borders and a seam between them — the bar's, then the nav's. One surface with
one border is the only way they read as one thing (Khaled, 2026-08-25).
**A portal because state runs the wrong way:** the nav is mounted by
`(customer)/layout.tsx` and the order lives in the page underneath it, so no prop
could carry the count upwards.
**This is a deliberate step past Figma** — C-22 (3155:4402) draws them as two.
**Cost, accepted:** the confirm content is now on the nav's layer (z-40), so the
pickup panels can no longer float over it. That is what D-70 answers.
**Date:** 2026-08-25

### D-69 — A flick on the order screen takes the whole page, and turns itself off
Any scroll past 6px carries `/order` to its foot or its head, on a 240ms tween of
our own (`useSnapToEdges`).
**Why:** the screen has two things to look at — «كام فرخة» and everything after
it — and this customer is worst at landing a thumb precisely between them.
**Not `behavior: "smooth"`:** the browser's duration grows with the distance and
cannot be set; it read as slow.
**It waits for `touchend`:** animating under a dragging thumb is a tug-of-war the
thumb loses.
**`MAX_OVERFLOW = 0.5`, re-checked every gesture:** a screen with more than half a
screenful of overflow has a middle, and snapping to the ends makes a middle
unreachable. Above that the hook does nothing and ordinary scrolling returns.
**Date:** 2026-08-25

### D-70 — Both pickup panels float, and flip up only when they must
The day strip used to be a section in the flow; it is now absolutely positioned
like the slot list, and either panel opens **upwards** when the room under its
field is less than the height it will actually be.
**Why float:** opening the day strip shoved the note and everything below it 90px
down the page, under a thumb that was reaching for a day.
**Why flip:** floating is what makes a panel able to come out underneath the
bottom nav and be read by nobody.
**Why the *actual* height and not the maximum:** asking for the slot list's
ceiling (170px) every time made a two-slot panel that had plenty of room open
upwards anyway. `slotListHeight()` lives in `SlotList` because the padding, gap
and line height it counts are that component's own.
**The nav is measured, never assumed:** it is one height normally, taller with
the confirm bar unfolded (D-68), taller again on the tracking section.
**Date:** 2026-08-25

### D-71 — The order form opens filled in
`/order` opens on the customer's own last order — same count, same weight — or on
`FALLBACK_WEIGHT` (2 kg) with an empty counter for someone who has never ordered.
An order he was part-way through survives a trip to another tab (`orderDraft.ts`).
**Why:** most people here buy the same thing every time, so the form that opens
already filled in is the form he can send without answering anything. And a tab
tapped by mistake must not cost him the four answers he had given.
**Everything restored is re-checked against the farm as it is now** — the count
against what is left, the weight against the row on offer, the slot against the
clock. A form that opened on a stale answer would be a form whose confirm button
refuses for a reason he cannot see.
**Cancelled orders don't count** as "last order": the one thing he is least
likely to want repeated.
**A module variable, not `sessionStorage`:** the tabs navigate without reloading,
so a module lives exactly as long as the trip it must survive, and dies on a real
reload — which is where a clean form is what he expects. Never read on the
server, where a module belongs to the process and would hand one customer's draft
to the next.
**Date:** 2026-08-25

### D-72 — A missing answer is a toast, a scroll, and a star
Tapping «تأكيد الطلب» without a count or a weight says what is missing, carries
the page to that question (`revealTop`), and puts a red star beside it.
**Why:** the button is at the foot of the screen and the counter it is
complaining about is a screen away. A sentence about a control he cannot see is a
sentence he cannot act on.
**The star is only on the one he skipped**, and clears the moment he answers — a
star on every question marks them all equally and so marks none.
**`revealTop` belongs to `useSnapToEdges`:** any scroll that hook did not start
looks to it exactly like a finger, so a `scrollIntoView` would have been read as
a gesture and snapped away mid-flight. One owner of the scroll, one animation.
**Date:** 2026-08-25

### T-64 — The tray's size is a prop, because `cn()` does not merge
`ChickenTray` takes `size: "counter" | "bar"` instead of a `className` width.
**Why:** `cn()` joins strings — it is not `tailwind-merge`. A width passed from
outside landed *beside* the default rather than replacing it, and which of the
two won came down to their order in the built stylesheet. The confirm bar asked
for 59px and got 136px.
**The general rule this sets:** any dimension a component draws itself at is a
prop with named options, never a class the caller is trusted to override.
**Date:** 2026-08-25

### T-65 — Look for the shape in the project before reaching for the library
The confirm bar's knife is `KnifeGlyph`, moved from `admin/orders/weighing/` up
to `/components/ui/` — not a Hugeicons name. Its price badge, by contrast, *is*
one: `BadgeDollarSignIcon`, whose name matches the Figma node exactly.
**Why this is written down:** the first attempt registered `Knife02Icon` as the
nearest Hugeicons shape and shipped it, when the design's own knife had already
been traced into this repo months earlier for the weighing sheet — the same
export, `ri:knife-fill`, under T-19 (Khaled, 2026-08-25).
**The rule:** when the design uses a glyph from outside Hugeicons, grep the
project for it before substituting. `/lib/icons.ts` is where Hugeicons names are
registered; it is not the whole inventory of shapes the app draws.
**And check the name:** Figma names its layers after the icon set they came from.
`badge-dollar-sign` resolved to `BadgeDollarSignIcon` on the first try — the name
in the node was the answer, not a starting point for guessing.
**Date:** 2026-08-25

### D-73 — Notifications are written by the database, never by the app
All six customer notices come from triggers on the events themselves (migration
029), not from the Server Actions that cause them.
**Why, concretely:** `notification_insert` is admin-only. A customer placing an
order cannot write «تم استلام طلبك بنجاح» for himself — his session is refused —
and loosening the policy to allow it would equally let one customer write
notifications to another.
**And why that is the right answer anyway:** the same reasoning as migration 026.
A rule that must hold no matter who is acting belongs where the thing happens.
The writers are already the customer app, the admin app and a psql prompt, and
FR-16 will be a fourth; the one that forgets is always the one added later.
**The six:** account created · order placed · order weighed · order ready · order
cancelled (with the reason) · sale opened. «تم الوزن» is not in the design but is
the only one the customer has something to *do* about (D-67).
**The sale opening is the only fan-out** — one row per customer, guarded on the
`false → true` edge because `sync_sale_with_flock` rewrites `sale_open` on every
order and every mortality row.
**Date:** 2026-08-25

### D-74 — A notification stores a sentence, never a number
No order number, no total, no date in `notification.body`. Bodies are written to
read *after* «طلبك رقم ١٢٢٤#», and `NotificationRow` puts that on the front with
`formatOrderNumber`.
**Why:** rule 3 says every number a human reads goes through `/lib/format.ts` in
Arabic-Indic digits. Storing the number would have meant implementing that in SQL
— a second copy of a non-negotiable rule, in a language where nobody would think
to look for it.
**What it costs:** FR-31 asks for the «جاهز» notice to carry the total. It does
not; tapping it opens the invoice instead. The alternative was `computeInvoice`
rewritten in PL/pgSQL and frozen into a sentence at the moment of writing —
two ways to price one order, which is exactly what D-05 exists to prevent.
**Date:** 2026-08-25

### T-66 — Mark-as-read runs after the render, not before it
`/notifications` renders the list, then a client component at the foot of the page
fires `markNotificationsRead()`.
**Why:** the page is a Server Component, so a write in its body would run before
the markup is produced — the customer would open the screen and find every notice
already filed under «القديمة», the screen telling him that what he is reading for
the first time is old news.
**Nothing on screen waits for it.** It exists for the bell's badge on the screen
he returns to, which `revalidatePath("/", "layout")` redraws.
**Date:** 2026-08-25

### D-75 — A notification stores which event it was; money is priced on read
`notification.event` (migration 030) names one of seven things that happened.
«تم تسليم الطلب» is the only notice whose tone and sentence depend on money, and
neither is written down: the trigger stores `event = 'order_delivered'` with a
placeholder tone and a neutral line, and `listNotifications` runs `computeInvoice`
over the order to decide between success and warning and to write «دفعت X و باقي
عليك Y».
**Why:** D-05 — there is no invoice table, because an invoice is the order plus
its weights computed on read. «باقي عليك ٧٨٥ جنيه» stored in a row is an invoice
total stored: a second place one order is priced, frozen at delivery, and wrong
the day a payment is recorded against it. Computed on read it also heals itself —
record the payment and the notice turns from warning to success with nothing to
migrate.
**And D-74 still holds:** the figures go through `formatCurrency`, in TypeScript,
because that is where rule 3 lives.
**Why an event column rather than reading the title:** the title is a sentence for
a human and will be reworded; the event is what the row *is*. It also documents
the seven in the schema, where the next person will look.
**Date:** 2026-08-25
