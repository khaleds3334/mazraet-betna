-- ────── The forecast moves to settings; the fact stays on the cycle ──────
-- `cycle.sale_closes_at` was a **forecast** living among facts. It is dated five
-- days out when the sale opens and the admin moves it freely from settings — it
-- never recorded that anything happened, despite its name (Khaled, 2026-08-22).
--
-- Two consequences, and the second is the reason this migration exists:
--
--   1. A finished cycle carried a date for something that never occurred, and
--      nothing recorded when its sale *actually* stopped.
--   2. The one date field on the settings screen wrote to **two different
--      tables** depending on whether a sale was open — which is why the app has
--      had to carry an `editingSaleEnd` flag from the screen to the action. With
--      both forecasts in `settings`, that field writes to one table again.
--
-- So the split is by kind, not by owner:
--   • `settings.sale_starts_at` / `settings.sale_closes_at` — what the admin
--     expects, editable, and estimated for him when he leaves them alone;
--   • `cycle.selling_started_at` (migration 023) / `cycle.selling_ended_at` —
--     what actually happened to this flock.
--
-- Depends on migration 023. Safe to run more than once.

alter table settings
  add column if not exists sale_closes_at timestamptz;

comment on column settings.sale_closes_at is
  'When the sale is expected to stop taking orders — «تاريخ انتهاء البيع» on A-70. A forecast the admin may move, not a record. The actual moment is cycle.selling_ended_at.';

alter table cycle
  add column if not exists selling_ended_at timestamptz;

comment on column cycle.selling_ended_at is
  'When this flock actually stopped taking orders — the switch turned off by hand, or the last bird sold (FR-11). Null while it is still selling. Null on cycles that ended before migration 024: it was never recorded, and guessing it from ended_at would invent a fact.';

-- Carry the live forecast across before the column goes. Only the running cycle
-- has one worth keeping: the forecast is about the sale being taken now, and a
-- finished cycle's was never a record of anything.
update settings s
set sale_closes_at = c.sale_closes_at
from cycle c
where c.farm_id = s.farm_id
  and c.is_active
  and c.sale_closes_at is not null
  and s.sale_closes_at is null;

alter table cycle
  drop column if exists sale_closes_at;
