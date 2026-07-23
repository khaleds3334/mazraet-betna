-- 006_cycle_name_and_start_time.sql — cycle registration fields (Phase 5, A-41)
-- The "إنشاء دورة جديدة" sheet (FR-4) captures more than the original schema held:
--   • name       — an optional label the admin gives the cycle ("دورة يناير ٢٠٢٦")
--                  so cycles are easy to tell apart in lists later.
--   • start_time — the time of day the cycle started, alongside start_date.
--                  Age is still counted in whole days (start_date); the time is
--                  captured for the record.
-- Both nullable. Applied to the live database on 2026-07-23; types regenerated after.

alter table cycle add column if not exists name text;
alter table cycle add column if not exists start_time time;
