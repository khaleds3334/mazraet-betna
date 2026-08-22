-- ────────── The flock keeps the sale honest, from the database down ──────────
-- «الفراخ المتوفرة» decides whether a sale is open (FR-11), and the app has been
-- keeping the two in step by remembering to call `syncSaleWithFlock` from every
-- action that moves the count. That is a rule enforced by memory, and it failed
-- twice in one evening — a cancelled order left the sale shut, and a bird
-- recorded as dead left it open over an empty farm (Khaled, 2026-08-22).
--
-- Both times the logic was right and a writer had not been wired in. The writer
-- that forgets is always the one added later, and FR-16 (editing an order) is the
-- next one due.
--
-- So the rule moves to where the count actually changes. Anything that touches
-- an order's lines, an order's status, or a mortality row now brings the sale
-- into line — including a correction typed straight into the database, which no
-- amount of care in the app could have covered.
--
-- The app-side `syncSaleWithFlock` stays. It costs one read, it is where the
-- reasoning is written in prose, and a belt is worth keeping when the braces are
-- invisible.
--
-- Safe to run more than once. Depends on migration 025.

-- ─────────────────────────── The rule itself ───────────────────────────
-- SECURITY DEFINER for the same reason the RLS helpers are: it counts rows the
-- caller may not be allowed to see. A customer placing an order cannot read the
-- farm's mortality or anyone else's lines, and the count would come back wrong
-- through his session (T-58) — the whole failure this is meant to end.
create or replace function private.sync_sale_with_flock(_cycle_id uuid)
returns void language plpgsql security definer set search_path = public, private as $$
declare
  c      record;
  birds  numeric;
begin
  if _cycle_id is null then return; end if;

  select id, chick_count, is_active, sale_open, sale_auto_closed, selling_started_at
    into c
    from public.cycle
   where id = _cycle_id;

  if not found or not c.is_active then return; end if;

  -- A flock still being raised has no sale to bring into line.
  if c.selling_started_at is null and not c.sale_open then return; end if;

  -- Neither open nor closed by the flock: the admin closed it himself, and his
  -- decision stands until he changes it (D-58).
  if not c.sale_open and not c.sale_auto_closed then return; end if;

  birds := c.chick_count
    - coalesce((select sum(m.count) from public.mortality m
                 where m.cycle_id = c.id), 0)
    - coalesce((select count(ol.id) from public.order_line ol
                  join public.orders o on o.id = ol.order_id
                 where o.cycle_id = c.id and o.status <> 'cancelled'), 0);

  if c.sale_open and birds <= 0 then
    update public.cycle
       set sale_open = false,
           sale_auto_closed = true,
           selling_ended_at = coalesce(selling_ended_at, now())
     where id = c.id;

  elsif c.sale_auto_closed and birds > 0 then
    update public.cycle
       set sale_open = true,
           sale_auto_closed = false,
           selling_ended_at = null   -- selling did not end after all
     where id = c.id;
  end if;
end;
$$;

comment on function private.sync_sale_with_flock(uuid) is
  'Opens or closes the sale to match what is left of the flock (FR-11). Never touches a sale the admin closed himself. Mirrored in TypeScript as syncSaleWithFlock — both may run; the second finds nothing to do.';

-- ──────────────────────────── The three doors ────────────────────────────
-- Row-level rather than statement-level: the cycle id is one column away on
-- every one of these, and the recount is two index scans on a farm with tens of
-- orders. Clarity is worth more here than the saved passes.

-- Birds are committed and released one line at a time (D-13).
create or replace function private.sync_sale_from_order_line()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  perform private.sync_sale_with_flock((
    select o.cycle_id from public.orders o
     where o.id = coalesce(new.order_id, old.order_id)
  ));
  return null;
end;
$$;

drop trigger if exists order_line_sync_sale on order_line;
create trigger order_line_sync_sale
  after insert or update or delete on order_line
  for each row execute function private.sync_sale_from_order_line();

-- Cancelling hands a whole order's birds back; un-cancelling takes them again.
create or replace function private.sync_sale_from_orders()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  perform private.sync_sale_with_flock(coalesce(new.cycle_id, old.cycle_id));
  return null;
end;
$$;

drop trigger if exists orders_sync_sale on orders;
create trigger orders_sync_sale
  after insert or update or delete on orders
  for each row execute function private.sync_sale_from_orders();

-- A death takes a bird out of the flock exactly as an order does.
create or replace function private.sync_sale_from_mortality()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  perform private.sync_sale_with_flock(coalesce(new.cycle_id, old.cycle_id));
  return null;
end;
$$;

drop trigger if exists mortality_sync_sale on mortality;
create trigger mortality_sync_sale
  after insert or update or delete on mortality
  for each row execute function private.sync_sale_from_mortality();

-- ───────────────────────────── Catch up now ─────────────────────────────
-- Every running cycle brought into line once, so nothing carries yesterday's
-- disagreement into a database that will not allow one from here on.
select private.sync_sale_with_flock(id) from cycle where is_active;
