-- ───────── Creating a farm from the app, PIN and all ─────────
--
-- A farm is not one row. It is `farm` + its `settings` + the bcrypt PIN in
-- `admin_credentials`, and the last of those can only be written where bcrypt
-- lives — inside Postgres, by the service role, since `admin_credentials` has no
-- RLS policy (T-14). So the whole thing is made here, in one transaction: a farm
-- that exists without a PIN is a farm nobody can sign into, and one with a PIN
-- but no settings prices every order at zero.
--
-- Used today only by the dev-only /new-farm page, which exists to spin up test
-- farms and is compiled out of production builds. It is written as real farm
-- onboarding rather than a test fixture because that is what it will become —
-- the schema has been multi-tenant since day one (D-08).
--
-- Refuses a number that already belongs to a farm: login finds the admin by
-- number, so two farms on one number makes both unreachable.
--
-- Returns the new farm's id, or null if the number is taken.
--
-- Safe to run more than once.

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
  insert into settings (farm_id, available_weights, pickup_times)
    values (new_farm, '{1.500,1.750,2.000,2.250,2.500}',
            array['10:00','13:00','16:00','19:00']);

  insert into admin_credentials (farm_id, pin_hash)
    values (new_farm, crypt(_pin, gen_salt('bf')));

  return new_farm;
end;
$$;

revoke all on function public.create_farm(text, text, text) from public, anon, authenticated;
grant execute on function public.create_farm(text, text, text) to service_role;
