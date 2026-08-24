-- ─────── The customer sees the price, and releases the birds for slaughter ───────
-- Between «تم وزن الفراخ» and «جاهز للاستلام» there is a step nothing in the
-- database could express: the customer opens the invoice, reads what the birds
-- actually came to, and says go ahead (C-41 «التأكيد و الذبح»). Only then are the
-- birds slaughtered and cleaned — which is why C-42 exists as its own screen.
--
-- **It is not a status.** `order_status` runs pending → weighed → ready →
-- delivered, and those are the admin's stages: each one is a thing he does. This
-- is a thing the *customer* does, in the middle of «weighed», and the admin's
-- work does not change because of it — he still marks the order ready when it is
-- ready. Adding a fifth status would put a step the admin never takes into the
-- middle of his tabs, and every screen that groups by status would have to learn
-- to ignore it.
--
-- So it is a timestamp on the order, and the stage is read off it:
-- `status = 'weighed' and price_confirmed_at is not null` = «يتم الذبح و التنظيف».
-- Same shape as `weighed_at`, `delivered_at`, `cancelled_at` — the moments an
-- order passed through, kept beside it.
--
-- Safe to run more than once. Depends on migration 001.

alter table orders
  add column if not exists price_confirmed_at timestamptz;

comment on column orders.price_confirmed_at is
  'When the customer pressed «التأكيد و الذبح» (C-41): they have read the invoice and released the birds for slaughtering. Non-null on a weighed order = the «يتم الذبح و التنظيف» stage. Never set by the admin, and never a status of its own — orders.status stays ''weighed'' until he marks the order ready.';


-- ───────────────── The one thing a customer may change on their order ─────────────────
-- `orders_update` (migration 002) is admin-only, deliberately: D-04 says the
-- customer app cannot edit or cancel an order, because by the time it is weighed
-- the birds are already committed. That has to stay true — and RLS cannot say
-- "this customer may write this ONE column". A policy sees the finished row, not
-- which fields moved, so opening `orders` to the customer for a timestamp would
-- open it for `status`, `unit_price` and everything else on the row.
--
-- A definer function is the whole permission instead: it can write exactly one
-- column, on exactly one order, and only for the customer who owns it. The
-- narrow door stays narrow.
--
-- It is idempotent on purpose (`coalesce`). A customer whose tap looked like it
-- did nothing taps again — that is the reason rule 11 exists — and the second tap
-- must not rewrite the moment of the first.
create or replace function public.confirm_order_price(_order_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  stamped timestamptz;
begin
  update orders o
     set price_confirmed_at = coalesce(o.price_confirmed_at, now())
   where o.id = _order_id
     -- Only from the stage the button appears on. A pending order has no price
     -- to confirm yet, and a delivered one is over.
     and o.status = 'weighed'
     and exists (
       select 1 from customer c
        where c.id = o.customer_id
          and c.auth_user_id = auth.uid()
     )
  returning o.price_confirmed_at into stamped;

  -- null = nothing matched: not their order, or not at a stage where the
  -- question is being asked. The caller turns that into one Arabic sentence
  -- rather than telling a customer which of the two it was.
  return stamped;
end;
$$;

comment on function public.confirm_order_price(uuid) is
  'Stamps orders.price_confirmed_at for the calling customer''s own weighed order (C-41 «التأكيد و الذبح»). Definer rights because orders_update is admin-only (D-04) and RLS cannot restrict a write to a single column. Idempotent; returns the stamp, or null when the order is not theirs or not weighed.';

revoke all on function public.confirm_order_price(uuid) from public;
grant execute on function public.confirm_order_price(uuid) to authenticated;
