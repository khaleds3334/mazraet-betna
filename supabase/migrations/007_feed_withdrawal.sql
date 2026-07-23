-- ─────────────────── Feed withdrawal (consumption) ───────────────────
-- The `feed` table records feed PURCHASES (bags bought, price). This table
-- records CONSUMPTION: the admin opens/withdraws one bag at a time as the flock
-- eats it (A-11 "سحب شكارة"). One row = one withdrawn 50kg bag (شكارة = وحدة).
--
--   العلف المتوفر (available) = purchased bags − withdrawn bags
--   العلف المسحوب (withdrawn) = count of rows here
--   تتبع استهلاك العلف (grid) = one filled cell per withdrawn bag
--
-- Withdrawal is a manual log (Khaled, 2026-07-23) — deriving it from age was the
-- rejected alternative. Admin-only, mirroring the feed/mortality policies.
create table feed_withdrawal (
  id           uuid primary key default gen_random_uuid(),
  farm_id      uuid not null references farm(id) on delete cascade,
  cycle_id     uuid not null references cycle(id) on delete cascade,
  bags         int not null default 1 check (bags > 0),  -- ≥1; one شكارة per withdrawal by default
  withdrawn_on date not null default current_date,
  created_at   timestamptz not null default now()
);
create index feed_withdrawal_cycle_idx on feed_withdrawal(cycle_id);

alter table feed_withdrawal enable row level security;
create policy feed_withdrawal_all on feed_withdrawal for all
  using (private.is_admin(farm_id))
  with check (private.is_admin(farm_id));
