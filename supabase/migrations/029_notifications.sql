-- ─────────── The database writes the notifications, not the app ───────────
-- Six things happen to a customer that he should be told about, and none of them
-- can be announced by the app that causes them.
--
-- The reason is one line of `002_rls.sql`:
--
--     create policy notification_insert on notification
--       for insert with check (private.is_admin(farm_id));
--
-- Only an admin may write a notification row. So a customer placing an order
-- cannot write «تم استلام طلبك بنجاح» for himself — his own session is refused —
-- and any attempt to fix that by loosening the policy would let one customer
-- write notifications to another.
--
-- The same conclusion migration 026 reached about the sale closing itself: a rule
-- that must hold no matter who is acting belongs where the thing actually
-- happens. There, it was a rule enforced by memory that failed twice in one
-- evening because a writer had been added later without being wired in. Here the
-- writers are already two apps and a psql prompt, and FR-16 (editing an order)
-- will be a third.
--
-- So: triggers, with definer rights, on the events themselves.
--
-- ── What is NOT in here: numbers ──────────────────────────────────────────────
-- No order number, no total, no date. Every number this app shows a human goes
-- through `/lib/format.ts` and comes out in Arabic-Indic digits (rule 3), and
-- the bodies below would have needed a second implementation of that in SQL to
-- carry «طلبك رقم ١٢٢٤#».
--
-- Instead each body is written to read *after* that prefix, and the row
-- component puts the number on the front with the real formatter. The stored
-- text stays a sentence; the digits stay in one place.
--
-- Safe to run more than once.

-- ─────────────────────────── The tone of a notice ───────────────────────────
-- A column and not something inferred from the title: whether a notice is good
-- news, a warning or a failure is part of what it is, not a guess to be made
-- from the words in it later.
do $$ begin
  create type notification_kind as enum ('success', 'warning', 'error');
exception
  when duplicate_object then null;
end $$;

alter table notification
  add column if not exists kind notification_kind not null default 'success';

-- ────────────────────────────── The one writer ──────────────────────────────
-- SECURITY DEFINER for the same reason `private.sync_sale_with_flock` is: the
-- caller is usually the customer himself, and the insert policy is admin-only.
-- This function is the whole permission — it writes one row, to one customer,
-- always with audience 'customer', and takes no path that could address anybody
-- else.
create or replace function private.notify_customer(
  _farm_id     uuid,
  _customer_id uuid,
  _order_id    uuid,
  _kind        notification_kind,
  _title       text,
  _body        text
) returns void
language sql security definer set search_path = public, private as $$
  insert into notification (farm_id, audience, customer_id, order_id, kind, title, body)
  values (_farm_id, 'customer', _customer_id, _order_id, _kind, _title, _body);
$$;

-- ───────────────────────────── 1 · A new customer ─────────────────────────────
-- Written when the account is, so the bell already has something in it the first
-- time he opens the app (Khaled, 2026-08-25).
create or replace function private.notify_customer_welcome()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  perform private.notify_customer(
    new.farm_id, new.id, null, 'success',
    'اهلا بيك في مزرعة بيتنا',
    'سعداء بانضمامك لنا، يمكنك الان التمتع بتقديم طلباتك و متابعة حالتها بكل سهولة'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_customer_welcome on customer;
create trigger trg_notify_customer_welcome
  after insert on customer
  for each row execute function private.notify_customer_welcome();

-- ──────────────────────────── 2 · An order arrives ────────────────────────────
create or replace function private.notify_order_placed()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  -- An orphan order has no one to tell (FR-13), and the family's own birds are
  -- not a sale (FR-36) — nobody is waiting on either.
  if new.customer_id is null or new.is_house then
    return new;
  end if;

  perform private.notify_customer(
    new.farm_id, new.customer_id, new.id, 'success',
    'تم استلام طلبك بنجاح',
    'يتم الان مراجعة الطلب و التأكد من توفر الاوزان المطلوبة'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_order_placed on orders;
create trigger trg_notify_order_placed
  after insert on orders
  for each row execute function private.notify_order_placed();

-- ─────────────────────── 3-5 · An order changes state ───────────────────────
-- Three of the four statuses are worth a word. «تم الوزن» is the one the customer
-- has something to *do* about — everything else tells him what happened, that one
-- asks him to confirm the price (D-67) — so it is the one that most needs saying.
create or replace function private.notify_order_status()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if new.status = old.status or new.customer_id is null or new.is_house then
    return new;
  end if;

  if new.status = 'weighed' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'success',
      'الفاتورة جاهزة',
      'تم وزن الفراخ و حساب السعر النهائي، راجع الفاتورة و أكّد عشان نبدأ التنظيف'
    );

  elsif new.status = 'ready' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'success',
      'طلبك جاهز للاستلام',
      'خلص تجهيز و تنظيف الطلب، تقدر تيجي المزرعة تستلمه'
    );

  elsif new.status = 'cancelled' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'error',
      'تم الغاء طلبك',
      coalesce('تم الغاءه، السبب: ' || nullif(trim(new.cancel_reason), ''), 'تم الغاءه')
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_order_status on orders;
create trigger trg_notify_order_status
  after update of status on orders
  for each row execute function private.notify_order_status();

-- ────────────────────────── 6 · The sale opens ──────────────────────────
-- The only one that is not about one order, so it is the only one that fans out:
-- one row per customer of the farm, in a single statement.
--
-- Guarded on the *edge* (false → true) and not on the value, because
-- `sync_sale_with_flock` writes `sale_open` on every order and every mortality
-- row — without the edge test, a customer would be told the sale had started
-- again each time a bird was sold.
create or replace function private.notify_sale_open()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if new.sale_open and not coalesce(old.sale_open, false) then
    insert into notification (farm_id, audience, customer_id, kind, title, body)
    select new.farm_id, 'customer', c.id, 'warning',
           'تم البدء في فترة البيع',
           'يمكنك الان تقديم طلبات جديدة للفراخ البيضاء الطازجة'
      from customer c
     where c.farm_id = new.farm_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_sale_open on cycle;
create trigger trg_notify_sale_open
  after update of sale_open on cycle
  for each row execute function private.notify_sale_open();
