# BUILD-WORKFLOW.md — Mazra3et Betna

> **Read this file completely at the start of every session, before writing any code.**
> `CLAUDE.md` holds the non-negotiable rules. This file holds **how we build**.

---

## 0. Session Bootstrap

At the start of any session, do these in order:

1. Read `CLAUDE.md` — the non-negotiable rules.
2. Read this file completely.
3. Read `/docs/PROGRESS.md` — where we are and what's done.
4. Read `/docs/DECISIONS.md` — settled decisions. **Do not reopen them.**
5. Pick the task from `PROGRESS.md` and follow the **Single-Screen Protocol** (section 6).

**Rule:** If the task is unclear or ambiguous, **ask before writing a line of code**. The user is a designer, not a developer — a clear question is cheaper than wrong code.

---

## 1. Who You're Working With

**User:** Khaled — Product Designer, not a developer. Working vibe-coding style. Speaks Arabic.

**What that means for you:**

- **Explain in simple Arabic** what you did after each task. Not a long technical writeup — 3–5 bullets.
- **Don't leave technical decisions hanging for the user** unless they affect the product itself (look or behavior). Pure technical choices: make them, then state what you picked and why in one line.
- **When you ask, ask with ready options** (أ / ب / ج), never open-ended.
- **Code must be readable.** This project will be shown to a company as a portfolio piece. Clear names, small files, comments only where the logic is non-obvious.

**Quality bar:** If a senior developer opened this code in an interview, it should read as written by someone who understands what they're doing — not pasted together.

### Suggesting improvements — required

If you see a better way to do something, **say so before implementing**. This is not optional; it is part of the job. It applies to:

- A structure or pattern that will be easier to extend later
- A component that should be shared instead of duplicated
- Something in the design that will cause a real problem in code
- A simpler approach that produces the same result

**Format for a suggestion:**

```
💡 Suggestion — [one-line title]
Current approach: [what the plan/design says]
Better approach:  [what you propose]
Why:              [concrete benefit — extensibility, performance, fewer bugs]
Cost:             [extra time / added complexity, honestly stated]
Your call:  أ) apply it   ب) keep as planned   ج) explain more
```

Then **stop and wait**. Do not implement a suggestion without approval.

**Do not suggest:** renaming things for taste, adding libraries for convenience, "modern" patterns with no concrete benefit here, or anything that reopens a decision in `DECISIONS.md`.

---

## 2. Full Project Structure

This is the final structure. **Follow it literally** — every new file has a defined place here.

