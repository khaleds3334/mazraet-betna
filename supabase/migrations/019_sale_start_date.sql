-- ───────── When the next sale starts, and the price an order was taken at ─────────
--
-- Two things the settings screen (A-70) needs that the schema could not hold.
--
-- 1. `settings.sale_starts_at` — the date the admin picks for «فترة البيع تبدء في».
--
-- The customer's home counts down to the next sale. While a cycle is running that
-- target is derived (start_date + raising period), but between cycles there is no
-- cycle to derive it from, and the farm still has to tell customers roughly when
-- to come back. This column is the admin's own answer, and it is an override:
-- null means "work it out for me", and the rolling estimate takes over
-- (SALE_START_ROLL_DAYS in /lib/constants.ts).
--
-- Deliberately nullable rather than defaulted. A default would be a date nobody
-- chose, shown to customers as though someone had.
--
-- 2. `raising_period_days` moves 30 → 28 (Khaled, 2026-08-21).
--
-- FR-4 wrote the expected sale as start + 30. It is 28: that is when these birds
-- actually reach selling weight on this farm. Existing rows are moved with the
-- default so the farm does not keep a number its owner no longer uses.
--
-- Safe to run more than once.

alter table settings
  add column if not exists sale_starts_at timestamptz;

comment on column settings.sale_starts_at is
  'Admin-chosen start of the next sale window (A-70). Null = derive it: from the active cycle while one runs, otherwise the rolling estimate. Never shown to a customer as a guess.';

alter table settings
  alter column raising_period_days set default 28;

-- Only farms still carrying the old default — never a number the admin has since
-- set himself.
update settings set raising_period_days = 28 where raising_period_days = 30;
