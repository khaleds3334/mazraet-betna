# C-15 — «الرسائل و الاشعارات»

**Route:** `/notifications`
**Figma node:** 2919:4496
**FR:** FR-31
**States:** New + old · New only · Old only · Empty

## The thing that decided the architecture

One line of `002_rls.sql`:

```sql
create policy notification_insert on notification
  for insert with check (private.is_admin(farm_id));
```

**Only an admin may write a notification.** So the customer's app cannot announce
his own order — his session is refused — and loosening the policy to let it would
also let one customer write notifications to another.

So the database writes them, on the events themselves (migration 029). The same
conclusion migration 026 reached about the sale closing itself: a rule that must
hold no matter who is acting belongs where the thing actually happens. Here the
writers are already two apps and a psql prompt, and FR-16 will be a third.

## The six events

| Event | Title | Tone | Links to |
|---|---|---|---|
| Customer account created | «اهلا بيك في مزرعة بيتنا» | success | — |
| Order placed | «تم استلام طلبك بنجاح» | success | the order |
| Order weighed | «الفاتورة جاهزة» | success | the order |
| Order ready | «طلبك جاهز للاستلام» | success | the order |
| Order cancelled | «تم الغاء طلبك» + the reason | error | the order |
| Sale opened | «تم البدء في فترة البيع» | warning | — |

«تم الوزن» is the one the customer has something to **do** about — everything else
reports, that one asks him to confirm the price (D-67) — which is why it is on the
list even though the design does not draw it.

**The sale opening is the only fan-out**: one row per customer of the farm, in a
single `insert … select`. Guarded on the *edge* (`false → true`), not the value —
`sync_sale_with_flock` writes `sale_open` on every order and every mortality row,
and without the edge test every bird sold would re-announce the sale.

**Orphan and house orders notify nobody** (FR-13, FR-36): one has no customer, the
other is not a sale.

## No numbers in the database

The stored bodies carry no order number, no total, no date. Every number this app
shows a human goes through `/lib/format.ts` in Arabic-Indic digits (rule 3), and
storing «طلبك رقم ١٢٢٤#» would have meant a second implementation of that in SQL.

Each body is instead written to read *after* that prefix, and `NotificationRow`
puts the number on the front with the real formatter, from the joined order.

**Consequence for FR-31:** the «جاهز للاستلام» notice does not carry the total, as
FR-31's wording asks. Tapping it opens the invoice, which is one tap and always
right, where a total frozen into a sentence would be a second copy of
`computeInvoice` written in SQL.

## New and old

`is_read`. The order of operations is the whole design:

1. read the list
2. split on `is_read` — «الجديدة» at full strength, «القديمة» at half
3. render
4. **then** mark the unread ones read (`MarkNotificationsRead`, a client component
   mounted at the foot of the page)

Marking before rendering would file everything under «القديمة» while he is reading
it for the first time. Marking after means new today, old tomorrow.

Nothing on screen waits for step 4 — it is for the bell's badge, on the screen he
goes back to, which `revalidatePath("/", "layout")` redraws.

A heading with nothing under it is not drawn: an empty «الجديدة» claims there is
something to catch up on.

## Data

**Reads:** `listNotifications(customerId)` (new)
**Writes:** `markNotificationsRead()` (new) — the one notification write a customer
is allowed, and `notification_update` already allowed exactly it.

## Components

New: `StatusBubble` (`/components/ui`) · `NotificationRow` · `MarkNotificationsRead`
· `formatTimeAgo()`
Reused: `PageHeader` · `CountBadge` (the bell's badge already existed)

`StatusBubble` takes the toast's three tones from the same token pairs — the same
three things are being said, and a customer should not have to learn two colour
languages because one of them fades after four seconds.

## Connected screens

← from: the bell in `HomeHeader` · back goes to `/`
→ to: `/tracking/[orderId]` — a notice about an order opens it (Khaled,
2026-08-25). The welcome and the sale opening are about no order and are not
links.

## Watch out

- **Migration 029 must be run** before this screen opens — the read asks for
  `kind`, which does not exist without it.
- No bottom bar: `/notifications` is in `SCREENS_WITHOUT_NAV`.
- Notifications are never deleted. A customer accumulates roughly one per order
  plus one per cycle; if that ever becomes a long list, the fix is paging this
  query, not pruning rows the customer might still want.