```
mazraat-baytna/
│
├── CLAUDE.md                      # Non-negotiable rules (read first)
├── BUILD-WORKFLOW.md              # This file
├── README.md                      # Project description (for portfolio)
├── .env.local                     # Supabase keys (gitignored)
├── .env.example
├── next.config.ts
├── postcss.config.mjs             # Tailwind v4 plugin (no tailwind.config.ts — see T-11)
├── tsconfig.json
├── pnpm-lock.yaml
├── middleware.ts                  # Route protection + admin/customer routing
│
├── docs/
│   ├── PROGRESS.md                # ⭐ Build status — updated every session
│   ├── DECISIONS.md               # ⭐ Decision log — updated when we decide
│   ├── 01..17-*.md                # Original design documentation
│   └── screens/                   # One file per screen (section 7)
│       ├── C-01-login.md
│       └── ...
│
├── public/
│   ├── manifest.json              # PWA
│   ├── icons/                     # PWA app icons (not UI icons)
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── apple-touch-icon.png
│   ├── images/                    # ⭐ Images Khaled exports from Figma
│   │   └── (descriptive-name.webp)
│   └── fonts/
│       └── Almarai/               # Self-hosted, not Google CDN
│
├── src/
│   │
│   ├── app/
│   │   ├── layout.tsx             # Root: RTL + Almarai + metadata
│   │   ├── globals.css            # Design tokens + base styles
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   │
│   │   ├── (auth)/                # Shared auth routes
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx             # C-01→C-03 / A-01→A-03
│   │   │   ├── register/page.tsx          # C-04→C-06
│   │   │   └── pin/page.tsx               # A-04→A-06
│   │   │
│   │   ├── (customer)/
│   │   │   ├── layout.tsx                 # Customer BottomNav + Sidebar
│   │   │   ├── page.tsx                   # C-10→C-13 Home
│   │   │   ├── order/page.tsx             # C-20→C-25 Place order
│   │   │   ├── tracking/
│   │   │   │   ├── page.tsx               # C-30→C-35 Tracking list
│   │   │   │   └── [orderId]/page.tsx     # C-40→C-46 Order details
│   │   │   ├── history/page.tsx           # C-50→C-52
│   │   │   └── notifications/page.tsx     # C-15
│   │   │
│   │   ├── (admin)/
│   │   │   ├── layout.tsx                 # Admin BottomNav (5 sections)
│   │   │   ├── page.tsx                   # A-10→A-22 Home
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx               # A-50 List + tabs
│   │   │   │   └── [orderId]/
│   │   │   │       ├── page.tsx           # Order details
│   │   │   │       └── weighing/page.tsx  # ⭐ A-52 Weighing screen
│   │   │   ├── customers/
│   │   │   │   ├── page.tsx               # A-30→A-32
│   │   │   │   └── [customerId]/page.tsx  # A-33
│   │   │   ├── cycles/
│   │   │   │   ├── page.tsx               # A-40→A-44
│   │   │   │   └── [cycleId]/page.tsx     # A-45→A-47
│   │   │   └── settings/page.tsx          # A-70 + change PIN
│   │   │
│   │   └── api/                   # Only if a Server Action can't do it
│   │
│   ├── components/
│   │   ├── ui/                    # ⭐ Shared design system
│   │   │   ├── Button.tsx
│   │   │   ├── InputField.tsx
│   │   │   ├── SelectInput.tsx
│   │   │   ├── DatePickerInput.tsx
│   │   │   ├── Toggle.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── StatItem.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Icon.tsx           # ⭐ Hugeicons wrapper (section 4)
│   │   │   ├── Toast.tsx          # ⭐ Single toast (section 5)
│   │   │   ├── Toaster.tsx        # ⭐ Toast container + provider
│   │   │   ├── InlineError.tsx    # ⭐ Persistent error (not a toast)
│   │   │   └── index.ts           # Barrel export
│   │   │
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx      # variant: customer | admin
│   │   │   ├── AppHeader.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── customer/
│   │   │   ├── SaleStatusCard.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   ├── OrderCard.tsx
│   │   │   └── InvoiceView.tsx
│   │   │
│   │   ├── admin/             # One folder per screen area; big areas split
│   │   │   ├── orders/        #   again by the thing they build (see below)
│   │   │   │   ├── card/      # ⭐ The order card and everything on it
│   │   │   │   ├── add/       # The "انشاء طلب" sheet (A-56)
│   │   │   │   ├── weighing/  # ⭐ The weighing sheet (A-52)
│   │   │   │   └── OrderTabs · OrdersToolbar · OrdersEmptyState
│   │   │   ├── home/
│   │   │   ├── cycles/
│   │   │   └── customers/
│   │   │
│   │   └── shared/
│   │       ├── PWAInstallBanner.tsx
│   │       └── OrderStatusBadge.tsx
│   │
│   ├── lib/
│   │   ├── format.ts              # ⭐ First file written in the project
│   │   ├── icons.ts               # ⭐ Central icon map (section 4)
│   │   ├── constants.ts           # System constants
│   │   ├── utils.ts               # cn() and small helpers
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   ├── server.ts          # Server component client
│   │   │   └── middleware.ts      # Session refresh
│   │   │
│   │   ├── queries/               # ⭐ Reads (Server Components)
│   │   │   ├── orders.ts
│   │   │   ├── customers.ts
│   │   │   ├── cycles.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── actions/               # ⭐ Writes (Server Actions)
│   │   │   ├── orders.ts
│   │   │   ├── customers.ts
│   │   │   ├── cycles.ts
│   │   │   ├── payments.ts
│   │   │   └── auth.ts
│   │   │
│   │   └── calculations/          # ⭐ Business logic — isolated, testable
│   │       ├── invoice.ts         # Invoice computation
│   │       ├── feed.ts            # Feed formulas
│   │       └── cycle.ts           # Chick age, profit, temperature
│   │
│   ├── types/
│   │   ├── database.ts            # Generated from Supabase — never hand-edit
│   │   └── index.ts               # App-level types
│   │
│   └── hooks/
│       ├── useCountdown.ts
│       ├── useToast.ts            # ⭐ Toast trigger (section 5)
│       └── usePWAInstall.ts
│
└── supabase/
    ├── migrations/
    │   ├── 001_schema.sql
    │   ├── 002_rls.sql
    │   └── 003_seed.sql
    └── config.toml
```

