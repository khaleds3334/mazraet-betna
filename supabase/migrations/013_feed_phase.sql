-- ─────────────────── Which feed a purchase was (بادي / نامي) ───────────────────
-- `feed` recorded bags and price but not the phase, even though the purchase form
-- has always asked for the two separately: it wrote one row per phase and threw
-- the label away. Everything downstream then had to guess it back — the purchase
-- form pre-fills "what's still to buy", which needs to know how much بادي is
-- already in the store, and was inferring it بادي-first from the bag count.
--
-- The inference is right most of the time (the flock eats بادي first, so he buys
-- it first) and wrong exactly when it matters: the one cycle he buys نامي early.
-- The form asks him for the phase anyway, so store the answer instead of
-- reconstructing it.
--
-- Withdrawals are a separate question and still classified بادي-first: the admin
-- opens a bag, he doesn't tell the app which kind, and asking him mid-weighing is
-- exactly the friction the app exists to remove.
-- No `create type if not exists` in Postgres, and these files are applied by
-- hand — so guard it, the way the rest of this migration is guarded.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'feed_phase') then
    create type feed_phase as enum ('badi', 'nami');
  end if;
end
$$;

alter table feed
  add column if not exists phase feed_phase;

-- Backfill: existing rows carry no phase, so apply the same بادي-first rule the
-- code used, once, and freeze the result. Bags are attributed in purchase order
-- against the cycle's expected بادي requirement (chick_count × 0.75kg ÷ 50, to
-- the nearest half bag — the FEED_PER_CHICK_KG model in lib/constants.ts).
with ordered as (
  select
    f.id,
    f.cycle_id,
    -- Bags bought before this row, within the same cycle.
    coalesce(
      sum(f.bags) over (
        partition by f.cycle_id
        order by f.purchased_on, f.created_at
        rows between unbounded preceding and 1 preceding
      ),
      0
    ) as bags_before
  from feed f
),
needs as (
  select
    o.id,
    o.bags_before,
    round((c.chick_count * 0.75 / 50) / 0.5) * 0.5 as badi_needed
  from ordered o
  join cycle c on c.id = o.cycle_id
)
update feed f
-- Cast explicitly: inside a CASE the literals would otherwise resolve to text,
-- which is not assignable to an enum column.
set phase = case
              when n.bags_before < n.badi_needed then 'badi'::feed_phase
              else 'nami'::feed_phase
            end
from needs n
where n.id = f.id
  and f.phase is null;

-- Left nullable on purpose: a row imported or fixed by hand shouldn't be blocked
-- for want of a phase, and the readers already treat null as "unknown".
comment on column feed.phase is
  'Which feed was bought: بادي (starter) or نامي (grower). Null on rows predating migration 013 that could not be attributed.';

-- The purchase form sums a cycle's bags per phase every time it opens.
create index if not exists feed_cycle_phase_idx on feed (cycle_id, phase);
