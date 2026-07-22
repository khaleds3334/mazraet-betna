# Mazra3et Betna (مزرعة بيتنا)

A PWA that replaces the paper notebook used to run a small family poultry farm. **Two apps in one codebase:** Customer (ordering) and Admin (cycle management, weighing, accounting).

---

## ⚠️ Read First

Before writing any code in any session, read in order:

1. **`BUILD-WORKFLOW.md`** — how we work, project structure, phases (**mandatory**)
2. **`docs/PROGRESS.md`** — where we are
3. **`docs/DECISIONS.md`** — settled decisions (do not reopen)

This file holds the **non-negotiable rules**. `BUILD-WORKFLOW.md` holds **how to execute**.

---

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind · Supabase · Server Actions · Hugeicons

**Package manager: `pnpm`.** Never `npm` or `yarn`.

---

## Non-Negotiable Rules

These come from the users, not from taste. Breaking them breaks the product.

1. **RTL everywhere.** Arabic interface, right-to-left layout.
2. **Almarai font** for all text.
3. **All numbers render as Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩)** via `formatArabicNumber()` in `/lib/format.ts`. The admin confuses `2` and `5` in Latin digits. Only exception: phone numbers.
4. **No English in the UI.** The admin cannot read it. This includes button labels, placeholders, error messages, and empty states.
5. **Currency is always EGP with the unit visible** — `١٣٠٤ جنيه`, never bare `1304`.
6. **Weights: 3 decimal places, dot separator** — `1.840 كجم`.
7. **Arabic pluralization** via `pluralizeChicken()` — never `${n} فرخات`.
   Correct forms: `١ فرخة` · `٢ فرختين` · `٣–١٠ فرخات` · `١١+ فرخة`
8. **Touch targets ≥ 44px** on any control the admin uses while weighing.
9. **Mobile-first, fluid.** The Figma canvas is 393px — that is the *design reference*, not a layout width. The app must work from **320px to 430px+**. The most common real-world width for these users is **360px** (mid-range Android), so treat 360 as the primary target, not 393.
10. **Icons come from `/lib/icons.ts`** via the `<Icon>` wrapper — never import Hugeicons directly in a screen.
11. **Every write action gives visible feedback.** Success and non-critical failure use a toast; critical failures (weighing, payment, cancelling an order, ending a cycle) use a persistent inline error, never a toast. Silence after a tap makes this user tap again — which means duplicate orders and double payments. See `BUILD-WORKFLOW.md` section 5.

---

## The Users — this drives every design decision

- **Admin** (the farm owner): 40s, **reads no English**, confuses `2` and `5` in Latin digits, uses the app **while standing and weighing, hands busy**.
- **Customer**: often elderly, very low digital literacy.

**Practical result:** large buttons, clear text, fewest possible steps, zero English.

> **The single most important screen in the project:** the weighing screen (`A-52_Order_Weighing`). Everything else supports it.

---

## Figma

```
file key: rOzKvIGzCYR53LxDvF0J8O
```

Read designs directly through the Figma MCP server. Screen names and node IDs: `@docs/10-screen-naming-sheet.md`

**Do not invent UI elements that are not in the Figma file.** If something appears missing or ambiguous, **ask before implementing**.

---

## Working Agreement

- **One screen at a time.** Follow the Single-Screen Protocol in `BUILD-WORKFLOW.md` (section 6).
- **Reuse components** from `/components/ui` before creating new ones.
- **No hardcoded colors or sizes** — tokens only, defined in `globals.css` via `@theme` (Tailwind v4 — see T-11).
- **No `any`** in TypeScript.
- **No new library** without asking.
- **`pnpm build` must pass** before the session ends.
- **Suggest improvements when you see them** — use the 💡 Suggestion format in `BUILD-WORKFLOW.md` section 1, then wait for approval.
- **Explain your work in simple Arabic** — Khaled is a designer, not a developer.

---

## Reference

All 35 functional requirements are in `@docs/06-functional-requirements.md` — **read the relevant FR before implementing any screen**.

| File | Contents |
|---|---|
| `BUILD-WORKFLOW.md` | Workflow · structure · phases · single-screen protocol |
| `docs/PROGRESS.md` | Build status |
| `docs/DECISIONS.md` | Settled decisions |
| `docs/06-functional-requirements.md` | The authoritative spec |
| `docs/10-screen-naming-sheet.md` | Screen names ↔ Figma node IDs |
| `docs/15-final-coverage-audit.md` | Coverage matrix, gaps, accumulated fixes |
| `docs/17-responsive-guide.md` | Viewport targets and fluid-layout rules |
| `docs/03-user-personas.md` | Why these constraints exist |
| `docs/08-user-flows.md` | End-to-end flows |
