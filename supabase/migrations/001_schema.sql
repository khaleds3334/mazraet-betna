-- 001_schema.sql — Mazra3et Betna core schema (Phase 1)
-- Entities: farm · admin_credentials · settings · cycle · customer
--           orders · order_line · payment · expense · feed · mortality · notification
-- Notes:
--   • farm_id on every table (multi-tenant from day one — D-08)
--   • orders.customer_id is nullable (orphan orders — FR-13)
--   • order_line = ONE physical chicken (the weighing screen has a box per chicken — FR-14)
--   • order_line holds BOTH the approximate and the actual weight
--   • No invoice / debt table — both are derived on read (D-05); computed in /lib/calculations
--   • Admin PIN hash lives in a separate table, never in customer-readable settings

create extension if not exists pgcrypto;

-- ─────────────────────────── Enums ───────────────────────────
create type order_status as enum ('pending', 'weighed', 'ready', 'delivered', 'cancelled');
create type order_source as enum ('customer', 'admin');
create type expense_category as enum ('feed', 'utilities', 'medicine', 'other');
create type notification_audience as enum ('customer', 'admin');

-- ─────────────────────────── Farm ────────────────────────────
create table farm (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid references auth.users(id) on delete set null, -- the admin (linked on first admin login)
  owner_phone text not null,                                     -- routes login to the admin flow (FR-1)
  created_at  timestamptz not null default now()
);

-- Admin PIN — isolated so customers can read settings without ever reaching the hash
create table admin_credentials (
  farm_id    uuid primary key references farm(id) on delete cascade,
  pin_hash   text not null,                                      -- bcrypt via pgcrypto (D-12: reset, never recover)
  updated_at timestamptz not null default now()
);

-- ─────────────────────── Sale settings ───────────────────────
create table settings (
  id                 uuid primary key default gen_random_uuid(),
  farm_id            uuid not null unique references farm(id) on delete cascade,
  sale_price         numeric(10,2) not null default 0,           -- per kg (FR-26)
  cleaning_price     numeric(10,2) not null default 0,           -- per chicken (FR-5)
  available_weights  numeric(6,3)[] not null default '{}',       -- offered to the customer (FR-27)
  pickup_times       text[] not null default '{}',               -- the ~4 daily pickup slots (FR-5)
  default_cleaning   boolean not null default true,
  raising_period_days int not null default 30,                   -- FR-4: expected sale = start + 30
  updated_at         timestamptz not null default now()
);

-- ─────────────────────────── Cycle ───────────────────────────
create table cycle (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references farm(id) on delete cascade,
  chick_count    int not null check (chick_count >= 0),          -- عدد الكتاكيت (FR-4)
  chick_price    numeric(10,2) not null default 0,               -- سعر شراء الكتكوت (per chick)
  start_date     date not null,
  is_active      boolean not null default true,
  sale_open      boolean not null default false,                 -- البيع مفتوح؟ (FR-11)
  sale_closes_at timestamptz,                                    -- auto-close time, if set
  ended_at       timestamptz,                                    -- الدورة انتهت
  created_at     timestamptz not null default now()
);
-- Only one active cycle per farm (FR-4)
create unique index one_active_cycle_per_farm on cycle(farm_id) where is_active;

