# C-10→C-12 — Customer Home

**Route:** `/`
**Figma section:** 3369:5043 (frames 2918:3685 · 2919:4226 · 2919:4323)
**FR:** FR-25 (sale status), FR-26 (price context), FR-27 (order entry point), FR-30 (debts — deferred to sidebar screen)
**States:** SaleOpen_Empty (C-10) · SaleOpen_ActiveOrders (C-11) · SaleClosed (C-12)

## What it does
The customer's landing screen. Shows the sale status with a live countdown, the
two main actions (order / order history), and the app shell (header + sidebar +
bottom nav). The order button only works while the sale is open.

## States
- **C-10** — sale open, no active orders: orange "البيع متوفر" chip, green
  countdown to sale close, order button active, no badges.
- **C-11** — sale open + active orders: same, plus a bell unread badge and a
  "تتبع الطلب" badge (count of in-progress orders).
- **C-12** — sale closed: red "البيع مغلق" chip, red countdown to sale start,
  order button blurred and inert.

## Data
**Reads:**
- `cycle` (active) → `sale_open`, `sale_closes_at`, `start_date` — sale state + countdown target
- `settings` → `raising_period_days` — expected sale start when closed
- `orders` → count of the customer's in-progress orders (pending/weighed/ready) → nav badge
- `orders` + `order_line` + `payment` → total outstanding debt (computeInvoice/orderRemaining) → sidebar debt card
- `notification` → count of the customer's unread → bell badge
- `customer` → id, name, farm_id (name shows in the sidebar)

**Writes:** none. Sign-out (`signOut` action) from the sidebar.

## Calculations
- Countdown target: sale open → `sale_closes_at`; sale closed →
  `expectedSaleDate(start_date, raising_period_days)` from `/lib/calculations/cycle`.

## Components
New: `SaleStatusCard` · `HomeHeader` · `ContactButton` (customer) · `BottomNav` · `Sidebar` · `NavIcon` (layout) · `useCountdown` (hook)
Reused: `Icon`, `Toaster`

## Bottom nav
`BottomNav` is `position: fixed` (not sticky) so the mobile browser's dynamic
toolbar can't make it lurch; the layout's `main` reserves space with a bottom
padding. Its icons are project-owned SVGs (`NavIcon`, T-19): active = filled,
inactive = outline, same color.

## Icons
`menu` · `notification` · `home` · `add` · `order` · `invoice` · `user` · `close` · `logout` · `info`

## Feedback
No write actions on the screen itself, so no toasts here. Sign-out redirects to `/login`.

## Connected screens
← from: login / register / pin (post-auth landing)
→ to: `/order` (order button) · `/history` (history button + sidebar) · `/tracking` (nav + sidebar) · `/notifications` (bell + sidebar)

## Watch out
- The bottom nav lives in `(customer)/layout` and is shared; the header + sidebar
  are home-only for now (only the home shows the ☰ button).
- Sidebar (C-13) matches the design: greeting + debt card (المستحق للسداد, real
  computed debt) + nav (home / history / about / contact) + FAQ + logout.
  "حول التطبيق", "تواصل معنا", FAQ and the settings gear are placeholders (no
  destination yet); home/history navigate; logout runs the `signOut` action.
  The scrim behind it is a semi-transparent layer over the still-mounted home.
- Help pill "محتاج مساعدة ؟" is presentational only — no destination decided yet.
- Countdown numbers use `suppressHydrationWarning` (server vs client clock differ by design).

## Route structure decision
Customer app owns `/`; admin app lives under `/admin` (see DECISIONS T-18). Post-login
landing and route protection are role-based in the middleware.
