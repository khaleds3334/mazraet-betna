-- 004_verify_admin_pin — server-only check of the admin PIN.
--
-- The PIN is stored as a bcrypt hash (pgcrypto) in admin_credentials, which has
-- no RLS policy (T-14) — only the service role can read it. Verification has to
-- happen where bcrypt lives (Postgres), so this SECURITY DEFINER function does
-- the crypt() compare and returns only a boolean.
--
-- It is locked to the service_role: the browser (anon/authenticated) cannot call
-- it, so PINs can't be brute-forced from the client. The server calls it through
-- the service-role client during the admin login flow.

create or replace function public.verify_admin_pin(_farm_id uuid, _pin text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from admin_credentials
    where farm_id = _farm_id
      and pin_hash = crypt(_pin, pin_hash)
  );
$$;

revoke all on function public.verify_admin_pin(uuid, text) from public, anon, authenticated;
grant execute on function public.verify_admin_pin(uuid, text) to service_role;
