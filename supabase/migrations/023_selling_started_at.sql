-- ─────────── When a cycle entered مرحلة البيع, said out loud ───────────
-- `sale_closes_at` was carrying two jobs. It is the date the customer's home
-- counts down to while a sale is open — a number the admin edits from settings
-- and nothing else depends on. But it was ALSO the flag that told the whole app
-- "this cycle has entered its selling phase" (D-57), because it is set the
-- moment the sale opens and survives every close and re-open.
--
-- That made a field the admin thinks of as a countdown quietly load-bearing:
-- clear it and the cycle reads as التربية again, with the raising dashboard on
-- the admin's home and the orders screen turned into an archive. Nothing clears
-- it today — the settings screen can only move it — so this is fragility, not a
-- live bug (Khaled, 2026-08-22).
--
-- The phase gets its own column. `sale_closes_at` goes back to being the one
-- thing the admin thinks it is.
--
-- Safe to run more than once.

alter table cycle
  add column if not exists selling_started_at timestamptz;

comment on column cycle.selling_started_at is
  'When «بدء مرحلة البيع» was pressed. Non-null = the cycle has entered مرحلة البيع and stays there until it ends. Distinct from sale_closes_at, which is only the countdown target and may be moved freely.';

-- Backfill every cycle already selling or already closed out of a sale. The
-- readers only test whether this is null, so the value matters less than its
-- presence — but a wrong timestamp is still a lie, so it is derived rather than
-- stamped with now(): a dated window opened SALE_WINDOW_DAYS (5) before it
-- closes, and a cycle from before windows were dated (2026-08-21) is estimated
-- at the day its flock was ready.
update cycle c
set selling_started_at = coalesce(
      c.sale_closes_at - interval '5 days',
      c.start_date::timestamptz
        + make_interval(
            days => coalesce(
              (select s.raising_period_days from settings s
                where s.farm_id = c.farm_id limit 1),
              28
            )
          )
    )
where c.selling_started_at is null
  and (c.sale_open or c.sale_closes_at is not null);