### Structure rules — enforce these

| Rule | Why |
|---|---|
| **No component file over 200 lines** | If it grows, split it. Large files are hard to review |
| **A screen area splits into sub-folders once it passes ~10 files** | Group by the thing being built (`card/`, `add/`, `weighing/`), not by kind (`buttons/`, `dialogs/`) — you look for "the order card", never for "a dialog" |
| **A shape drawn by hand twice becomes a `/components/ui` component** | Two copies is a coincidence; the third is a bug waiting for the day one of them is changed |
| **Calculations live in `/lib/calculations`, not in components** | One place to change, testable in isolation |
| **Reads in `/lib/queries`, writes in `/lib/actions`** | Clear separation, predictable file locations |
| **No `any` in TypeScript** | If you think you need it, ask first |
| **Every number goes through a formatter from `/lib/format.ts`** | FR-3 |
| **No hardcoded colors or sizes** | Tokens only, defined in `globals.css` via `@theme` (T-11) |

---

## 3. Tooling

**Package manager: `pnpm`.** Never `npm` or `yarn`.

```bash
pnpm dlx create-next-app@latest    # not npx
pnpm add [package]                 # not npm install
pnpm dev · pnpm build · pnpm lint
```

| Concern | Tool | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Server Components = less code, faster |
| Language | **TypeScript** | Catches errors before they ship |
| Styling | **Tailwind CSS** | Maps cleanly to Figma tokens |
| Backend | **Supabase** (Postgres + Auth + RLS) | Full backend, no server to manage |
| Writes | **Server Actions** | Not API routes — simpler, fewer files |
| State | **useState + URL params** | No Redux/Zustand — this project doesn't need it |
| Forms | **React Hook Form + Zod** | Validation with Arabic error messages |
| Dates | **date-fns** + Arabic locale | Lightweight |
| Icons | **Hugeicons** (`@hugeicons/react`) | Section 4 |
| PWA | **Service worker** | Final phase |

**Never add a library without asking.** Every extra dependency is extra complexity in a portfolio meant to look clean.

---

## 4. Icons and Images

### Icons — Hugeicons

The Figma design uses **Hugeicons**, so we use the same library in code. Guaranteed visual match, zero manual export work.

**Install:**
```bash
pnpm add @hugeicons/react @hugeicons/core-free-icons
```

**Before using an icon name you are not certain exists, verify it.** Do not guess icon names — wrong names fail at build time. Two ways to verify, in order of preference:

1. **Hugeicons MCP server** (`@hugeicons/mcp-server`) — first-party, gives exact names and props. If it's connected, use it.
2. **`hugeicons.com`** — search the icon and copy the exact export name.

**Naming pattern:** `PascalCase` + `Icon` suffix — `Home01Icon`, `Notification03Icon`, `Settings01Icon`. Many icons are numbered variants (`01`, `02`, `03`) — the number matters, so match what the design uses.

**Central icon map — required.** Never import Hugeicons directly inside a screen. All icons are registered once in `/lib/icons.ts`:

```ts
// /lib/icons.ts
import {
  Home01Icon,
  ShoppingCart01Icon,
  UserGroupIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

export const icons = {
  home: Home01Icon,
  order: ShoppingCart01Icon,
  customers: UserGroupIcon,
  settings: Settings01Icon,
} as const;

export type IconName = keyof typeof icons;
```

**Wrapper component:**

