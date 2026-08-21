-- ───────── The farm's public number, and changing the PIN from settings ─────────
--
-- 1. `farm.contact_phone` — the number customers ring.
--
-- `owner_phone` already exists, but it does one job: it routes a login to the
-- admin flow (FR-1). Publishing it as the farm's contact number ties two
-- unrelated things together — the admin cannot hand out a shop number, or change
-- the number customers call, without changing the number he signs in with.
--
-- Nullable, and read with `coalesce(contact_phone, owner_phone)`: a farm that has
-- never set one still has a number to publish, which is what every existing farm
-- expects today.
--
-- 2. `set_admin_pin()` — FR-1ب, changing the PIN from settings.
--
-- Mirrors `verify_admin_pin` (migration 004) exactly: `admin_credentials` has no
-- RLS policy (T-14), bcrypt lives in Postgres, so hashing happens in a
-- SECURITY DEFINER function locked to the service role. The browser can never
-- reach it, and a plaintext PIN never leaves the server.
--
-- It re-checks the current PIN inside the same call rather than trusting the
-- caller to have checked first: knowing the old PIN is what authorises the
-- change, and splitting the check from the write leaves a window where only the
-- session matters. Returns false when the old PIN is wrong — the caller cannot
-- tell that from "no such farm", which is the point.
--
-- Safe to run more than once.

alter table farm
  add column if not exists contact_phone text;

comment on column farm.contact_phone is
  'The number customers ring (FR-30). Null = fall back to owner_phone. Kept apart from owner_phone, which only routes the admin login.';

create or replace function public.set_admin_pin(
  _farm_id uuid,
  _current_pin text,
  _new_pin text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  -- Six digits, enforced here as well as in the app: this function is the only
  -- way a PIN is ever written, so it is the only place the rule cannot be missed.
  if _new_pin !~ '^[0-9]{6}$' then
    return false;
  end if;

  select exists (
    select 1 from admin_credentials
    where farm_id = _farm_id and pin_hash = crypt(_current_pin, pin_hash)
  ) into ok;

  if not ok then
    return false;
  end if;

  update admin_credentials
  set pin_hash = crypt(_new_pin, gen_salt('bf')),
      updated_at = now()
  where farm_id = _farm_id;

  return true;
end;
$$;

revoke all on function public.set_admin_pin(uuid, text, text) from public, anon, authenticated;
grant execute on function public.set_admin_pin(uuid, text, text) to service_role;
