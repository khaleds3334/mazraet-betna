-- Human-readable numbers for cycles and orders.
--
-- The admin says "طلب رقم ١٠٠٤" out loud, so a UUID is useless to him. The
-- displayed number is built from two sequences (Khaled, 2026-08-18):
--   cycle.seq  — 1, 2, 3 … per farm
--   orders.seq — 1, 2, 3 … per cycle
-- and rendered as cycle.seq followed by orders.seq padded to 3 digits:
-- order 4 of cycle 1 → #1004. The formatting lives in /lib/format.ts; the
-- database only owns the two counters.

alter table cycle add column if not exists seq integer;
alter table orders add column if not exists seq integer;

-- Backfill existing rows in the order they were actually created.
with ranked as (
  select id, row_number() over (
    partition by farm_id order by start_date, created_at
  ) as rn
  from cycle
)
update cycle c set seq = ranked.rn from ranked where ranked.id = c.id;

with ranked as (
  select id, row_number() over (
    partition by cycle_id order by created_at
  ) as rn
  from orders
)
update orders o set seq = ranked.rn from ranked where ranked.id = o.id;

-- Assign the next number on insert. SECURITY DEFINER so the counter is read
-- over the whole farm/cycle even when RLS would hide a row from the caller.
create or replace function private.assign_cycle_seq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.seq is null then
    select coalesce(max(seq), 0) + 1 into new.seq
    from cycle where farm_id = new.farm_id;
  end if;
  return new;
end;
$$;

create or replace function private.assign_order_seq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.seq is null then
    select coalesce(max(seq), 0) + 1 into new.seq
    from orders where cycle_id = new.cycle_id;
  end if;
  return new;
end;
$$;

drop trigger if exists cycle_assign_seq on cycle;
create trigger cycle_assign_seq
  before insert on cycle
  for each row execute function private.assign_cycle_seq();

drop trigger if exists orders_assign_seq on orders;
create trigger orders_assign_seq
  before insert on orders
  for each row execute function private.assign_order_seq();

alter table cycle alter column seq set not null;
alter table orders alter column seq set not null;

-- Two orders can't share a number: if two inserts ever race, the second fails
-- loudly instead of silently duplicating a number the admin reads out.
create unique index if not exists cycle_farm_seq_key on cycle (farm_id, seq);
create unique index if not exists orders_cycle_seq_key on orders (cycle_id, seq);
