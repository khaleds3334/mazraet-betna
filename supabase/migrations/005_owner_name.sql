-- 005_owner_name.sql — the farm owner's personal name (Phase 5, admin home A-10)
-- The admin home greets the owner by name ("أهلا بيك صبري علي 👋"). The farm row
-- already holds the farm's name and the owner's phone, but not the owner's own
-- name, so we add it here. Nullable: an owner without a name set just gets a
-- generic greeting until they fill it in from Settings (A-70).
-- Applied to the live database on 2026-07-23; types regenerated afterwards.

alter table farm add column if not exists owner_name text;

-- Seed the demo farm's owner (matches the Figma design; change from Settings later).
update farm set owner_name = 'صبري علي' where owner_phone = '01000000000';