```tsx
// /components/ui/Icon.tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { icons, type IconName } from "@/lib/icons";

export function Icon({
  name,
  size = 24,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  return (
    <HugeiconsIcon
      icon={icons[name]}
      size={size}
      color="currentColor"
      strokeWidth={1.5}
      className={className}
    />
  );
}
```

**Usage everywhere:**
```tsx
<Icon name="home" className="text-brand-500" />
```

**Why the map instead of direct imports:**
- One place to see every icon in the system — prevents two screens using different icons for the same concept
- Swapping an icon is a one-line change, not a search across 90 screens
- Screens use semantic names (`home`) instead of library names (`Home01Icon`)
- If we ever leave Hugeicons, only two files change

**Rules:**
- `color="currentColor"` always — color comes from Tailwind classes
- Default size 24px; the free pack is Stroke Rounded only
- Add new icons to `/lib/icons.ts` **before** using them in a screen
- Decorative icons get `aria-hidden`

### Images — Khaled provides them

- Khaled exports from Figma into `/public/images/`.
- Use `next/image`, always with Arabic `alt` and explicit `width`/`height`.
- Prefer WebP.

```tsx
import Image from "next/image";
<Image src="/images/empty-orders.webp" alt="مفيش طلبات" width={200} height={200} />
```

- **If the image doesn't exist yet:** use a visible placeholder and add the exact filename and dimensions to `PROGRESS.md` under "Images needed from Khaled".

---

## 5. User Feedback — Toasts and Errors

**Every action that writes data must give the user visible confirmation of what happened.** Silence after a tap reads as "it didn't work" — and this user base will tap again, creating duplicate orders and double payments.

### Toast vs inline error — pick the right one

