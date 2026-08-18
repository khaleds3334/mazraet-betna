-- Let the seq counters be omitted on insert.
--
-- 009 left `seq` NOT NULL with no default, so the generated TypeScript types
-- demanded it on every insert even though the trigger is what assigns it.
-- Giving it a default of 0 makes it optional in code, and the triggers treat 0
-- exactly like null: a real number is 1 or higher, so 0 can only ever mean
-- "nobody set this".

alter table cycle alter column seq set default 0;
alter table orders alter column seq set default 0;

create or replace function private.assign_cycle_seq()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.seq, 0) = 0 then
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
  if coalesce(new.seq, 0) = 0 then
    select coalesce(max(seq), 0) + 1 into new.seq
    from orders where cycle_id = new.cycle_id;
  end if;
  return new;
end;
$$;
