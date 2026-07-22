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

### T-15 — No `invoice` and no `debt` table (both derived on read)
Confirming D-05 at the schema level: the invoice = `orders` + `order_line` (actual weights × snapshotted `unit_price`) + `payment`; the debt = invoice total − sum(payments). Neither is a stored table. The price/cleaning price are **snapshotted onto `orders` at weighing** (`unit_price`, `cleaning_price`) so changing settings later never rewrites an old invoice (FR-5).
**Why:** Single source of truth; reassigning an order to another customer (FR-16) moves its invoice and debt automatically because both derive from the order. Verified against seed data — all totals/remaining computed correctly on read.
**Note:** The `debt` entity listed in BUILD-WORKFLOW Phase 1 is intentionally not a table for this reason; debt computation will live in `/lib/calculations` (Phase 2).
**Date:** 2026-07-22