| Situation | Use | Why |
|---|---|---|
| Success (order placed, customer saved, payment recorded) | **Toast** | Confirms and gets out of the way |
| Information (order status changed, sale just opened) | **Toast** | Non-blocking |
| Failure in a **non-critical** action (search failed, list didn't refresh) | **Toast** | Recoverable, low stakes |
| Failure in a **critical** action (weighing, payment, cancel order, cycle end) | **Inline error — never a toast** | See below |
| Form field validation | **Inline under the field** | The error belongs to the field |

**Why critical failures never use a toast:** a toast disappears on its own. The admin uses this app while standing over a scale with his hands busy — he may not be looking at the screen when it appears. If recording a payment fails and the toast vanishes unseen, he believes it saved. Critical errors stay on screen, next to the thing that failed, until resolved or dismissed.

### Toast rules

| Property | Value | Why |
|---|---|---|
| **Position** | Top of screen | Bottom collides with `BottomNav` and the keyboard |
| **Duration** | 4s default · 6s for errors · info stays until dismissed if it needs action | Slower reading pace for this user base — 3s is too fast |
| **Max visible** | 2 at once — queue the rest | More than 2 is noise |
| **Dismiss** | Tap anywhere on it, plus auto-dismiss | No small close button — hard to hit |
| **Height** | Minimum 56px | Readable while standing and moving |
| **Direction** | RTL, icon on the right, text on the left | Matches the rest of the app |
| **Text** | Arabic only, one short sentence | No English, no error codes shown to the user |
| **Safe area** | Respect `env(safe-area-inset-top)` | Notch overlap on iPhone |

### Types

Four types, each with its own token color and icon from `/lib/icons.ts`:

```
success  → green   → check icon
error    → red     → alert icon
warning  → orange  → warning icon    (e.g. feed running low)
info     → neutral → info icon
```

**Colors come from `@theme` tokens in `globals.css`, never hardcoded.**

### Implementation

- `Toaster.tsx` mounts **once** in each route group layout — `(customer)/layout.tsx` and `(admin)/layout.tsx`. Never per screen.
- `useToast.ts` exposes the trigger. Screens call it; they never render a toast themselves.
- No toast library without asking — this is small enough to own, and owning it means full control over RTL, sizing, and duration.

```ts
const toast = useToast();

toast.success("تم إرسال طلبك");
toast.error("مقدرناش نحفظ الطلب، حاول تاني");
toast.warning("العلف قرب يخلص");
toast.info("البيع فتح دلوقتي");
```

### Messages — write them for this user

- **Arabic only.** No English, no error codes, no stack traces.
- **Say what happened, not what the system did.** `تم إرسال طلبك` ✅ · `Order created successfully` ❌ · `تم تنفيذ العملية` ❌ (too abstract).
- **On failure, say what to do next.** `مقدرناش نحفظ الطلب، حاول تاني` ✅ · `حصل خطأ` ❌.
- **Never blame the user.** `الرقم لازم يكون ١١ رقم` ✅ · `إنت كتبت الرقم غلط` ❌.
- **Numbers inside toast text go through the formatter too.**

### Required coverage

Every Server Action returns a result the screen turns into feedback. Before a screen is done:

- [ ] Every write action shows success feedback
- [ ] Every write action handles and shows failure
- [ ] Critical actions (weighing · payment · cancel · cycle end) use inline errors, not toasts
- [ ] Buttons disable while an action is in flight — prevents double submission
- [ ] Messages are Arabic, specific, and actionable

---

## 6. ⭐ Single-Screen Protocol

This is what you do every session. **7 steps in order — do not skip one.**

### Step 1 — Understand the screen
- Open `/docs/screens/[screen-name].md`. If it doesn't exist, create it (section 7).
- Read the related FR from `/docs/06-functional-requirements.md`.
- Read the screen from Figma:
  ```
  file key: rOzKvIGzCYR53LxDvF0J8O
  node: [node ID from 10-screen-naming-sheet.md]
  ```
- Read **all states** of the screen (Empty / Filled / Error / Loading), not just the default.

### Step 2 — Ask before writing
If anything is ambiguous, ask **now**, with ready options. Real ambiguity looks like:
- Behavior not visible in the design (where does this button go?)
- A conflict between Figma and the FR
- An unhandled state (what shows when the list is empty?)

**Not ambiguity:** variable names, file organization, any purely technical choice — decide those yourself.

This is also where you raise a 💡 Suggestion if you see a better approach (section 1).

### Step 3 — Data first
Before any UI:
- **Tables exist?** If not, write the migration.
- **Query exists?** If not, write it in `/lib/queries/`.
- **Action exists?** If the screen writes data, write it in `/lib/actions/`.
- **Calculations exist?** Every formula goes in `/lib/calculations/`.

### Step 4 — Components
- **Check `/components/ui/index.ts` first.** If it exists, use it.
- New component used in more than one screen → `/components/ui/`.
- Specific to this screen → `/components/customer/` or `/components/admin/`.
- Any color or size used for the first time → add it as a token in `globals.css` under `@theme`. Never inline (`#F5A623` ❌ → `bg-brand-500` ✅).
- Any new icon → register in `/lib/icons.ts` first.

### Step 5 — Build the screen
- Compose from the components you prepared.
- **Responsive 320 → 430px+** — see `/docs/17-responsive-guide.md`.
- Every number through a formatter.
- Required states: **Loading (skeleton) · Empty · Error · Success**.

### Step 6 — Wire it to real data
- The page reads real Supabase data, not hardcoded values.
- Buttons call real Server Actions.
- **Connected screens:** if this screen navigates somewhere, implement the routing even if the destination is still a stub.

### Step 7 — Close the session
1. Run `pnpm build` — must pass with no errors.
2. Update `/docs/PROGRESS.md` (section 8).
3. If a new decision was made, add it to `/docs/DECISIONS.md`.
4. Propose a commit message:
   ```
   feat(customer): order screen C-20→C-25
   ```
5. Write an Arabic summary: what you did · what works · what needs a decision.

---

## 7. Screen Files (`/docs/screens/`)

Before implementing a screen, create its file. This is what lets anyone understand the screen without opening Figma.

```markdown
# C-20 — Order Screen

**Route:** `/order`
**Figma node:** 2953:1496
**FR:** FR-26, FR-27
**States:** Empty · Filled · ConfirmVisible · DatePicker · TimePicker · Success

## What it does
Customer picks quantity, weights, and pickup time, then submits the order.

## Data
**Reads:** settings (price, cleaning fee, available weights, pickup slots) · cycle (availability)
**Writes:** order + order_line

## Calculations
- Estimated total = (requested weight × price) + (count × cleaning fee)
- Block the order if count > available (FR-11)

## Components
New: `WeightSelector` · `TimeSlotPicker`
Reused: `Button` · `Chip` · `Modal` · `InputField`

## Icons
`order` · `calendar` · `clock` · `check`

## Feedback
Success: `تم إرسال طلبك` (toast)
Failure: `مقدرناش نبعت الطلب، حاول تاني` (toast — not a critical action)
Blocked: quantity exceeds availability → inline message showing what's available

## Connected screens
← from: Home (`/`)
→ to: Success → Tracking (`/tracking`)

## Watch out
- Hard block if quantity exceeds availability; show what's available.
- An order has multiple weight lines, not a single value.
```

---

## 8. `/docs/PROGRESS.md`

Create it in the first session, update it at the end of every session. Keep the headings in Arabic — Khaled reads this file.

---

## 9. Build Phases

**Build inside-out.** This order is not a suggestion — reversing it causes rewrites.

### Phase 0 — Setup (one session)
- [ ] `pnpm dlx create-next-app@latest` (App Router + TS + Tailwind + src/)
- [ ] Create the structure from section 2
- [ ] Self-hosted Almarai in `/public/fonts` via `next/font/local`
- [ ] `dir="rtl"` + `lang="ar"` in root layout
- [ ] Supabase project + `.env.local`
- [ ] `pnpm add @hugeicons/react @hugeicons/core-free-icons`
- [ ] Copy `CLAUDE.md`, `BUILD-WORKFLOW.md`, `/docs`, `PROGRESS.md`, `DECISIONS.md`
- [ ] First commit

### Phase 1 — Database
> Everything after this depends on it. Changing it later is expensive.

- [ ] Schema covering: `farm` · `cycle` · `customer` · `order` · `order_line` · `payment` · `debt` · `expense` · `feed` · `mortality` · `settings` · `notification`
- [ ] `farm_id` on every table (multi-tenant now — Phase 2 ready)
- [ ] `order.customer_id` **nullable** (orphan orders, FR-13)
- [ ] `order_line.batch_no` (order splitting, FR-14ب)
- [ ] `order_line` holds **both** approximate and actual weight
- [ ] **No invoice table** — invoices are computed on read
- [ ] `payment` supports installments (FR-17)
- [ ] `settings` holds a hashed admin PIN
- [ ] RLS: customer sees only their own data · admin sees everything
- [ ] Realistic seed data (one cycle + 5 customers + orders in different states)
- [ ] Generate `/types/database.ts`

**Ask before writing if any relationship is ambiguous.**

### Phase 2 — Foundations
- [ ] `/lib/format.ts`:
  - `formatArabicNumber()` · `formatCurrency()` · `formatWeight()` (3 decimals, dot) · `pluralizeChicken()` · `formatArabicDate()`
- [ ] `/lib/constants.ts` — raising period (30) · temperature table · order states
- [ ] `/lib/calculations/` — invoice · feed · cycle
- [ ] Design tokens from Figma → `globals.css` under `@theme`
- [ ] `/lib/icons.ts` + `Icon.tsx` wrapper
- [ ] Toast system: `Toast.tsx` · `Toaster.tsx` · `InlineError.tsx` · `useToast.ts` (section 5)
- [ ] `/components/ui` components with all states
- [ ] Supabase clients + middleware

### Phase 3 — Auth
- [ ] `/login` — phone number, routes admin vs customer
- [ ] `/register` — displays the number the user typed
- [ ] `/pin` — 6 digits, admin only
- [ ] Middleware route protection
- [ ] Mount `<Toaster />` once in each route group layout — `(customer)` and `(admin)`

### Phase 4 — Customer app (simpler first)
Home → Order → Tracking → Order details → History → Notifications

### Phase 5 — Admin app
Settings → Customers → Cycles → Home → **Orders last**

**The weighing screen (A-52) is the last screen in the project** — it depends on everything before it.

### Phase 6 — Deferred requirements
- [ ] FR-1ب — Change admin PIN from settings `Must`
- [ ] FR-16 — Edit order / reassign to another customer `Should`
- [ ] FR-6 — Temperature indicator `Could`

### Phase 7 — Known design fixes
- [ ] Disable "start selling phase" before ~day 30
- [ ] Low-feed visual warning
- [ ] Expense chips → (علف / مياه وكهرباء / أدوية / أخرى)
- [ ] Sequence numbers as `١.` not `-1`
- [ ] Feed shown as two values (بادي ٤ · نامي ١٤), not `٤/١٤`
- [ ] "ربح الدورة" instead of "الربح الشهري"
- [ ] "جنيه" unit on every amount
- [ ] Remove leftover English strings
- [ ] Spelling fixes from `10-screen-naming-sheet.md`

### Phase 8 — PWA and launch
- [ ] Manifest + icons + service worker
- [ ] Install banner (FR-2)
- [ ] In-app notifications (FR-31)
- [ ] `env(safe-area-inset-bottom)` + `min-h-dvh`
- [ ] Test at 320 · 360 · 390 · 430
- [ ] **Test on the father's actual phone**

### Phase 9 — Portfolio polish
- [ ] English `README.md`: problem · solution · architectural decisions · screenshots
- [ ] Remove `console.log` and dead comments
- [ ] Deploy to Vercel + demo account

---

## 10. Quality Checklist — run before calling a screen done

**Function**
- [ ] Reads real data (not hardcoded)
- [ ] Every button does something real
- [ ] Loading · Empty · Error states implemented
- [ ] Errors show clear Arabic messages

**Feedback**
- [ ] Every write action shows success feedback
- [ ] Every write action handles and shows failure
- [ ] Critical actions (weighing · payment · cancel · cycle end) use inline errors, not toasts
- [ ] Buttons disable while an action is in flight
- [ ] Messages are Arabic, specific, and tell the user what to do next

**Non-negotiables**
- [ ] All numbers Arabic-Indic (exception: phone numbers)
- [ ] Zero English anywhere in the UI
- [ ] Every amount carries "جنيه"
- [ ] Weights: 3 decimals with a dot
- [ ] Correct Arabic pluralization
- [ ] Admin touch targets ≥ 44px

**Layout**
- [ ] RTL correct
- [ ] Works at 320px with no horizontal scroll
- [ ] No fixed widths from Figma (`w-full` inside padded containers)
- [ ] `min-h-dvh`, not `h-screen`

**Code**
- [ ] `pnpm build` passes
- [ ] No `any`
- [ ] No hardcoded colors or sizes
- [ ] No duplicated components
- [ ] Every file under 200 lines
- [ ] Icons come from `/lib/icons.ts`, not direct imports

---

## 11. Never Do

- ❌ UI elements not present in Figma
- ❌ English in the interface
- ❌ A number rendered without a formatter
- ❌ Electronic payment · chat · ratings · delivery tracking (permanently out of scope)
- ❌ A "better" pattern for the admin app — these users are not typical app users
- ❌ A new library without asking
- ❌ More than one screen per session
- ❌ Reopening a decision in `DECISIONS.md`
- ❌ `npm` or `yarn` (this project uses `pnpm`)
- ❌ Guessing a Hugeicons icon name without verifying it
- ❌ A write action that gives the user no visible feedback
- ❌ A toast for a critical failure (weighing · payment · cancel · cycle end) — use an inline error

---

## 12. When Something Goes Wrong

| Problem | Do this |
|---|---|
| Design conflicts with the FR | **Ask.** Don't pick one yourself |
| Something missing from Figma | Ask: implement it or defer it? |
| A shared component needs changing | Flag that it affects other screens, and name which |
| Build fails | Fix it before ending the session. Never leave a broken build |
| Work is bigger than one session | Split it, ship part one, log the rest in `PROGRESS.md` |
| A Hugeicons name doesn't resolve | Verify via the MCP server or hugeicons.com — don't substitute a guess |
