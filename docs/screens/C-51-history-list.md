# C-51 / C-52 — Previous orders, the list

**Route:** `/history`
**Figma nodes:** 3185:4971 (list) · 3185:5460 (filtered to «مدفوع»)
**FR:** FR-29, FR-12, FR-30
**States:** Filled · Filtered · Filtered-to-nothing · Empty (C-50, same page)

## What it does

Every order that has finished, newest first, with three filters over it. "Finished"
is both ways an order can end — **delivered** and **cancelled**. A cancelled order
belongs here rather than nowhere: it happened to him, it carries a reason he may
want to re-read, and the screen has a filter for exactly that.

The other half of the same split the tracking screen makes: what is still running
is there, what is over is here. An order crosses from one to the other the moment
the admin marks it handed over.

## Data

**Reads:** `listCustomerPastOrders(farmId, customerId)` (new) · `getActiveSaleState`
(for the empty state's call to action)
**Writes:** none

`cancelled_at` was added to `ORDER_COLUMNS` and `OrderListItem` for this screen —
the cancelled card dates its ending, and nothing had needed that column before.

`countPastOrders` was deleted in the same change: the page now reads the list it
was counting, and a count of a list you already have is a second query answering
a question the first one answered.

## Calculations

`computeInvoice` per card — total, paid, remaining (D-05, computed on read). The
filter categories come off the same numbers, so a card and its chip can never
disagree.

## The three cards

| Card | Pills | Middle | Closing line |
|---|---|---|---|
| Delivered, settled | «تم الاستلام» · «تم الدفع» | count · final price | «تم تسليم الطلب في …» |
| Delivered, owing | «تم الاستلام» · «متبقي … ج» | count · final price · paid so far | «تم تسليم الطلب في …» |
| Cancelled | «تم الغاء الطلب» | the reason, centred | «تم الغاء الطلب في …», one line |

**Two pills, not one.** On tracking the status *is* the news; here it is settled —
every delivered card says the same thing — so the second pill carries what the
customer actually opened the screen for: paid, or how much is left.

**«المبلغ المدفوع» only while it means something.** On a settled order it is the
final price written twice, and the pill above has already answered the only
question left. Same rule as the invoice on C-41.

**A house order** (FR-36) is never a sale, so it is never owed on: it wears the
settled pill («مش محسوب») and files under «مدفوع».

**A cancelled card opens nothing, and so has no arrow.** C-45/C-46 are an invoice
and a payment history; an order that was called off has neither, and everything it
has to say is the reason already on its face. The arrow is the only thing that
says a card leads somewhere, so the two go together — `OrderCardShell` drops both
when no `href` is passed. Its closing date then runs on one line, in the width the
arrow left behind.

## The filters

`مدفوع` · `عليه فلوس` · `ملغي` — in that order, which RTL puts starting from the
right, as drawn.

- **Centred**, under a centred title and a centred caption.
- **One at a time.** They are not overlapping questions.
- **Nothing selected is the fourth state.** The screen opens on everything, and
  tapping the lit chip puts it back. The design draws no «الكل», and the way out
  of a filter is the chip that got you into it.
- **Filtering is client-side.** A customer's finished orders are a handful and
  they are already on the page; a round trip per chip would put a spinner between
  him and a list he is looking at.
- **Filtered to nothing** gets one line — «مفيش طلبات في القسم ده» — not the
  empty-state crate. He *has* orders; «اطلب دلوقتي» would be answering a question
  he did not ask.

## What scrolls

**Only the cards.** The title, the caption and the chips are one `sticky top-0`
block with the page background under it — the chips are how you steer this
screen, and a control that scrolls away is one you have to scroll back for to
change your mind.

`sticky`, not `fixed`: the scroller is `<main>`, and a fixed block would position
against the viewport instead and land over the shell's own chrome.

That block lives in `HistoryList` so all three pinned things share one background.
The empty state draws the same `HistoryHeading`, unpinned — it has nothing to
scroll.

## Components

New: `HistoryList` · `HistoryCard` · `HistoryHeading` · `OrderCardShell` +
`OrderCardRows`
Reused: `PageHeader` · `Chip` · `OrderStatusBadge` · `EmptyOrders` (C-50 branch)

`OrderCardShell` is the tracking card's shape, lifted out so both lists draw one
card. `TrackingCard` was rewritten onto it in the same change and lost nothing.

`OrderStatusBadge` gained `reads="handover"`: a delivered order's pill can report
either that the birds arrived or that the money did, and this is the only screen
with room to say both.

`ORDER_STATUS_LABEL.customer.cancelled` changed from «ملغي» to «تم الغاء الطلب» —
its first real use is here, three lines under a «ملغي» filter chip, and a pill
wearing the filter's word reads as the filter.

## Connected screens

← from: the tracking bar's «الطلبات السابقة» · back goes to `/`
→ to: `/tracking/[orderId]` — C-45 (paid) / C-46 (owing), next up

## Watch out

- No bottom bar: `BottomNav` stands itself down on `/history`. The room `<main>`
  reserves for it is deliberately left in place (Khaled, be2f38e).
- The card gaps are uniform 14px, as on the tracking card. The design's first gap
  measures ~22px on the two-pill cards, which is a consequence of the taller
  header rather than a different rhythm — worth an eye on the phone.
