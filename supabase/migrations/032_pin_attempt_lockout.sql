-- A limit on how fast the admin PIN can be guessed (T-75).
--
-- Six digits is a million combinations and nothing was counting the tries. The
-- only way in is the `verifyPin` server action — this function is executable by
-- `service_role` alone — but that action is a POST endpoint anybody can script,
-- and the number it needs is the admin's phone, which the contact popup shows.
--
-- Five wrong tries, then sixty seconds. That turns a million guesses into about
-- 138 days at best, and costs an admin who fumbled his own PIN one minute.
--
-- Sixty seconds and not fifteen minutes on purpose: he has no PIN recovery path
-- (FR-1 — a forgotten PIN means ringing Khaled), and he is often standing at a
-- scale with birds in his hands. A lockout long enough to be a real obstacle to
-- him is a worse fault than the one being fixed, and 138 days is already far
-- past the point where guessing is the easy way in.
--
-- Counted in the database rather than the app: two attempts arriving together
-- both read and both write, and only a single statement can hold the count
-- straight. It also means the limit survives anything the app forgets to do.
alter table admin_credentials
  add column if not exists failed_attempts integer not null default 0,
  add column if not exists locked_until timestamptz;

-- The return type changes, so it has to go and come back rather than be
-- replaced. Its grants come back with it — a recreated function is executable by
-- PUBLIC by default, and leaving that would hand the whole world the PIN check
-- this migration exists to protect.
drop function if exists public.verify_admin_pin(uuid, text);

create function public.verify_admin_pin(_farm_id uuid, _pin text)
returns table (ok boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare
  cred     admin_credentials%rowtype;
  attempts integer;
begin
  select * into cred from admin_credentials where farm_id = _farm_id;

  -- No credentials row: the caller has already established this farm exists, so
  -- this is a farm whose PIN was never set. Same answer as a wrong PIN — never
  -- tell an unauthenticated caller which of the two it was.
  if not found then
    return query select false, 0;
    return;
  end if;

  -- Locked. The PIN is not even compared, so guessing during a lockout buys
  -- nothing and cannot extend it either.
  if cred.locked_until is not null and cred.locked_until > now() then
    return query
      select false, ceil(extract(epoch from (cred.locked_until - now())))::integer;
    return;
  end if;

  if cred.pin_hash = crypt(_pin, cred.pin_hash) then
    -- A correct PIN wipes the slate: four fumbles then success must not leave
    -- him one mistake from a lockout tomorrow.
    update admin_credentials
       set failed_attempts = 0, locked_until = null
     where farm_id = _farm_id;
    return query select true, 0;
    return;
  end if;

  attempts := cred.failed_attempts + 1;

  if attempts >= 5 then
    -- The counter resets as the lock goes on, so the next lock needs five fresh
    -- misses rather than one.
    update admin_credentials
       set failed_attempts = 0, locked_until = now() + interval '60 seconds'
     where farm_id = _farm_id;
    return query select false, 60;
  else
    update admin_credentials
       set failed_attempts = attempts
     where farm_id = _farm_id;
    return query select false, 0;
  end if;
end;
$$;

revoke all on function public.verify_admin_pin(uuid, text) from public;
revoke all on function public.verify_admin_pin(uuid, text) from anon;
revoke all on function public.verify_admin_pin(uuid, text) from authenticated;
grant execute on function public.verify_admin_pin(uuid, text) to service_role;
