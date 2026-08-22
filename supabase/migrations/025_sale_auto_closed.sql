-- ────────── Who closed the sale: the admin, or the flock running out ──────────
-- «الفراخ خلصت» used to be worked out on every screen that showed it, and never
-- written. That cost two bugs in one day — the admin's badge read `sale_open` and
-- said «البيع متوفر» over an empty flock, and the customer's copy of the same
-- count ran through his own session, where RLS hides other people's orders and
-- all mortality, so it came back with a hundred birds available out of none
-- (T-58). Worse, `selling_ended_at` was never stamped: the moment the flock sold
-- out went unrecorded, even after the cycle was closed (Khaled, 2026-08-22).
--
-- So the state is stored, and this column says **why** it is closed — which is
-- the whole difference between a close that must be undone by hand and one that
-- undoes itself:
--
--   • `false` — the admin's own switch. Only he opens it again.
--   • `true`  — the last bird went. He cannot reopen it, because there is
--               nothing to sell; cancelling an order hands birds back and the
--               sale reopens on its own.
--
-- Safe to run more than once.

alter table cycle
  add column if not exists sale_auto_closed boolean not null default false;

comment on column cycle.sale_auto_closed is
  'True when the sale was closed by the flock running out rather than by the admin. Such a sale reopens by itself when birds come back (a cancelled order); the admin cannot reopen it by hand. Always false while sale_open is true.';

-- Catch up the running cycle. A flock already sold out has been sitting with
-- `sale_open = true` because nothing was writing it, and the two screens have
-- been disagreeing about it ever since.
with available as (
  select
    c.id,
    c.chick_count
      - coalesce((select sum(m.count) from mortality m where m.cycle_id = c.id), 0)
      - coalesce((
          select count(ol.id)
          from order_line ol
          join orders o on o.id = ol.order_id
          where o.cycle_id = c.id and o.status <> 'cancelled'
        ), 0) as birds
  from cycle c
  where c.is_active
)
update cycle c
set sale_open = false,
    sale_auto_closed = true,
    selling_ended_at = coalesce(c.selling_ended_at, now())
from available a
where a.id = c.id
  and a.birds <= 0
  and (c.selling_started_at is not null or c.sale_open);
