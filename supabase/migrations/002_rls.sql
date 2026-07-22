-- 002_rls.sql — Row Level Security (Phase 1)
-- Rule (FR-1, D-01): the admin (farm owner) sees everything on their farm;
--                    a customer sees only their own data.
-- Identity mapping:
--   • admin    → farm.owner_id = auth.uid()
--   • customer → customer.auth_user_id = auth.uid()
-- Helper functions are SECURITY DEFINER so they can read the mapping tables
-- without tripping the very policies they support (no recursion).

-- ─────────────────────── Helper functions ────────────────────
-- Live in a `private` schema (not exposed by PostgREST) so they can never be
-- called as public RPC endpoints, while RLS policies below still reference them.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin(_farm_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.farm f
    where f.id = _farm_id and f.owner_id = auth.uid()
  );
$$;

create or replace function private.owns_customer(_customer_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.customer c
    where c.id = _customer_id and c.auth_user_id = auth.uid()
  );
$$;

create or replace function private.owns_order(_order_id uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select exists (
    select 1 from public.orders o
    join public.customer c on c.id = o.customer_id
    where o.id = _order_id and c.auth_user_id = auth.uid()
  );
$$;

-- Farms the current customer belongs to (for reading shared farm-level data)
create or replace function private.my_customer_farms()
returns setof uuid language sql stable security definer set search_path = public, auth as $$
  select farm_id from public.customer where auth_user_id = auth.uid();
$$;

-- ───────────────────────── Enable RLS ────────────────────────
alter table farm              enable row level security;
alter table admin_credentials enable row level security;
alter table settings          enable row level security;
alter table cycle             enable row level security;
alter table customer          enable row level security;
alter table orders            enable row level security;
alter table order_line        enable row level security;
alter table payment           enable row level security;
alter table expense           enable row level security;
alter table feed              enable row level security;
alter table mortality         enable row level security;
alter table notification      enable row level security;

-- admin_credentials: no policies at all → only the service role (server auth flow) can touch it.

-- ─────────────────────────── farm ────────────────────────────
create policy farm_select on farm for select using (
  owner_id = auth.uid() or id in (select private.my_customer_farms())
);

-- ────────────────────────── settings ─────────────────────────
create policy settings_select on settings for select using (
  private.is_admin(farm_id) or farm_id in (select private.my_customer_farms())
);
create policy settings_write on settings for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));

-- ─────────────────────────── cycle ───────────────────────────
create policy cycle_select on cycle for select using (
  private.is_admin(farm_id) or farm_id in (select private.my_customer_farms())
);
create policy cycle_write on cycle for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));

-- ────────────────────────── customer ─────────────────────────
create policy customer_select on customer for select using (
  private.is_admin(farm_id) or auth_user_id = auth.uid()
);
create policy customer_insert on customer for insert with check (
  private.is_admin(farm_id) or auth_user_id = auth.uid()
);
create policy customer_update on customer for update using (
  private.is_admin(farm_id) or auth_user_id = auth.uid()
) with check (
  private.is_admin(farm_id) or auth_user_id = auth.uid()
);
create policy customer_delete on customer for delete using (private.is_admin(farm_id));

-- ─────────────────────────── orders ──────────────────────────
create policy orders_select on orders for select using (
  private.is_admin(farm_id) or private.owns_customer(customer_id)
);
create policy orders_insert on orders for insert with check (
  private.is_admin(farm_id) or private.owns_customer(customer_id)   -- customer places their own order (FR-27)
);
-- Only the admin edits / cancels an order (D-04)
create policy orders_update on orders for update using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));
create policy orders_delete on orders for delete using (private.is_admin(farm_id));

-- ───────────────────────── order_line ────────────────────────
create policy order_line_select on order_line for select using (
  private.is_admin(farm_id) or private.owns_order(order_id)
);
create policy order_line_insert on order_line for insert with check (
  private.is_admin(farm_id) or private.owns_order(order_id)         -- lines created with the customer's order
);
create policy order_line_update on order_line for update using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));                          -- weighing is admin-only (FR-14)
create policy order_line_delete on order_line for delete using (private.is_admin(farm_id));

-- ─────────────────────────── payment ─────────────────────────
create policy payment_select on payment for select using (
  private.is_admin(farm_id) or private.owns_order(order_id)         -- customer sees their remaining (FR-30)
);
create policy payment_write on payment for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));                          -- recording payments is admin-only (FR-17)

-- ─────────────── expense / feed / mortality (admin) ──────────
create policy expense_all on expense for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));
create policy feed_all on feed for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));
create policy mortality_all on mortality for all using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));

-- ──────────────────────── notification ───────────────────────
create policy notification_select on notification for select using (
  private.is_admin(farm_id)
  or (audience = 'customer' and private.owns_customer(customer_id))
);
create policy notification_update on notification for update using (
  private.is_admin(farm_id)
  or (audience = 'customer' and private.owns_customer(customer_id))  -- mark as read
) with check (
  private.is_admin(farm_id)
  or (audience = 'customer' and private.owns_customer(customer_id))
);
create policy notification_insert on notification for insert with check (private.is_admin(farm_id));
create policy notification_delete on notification for delete using (private.is_admin(farm_id));
