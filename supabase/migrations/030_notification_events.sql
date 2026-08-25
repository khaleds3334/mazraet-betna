-- ─────────── A notification says which event it is, not what it costs ───────────
-- «تم تسليم الطلب» is the seventh notice (Khaled, 2026-08-25), and the first one
-- whose *tone* and whose sentence depend on money: settled, it is good news;
-- with something still owed, it is a warning that names what was paid and what
-- is left.
--
-- None of that is written here.
--
-- ── Why the amounts are not in this file ────────────────────────────────────
-- D-05: there is no invoice table, because an invoice is the order plus its
-- weights, computed on read. Writing «باقي عليك ٧٨٥ جنيه» into a row would be an
-- invoice total stored — a second place an order can be priced, frozen at the
-- moment of delivery, and wrong the day a payment is recorded against it.
--
-- D-74: and every number a human reads goes through `/lib/format.ts` in
-- Arabic-Indic digits (rule 3). Composing that sentence here would have needed
-- both the pricing rule and the digits reimplemented in SQL.
--
-- So this migration adds the one thing the database *does* know: **which event
-- happened**. `listNotifications` reads that, runs the real `computeInvoice` over
-- the order, and writes the sentence with the real formatter — so the tone and
-- the figures are as true the tenth time he opens the screen as the first.
--
-- The stored title and body are the fallback for a row whose order has gone.
--
-- Safe to run more than once. Depends on migration 029.

do $$ begin
  create type notification_event as enum (
    'welcome',
    'order_placed',
    'order_weighed',
    'order_ready',
    'order_delivered',
    'order_cancelled',
    'sale_open'
  );
exception
  when duplicate_object then null;
end $$;

-- Nullable, and no default: the rows written by migration 029 in the hours before
-- this one predate the idea, and a row with no event simply renders the sentence
-- it was written with.
alter table notification
  add column if not exists event notification_event;

-- ────────────────────────── The writer takes the event ──────────────────────────
create or replace function private.notify_customer(
  _farm_id     uuid,
  _customer_id uuid,
  _order_id    uuid,
  _kind        notification_kind,
  _event       notification_event,
  _title       text,
  _body        text
) returns void
language sql security definer set search_path = public, private as $$
  insert into notification (farm_id, audience, customer_id, order_id, kind, event, title, body)
  values (_farm_id, 'customer', _customer_id, _order_id, _kind, _event, _title, _body);
$$;

-- The six-argument version from 029 is gone; nothing may call it half-informed.
drop function if exists private.notify_customer(uuid, uuid, uuid, notification_kind, text, text);

-- ─────────────────────────────── The events ───────────────────────────────
create or replace function private.notify_customer_welcome()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  perform private.notify_customer(
    new.farm_id, new.id, null, 'success', 'welcome',
    'اهلا بيك في مزرعة بيتنا',
    'سعداء بانضمامك لنا، يمكنك الان التمتع بتقديم طلباتك و متابعة حالتها بكل سهولة'
  );
  return new;
end;
$$;

create or replace function private.notify_order_placed()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if new.customer_id is null or new.is_house then
    return new;
  end if;

  perform private.notify_customer(
    new.farm_id, new.customer_id, new.id, 'success', 'order_placed',
    'تم استلام طلبك بنجاح',
    'يتم الان مراجعة الطلب و التأكد من توفر الاوزان المطلوبة'
  );
  return new;
end;
$$;

create or replace function private.notify_order_status()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if new.status = old.status or new.customer_id is null or new.is_house then
    return new;
  end if;

  if new.status = 'weighed' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'success', 'order_weighed',
      'الفاتورة جاهزة',
      'تم وزن الفراخ و حساب السعر النهائي، راجع الفاتورة و أكّد عشان نبدأ التنظيف'
    );

  elsif new.status = 'ready' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'success', 'order_ready',
      'طلبك جاهز للاستلام',
      'خلص تجهيز و تنظيف الطلب، تقدر تيجي المزرعة تستلمه'
    );

  -- The tone here is a placeholder. Whether this is good news or a warning is a
  -- question about money, and money is answered on read — see the file header.
  elsif new.status = 'delivered' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'success', 'order_delivered',
      'تم تسليم الطلب',
      'تم استلام الطلب من المزرعة'
    );

  elsif new.status = 'cancelled' then
    perform private.notify_customer(
      new.farm_id, new.customer_id, new.id, 'error', 'order_cancelled',
      'تم الغاء طلبك',
      coalesce('تم الغاءه، السبب: ' || nullif(trim(new.cancel_reason), ''), 'تم الغاءه')
    );
  end if;

  return new;
end;
$$;

create or replace function private.notify_sale_open()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  if new.sale_open and not coalesce(old.sale_open, false) then
    insert into notification (farm_id, audience, customer_id, kind, event, title, body)
    select new.farm_id, 'customer', c.id, 'warning', 'sale_open',
           'تم البدء في فترة البيع',
           'يمكنك الان تقديم طلبات جديدة للفراخ البيضاء الطازجة'
      from customer c
     where c.farm_id = new.farm_id;
  end if;
  return new;
end;
$$;