-- ────────────────────────── Customer ─────────────────────────
create table customer (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references farm(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null, -- null for walk-ins the admin added (FR-10)
  name         text not null,
  phone        text not null,
  created_at   timestamptz not null default now(),
  unique (farm_id, phone)
);

-- ─────────────────────────── Orders ──────────────────────────
create table orders (
  id             uuid primary key default gen_random_uuid(),
  farm_id        uuid not null references farm(id) on delete cascade,
  cycle_id       uuid not null references cycle(id) on delete cascade,
  customer_id    uuid references customer(id) on delete set null,  -- nullable: orphan order (FR-13)
  status         order_status not null default 'pending',
  source         order_source not null default 'customer',
  cleaning       boolean not null default true,                    -- التنظيف للطلب كله (استثناء per line below)
  pickup_date    date,
  pickup_time    text,
  notes          text,                                             -- ملاحظات العميل (FR-27)
  on_behalf_of   text,                                             -- لصالح شخص آخر (FR-28)
  unit_price     numeric(10,2),                                    -- snapshot of sale price/kg at weigh (FR-5)
  cleaning_price numeric(10,2),                                    -- snapshot of cleaning price at weigh (FR-5)
  weighed_at     timestamptz,
  delivered_at   timestamptz,
  cancelled_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index orders_customer_idx on orders(customer_id);
create index orders_cycle_idx on orders(cycle_id);
create index orders_status_idx on orders(status);

-- Order line = ONE chicken. Approx weight from the order, actual weight filled at weighing (FR-14).
create table order_line (
  id            uuid primary key default gen_random_uuid(),
  farm_id       uuid not null references farm(id) on delete cascade,
  order_id      uuid not null references orders(id) on delete cascade,
  batch_no      int not null default 1,                            -- الوزنة / الكيس (FR-14ب)
  position      int not null default 1,                            -- display order (١. ٢. ٣.)
  approx_weight numeric(6,3),                                      -- ما طلبه العميل تقريبياً
  actual_weight numeric(6,3),                                      -- الوزن الفعلي على الميزان
  cleaning      boolean not null default true,                    -- استثناء تنظيف لكل فرخة (FR-14)
  created_at    timestamptz not null default now()
);
create index order_line_order_idx on order_line(order_id);

-- ────────────────── Payments (installments) ──────────────────
create table payment (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references farm(id) on delete cascade,
  order_id   uuid not null references orders(id) on delete cascade,
  amount     numeric(10,2) not null check (amount > 0),
  paid_at    timestamptz not null default now(),
  note       text,
  created_at timestamptz not null default now()
);
create index payment_order_idx on payment(order_id);

-- ────────────────── Cycle accounting inputs ──────────────────
create table expense (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references farm(id) on delete cascade,
  cycle_id    uuid not null references cycle(id) on delete cascade,
  category    expense_category not null default 'other',          -- علف/مياه وكهرباء/أدوية/أخرى (Phase 7)
  description text,
  amount      numeric(10,2) not null check (amount >= 0),
  spent_on    date not null default current_date,
  created_at  timestamptz not null default now()
);
create index expense_cycle_idx on expense(cycle_id);

create table feed (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references farm(id) on delete cascade,
  cycle_id     uuid not null references cycle(id) on delete cascade,
  bags         int not null check (bags >= 0),                     -- عدد الشكاير (٥٠ كجم) (FR-22)
  bag_price    numeric(10,2) not null default 0,
  purchased_on date not null default current_date,
  created_at   timestamptz not null default now()
);
create index feed_cycle_idx on feed(cycle_id);

create table mortality (
  id         uuid primary key default gen_random_uuid(),
  farm_id    uuid not null references farm(id) on delete cascade,
  cycle_id   uuid not null references cycle(id) on delete cascade,
  count      int not null check (count > 0),                       -- عدد النافق (FR-23)
  died_on    date not null default current_date,
  created_at timestamptz not null default now()
);
create index mortality_cycle_idx on mortality(cycle_id);

-- ──────────────────── In-app notifications ───────────────────
create table notification (
  id          uuid primary key default gen_random_uuid(),
  farm_id     uuid not null references farm(id) on delete cascade,
  audience    notification_audience not null default 'customer',
  customer_id uuid references customer(id) on delete cascade,      -- recipient when audience = customer
  order_id    uuid references orders(id) on delete set null,
  title       text not null,
  body        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index notification_customer_idx on notification(customer_id);

-- ───────────────────── updated_at triggers ───────────────────
create or replace function set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_orders_updated    before update on orders            for each row execute function set_updated_at();
create trigger trg_settings_updated  before update on settings          for each row execute function set_updated_at();
create trigger trg_admin_cred_updated before update on admin_credentials for each row execute function set_updated_at();
