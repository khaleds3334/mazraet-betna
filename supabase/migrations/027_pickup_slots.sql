-- ───────── A pickup slot is a name the customer says and a time the app knows ─────────
-- `settings.pickup_times` held four clock values — 10:00, 13:00, 16:00, 19:00 —
-- and nothing else. But the customer's order screen (C-24) does not offer clock
-- times; it offers «قبل صلاة الظهر» and «قبل المغرب». That is how these customers
-- name a time of day, and an elderly one reading «١٦:٠٠» has to convert it in his
-- head to the thing he actually means.
--
-- The obvious move is to store the names instead. It is also wrong: the app has
-- to know that «قبل المغرب» is later than «قبل صلاة الظهر», because a customer
-- ordering at five in the afternoon must not be offered this morning's slot
-- (Khaled, 2026-08-23). Names alone cannot answer that. Clock values alone
-- cannot be read aloud.
--
-- So a slot is both. `label` is what the customer picks; `time` is what orders it
-- and says whether it has already passed. `orders.pickup_time` keeps storing the
-- clock value, so nothing downstream changes — the admin's order card looks the
-- label up from here rather than printing the clock back at him.
--
-- ⚠️ The clock anchors below are estimates. Prayer times move through the year,
-- and these are approximate pegs for ordering and for "has it passed", not a
-- claim about when Dhuhr is. Review them (D-65).
--
-- Safe to run more than once. Depends on migration 001.

alter table settings
  add column if not exists pickup_slots jsonb not null default '[]'::jsonb;

comment on column settings.pickup_slots is
  'Pickup slots as [{"time":"HH:MM","label":"..."}], ordered. `label` is what the customer sees (C-24); `time` orders them and decides whether a slot has passed today. Replaces pickup_times.';

-- The six slots the design offers (C-24, node 3155:4717). Written for every farm
-- that has not been given its own set yet, so an existing farm and a brand-new
-- one start the same.
update settings
   set pickup_slots = '[
         {"time": "09:00", "label": "في التاسعة صباحا"},
         {"time": "11:00", "label": "قبل صلاة الظهر"},
         {"time": "13:30", "label": "بعد صلاة الظهر"},
         {"time": "15:00", "label": "قبل العصر"},
         {"time": "16:30", "label": "بعد صلاة العصر"},
         {"time": "17:30", "label": "قبل المغرب"}
       ]'::jsonb
 where pickup_slots = '[]'::jsonb;

-- New farms get them too. `create_farm` (migration 022) seeded `pickup_times`;
-- it now seeds the slots instead. Everything else about it is unchanged — it is
-- restated in full because `create or replace` takes no smaller edit.
create or replace function public.create_farm(
  _name text,
  _owner_phone text,
  _pin text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_farm uuid;
begin
  if _pin !~ '^[0-9]{6}$' then
    return null;
  end if;
  if exists (select 1 from farm where owner_phone = _owner_phone) then
    return null;
  end if;

  insert into farm (name, owner_phone)
    values (_name, _owner_phone)
    returning id into new_farm;

  -- The defaults a farm can actually take an order with. Weights match
  -- OFFERED_WEIGHTS in /lib/constants.ts; prices are left at zero deliberately,
  -- so the admin sets them in settings rather than selling at a number nobody
  -- chose.
  insert into settings (farm_id, available_weights, pickup_slots)
    values (new_farm, '{1.500,1.750,2.000,2.250,2.500}',
            '[{"time": "09:00", "label": "في التاسعة صباحا"},
              {"time": "11:00", "label": "قبل صلاة الظهر"},
              {"time": "13:30", "label": "بعد صلاة الظهر"},
              {"time": "15:00", "label": "قبل العصر"},
              {"time": "16:30", "label": "بعد صلاة العصر"},
              {"time": "17:30", "label": "قبل المغرب"}]'::jsonb);

  insert into admin_credentials (farm_id, pin_hash)
    values (new_farm, crypt(_pin, gen_salt('bf')));

  return new_farm;
end;
$$;

-- Nothing reads `pickup_times` any more. A column left behind is a column the
-- next reader trusts.
alter table settings drop column if exists pickup_times;


-- ───────────── «الفراخ المتوفرة», answered for the customer too ─────────────
-- The order screen caps its counter at what is left of the flock (Khaled,
-- 2026-08-23), which means the customer's session has to be able to count it.
-- It cannot: RLS hides other customers' orders and all mortality, so counting
-- through his session returns the whole flock as available — the exact failure
-- recorded in T-58, arriving from a third side.
--
-- SECURITY DEFINER for the same reason `private.sync_sale_with_flock` is: it
-- counts rows the caller may not read. It still refuses a farm the caller has
-- nothing to do with, so the definer rights buy exactly one number and no more.
create or replace function public.available_chickens(_farm_id uuid)
returns integer language plpgsql security definer set search_path = public, private as $$
declare
  c     record;
  birds integer;
begin
  if _farm_id is null then return 0; end if;

  -- The admin of this farm, or one of its customers. Anyone else gets nothing.
  if not (private.is_admin(_farm_id)
          or _farm_id in (select private.my_customer_farms())) then
    return null;
  end if;

  select id, chick_count into c
    from cycle
   where farm_id = _farm_id and is_active
   limit 1;

  if not found then return 0; end if;

  birds := c.chick_count
    - coalesce((select sum(m.count) from mortality m
                 where m.cycle_id = c.id), 0)
    - coalesce((select count(ol.id) from order_line ol
                  join orders o on o.id = ol.order_id
                 where o.cycle_id = c.id and o.status <> 'cancelled'), 0);

  return greatest(birds, 0);
end;
$$;

comment on function public.available_chickens(uuid) is
  'Birds still free to sell on the farm''s active cycle (FR-11), counted with definer rights so a customer session gets the real number instead of one RLS has hidden rows from (T-58). Returns null for a farm the caller has no relationship with.';

revoke all on function public.available_chickens(uuid) from public;
grant execute on function public.available_chickens(uuid) to authenticated;
