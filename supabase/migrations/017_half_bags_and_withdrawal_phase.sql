-- ───────────── Half bags, and which feed was opened (بادي / نامي) ─────────────
-- Two changes, both about the same thing: the app was counting bags in whole
-- numbers and guessing their type, and the farm does neither.
--
--   1. `bags` becomes numeric. A 50kg sack is bought and opened by the half —
--      «نص شكارة» is an ordinary entry, and `int` was quietly truncating it.
--      numeric(6,2), not float: money and stock counts must not drift.
--
--   2. `feed_withdrawal.phase` records which feed came out of the store, the way
--      migration 013 did for purchases. Withdrawals were classified بادي-first
--      from their position in the sequence, and that inference is wrong for the
--      admin who runs out of بادي early and opens نامي instead — a case he now
--      has a control for (Khaled, 2026-08-21).
--
-- Depends on migration 013 (it creates the `feed_phase` type). Apply that first.
-- Safe to run more than once.

-- ── 1. Half bags ────────────────────────────────────────────────────────────
alter table feed
  alter column bags type numeric(6,2) using bags::numeric;

alter table feed_withdrawal
  alter column bags type numeric(6,2) using bags::numeric;

-- The old check constraints were written against `int` and still hold, but the
-- half-bag rule deserves saying out loud: nothing is recorded in thirds.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feed_bags_half_step'
  ) then
    alter table feed
      add constraint feed_bags_half_step check (bags * 2 = floor(bags * 2));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'feed_withdrawal_bags_half_step'
  ) then
    alter table feed_withdrawal
      add constraint feed_withdrawal_bags_half_step
      check (bags * 2 = floor(bags * 2));
  end if;
end
$$;

-- ── 2. Which feed was opened ────────────────────────────────────────────────
alter table feed_withdrawal
  add column if not exists phase feed_phase;

-- Backfill with the rule the code has been applying at read time, frozen once:
-- bags are opened in order, and are بادي until the cycle's expected بادي
-- requirement (chick_count × 0.75kg ÷ 50, to the nearest half bag) is used up.
with ordered as (
  select
    w.id,
    w.cycle_id,
    coalesce(
      sum(w.bags) over (
        partition by w.cycle_id
        order by w.withdrawn_on, w.withdrawn_at nulls first, w.created_at
        rows between unbounded preceding and 1 preceding
      ),
      0
    ) as bags_before
  from feed_withdrawal w
),
needs as (
  select
    o.id,
    o.bags_before,
    round((c.chick_count * 0.75 / 50) / 0.5) * 0.5 as badi_needed
  from ordered o
  join cycle c on c.id = o.cycle_id
)
update feed_withdrawal w
set phase = case
              when n.bags_before < n.badi_needed then 'badi'::feed_phase
              else 'nami'::feed_phase
            end
from needs n
where n.id = w.id
  and w.phase is null;

-- Nullable, like `feed.phase`: a row imported by hand is never rejected for want
-- of a phase, and the readers already treat null as "unknown" and fall back to
-- the بادي-first order.
comment on column feed_withdrawal.phase is
  'Which feed was opened: بادي (starter) or نامي (grower). Null on rows predating migration 017 that could not be attributed.';

create index if not exists feed_withdrawal_cycle_phase_idx
  on feed_withdrawal (cycle_id, phase);
