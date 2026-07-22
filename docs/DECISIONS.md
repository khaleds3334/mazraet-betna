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
