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
| Order delivered, settled | «تم تسليم الطلب» | success | the order |
| Order delivered, owing | «تم تسليم الطلب» + what was paid and what is left | **warning** | the order |
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

**The delivered notice is the one that is priced on read.** Its tone and its
sentence are a question about money — settled is good news, owed on is a warning —
and money is answered by `computeInvoice`, never stored (D-05). The trigger writes
`event = 'order_delivered'` with a placeholder tone and a neutral sentence;
`listNotifications` runs the same invoice the invoice screen and the history card
run, and replaces both. So the figures are as true the tenth time he opens the
screen as the first, and a payment recorded afterwards moves the notice from
warning to success on its own.

Every other notice is finished the moment it is written.

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

The delivered notice *does* carry figures — because they are computed on read
rather than stored. `notification.event` is what makes that possible: it is the
one thing the database knows for certain about a notice, and the query keys off it
instead of matching on the title.

## New and old

`is_read`. The order of operations is the whole design:

`NotificationFeed` (client) holds the list in `useState` at mount, splits *that*,
and fires the mark-as-read from an effect afterwards.

**The freeze is the mechanism, and it took two failures to find.** First, marking
read in the page body ran before the markup was produced, so everything arrived
already old. Second — and this is the one worth remembering — marking read from an
effect was still undone, because **a Server Action refreshes the route it was
called from, always**, whatever `revalidatePath` is given. The page re-rendered
from the rows the action had just written and every notice slid into «القديمة»
while the customer was reading it.

So the screen stops depending on the server's answer holding still. `useState`
with an initialiser runs once for the life of the component; re-renders from the
action, from `RefreshOnReturn`, from anything, flow past it. Leaving unmounts the
component; coming back mounts it fresh against a server where they are read.

That is also the honest description of the screen: it shows the notifications as
they were when you opened it. Nothing on screen waits for the write — it is for
the bell's badge, on the screen he goes back to.

A heading with nothing under it is not drawn: an empty «الجديدة» claims there is
something to catch up on.

## Data

**Reads:** `listNotifications(customerId)` (new)
**Writes:** `markNotificationsRead()` (new) — the one notification write a customer
is allowed, and `notification_update` already allowed exactly it.

## Components

New: `StatusBubble` (`/components/ui`) · `NotificationRow` · `NotificationFeed`
· `formatTimeAgo()`
Reused: `PageHeader` · `CountBadge` (the bell's badge already existed)

`StatusBubble` is **the exported vector, not a disc with an icon in it** (Figma
4129:4435). Each of the three is its own speech balloon with its own tail, at its
own size — the warning is 42px where the other two are 38 — so nothing built out
of a circle and a glyph could have stood in for them.

The paths are copied out of the SVG exports; the two fills per bubble are bound to
tokens (`Surface/*` behind `Icons/*`, the same pairs the toast uses) rather than
the hex baked into the export. One new token came with them:
`--color-success-soft: #4ade80`, the tick's green.

Inlined rather than three files in `/public`: this screen draws one per row, and a
list that fetches an image per line flickers its way down the page the first time
it opens.

`CountBadge` gained a `tone` and a `placement`: lime and overhanging on the nav,
the contact pill's orange and tucked flush on the bell. Lime sat an inch above a
lime tab bar and read as decoration; the 5px overhang leaned out of a tap target
that is already at the edge of the header. Both are named props rather than a
`className` to override with — `cn()` does not merge Tailwind (T-64) — so the
admin's own badge can pick its pair when it needs one.

## Connected screens

← from: the bell in `HomeHeader` · back goes to `/`
→ to: `/tracking/[orderId]` — a notice about an order opens it (Khaled,
2026-08-25). The welcome and the sale opening are about no order and are not
links.

## Watch out

- The bubbles are **mirrored** (`-scale-x-100`): Figma exports these three assets
  flipped from what it draws on the canvas. Measured, not guessed — the success
  tail is at x≈11 on the canvas and x≈26 in the export, and the tick's long arm
  rises right on the canvas and left in the export.
- The bubble is on the **right** and «منذ …» on the **left** — the mark comes
  before the words it marks, and the timestamp is parked where the eye finishes.
- **Migration 029 must be run** before this screen opens — the read asks for
  `kind`, which does not exist without it.
- No bottom bar: `/notifications` is in `SCREENS_WITHOUT_NAV`. The title and its
  back button are `sticky top-0` over `bg-background` — that button is the only
  way off this screen, and a way out that scrolls away is one you have to scroll
  back for.
- Notifications are never deleted. A customer accumulates roughly one per order
  plus one per cycle; if that ever becomes a long list, the fix is paging this
  query, not pruning rows the customer might still want.
