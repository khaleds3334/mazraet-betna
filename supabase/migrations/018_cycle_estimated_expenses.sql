-- ─────────── What the cycle was forecast to cost, kept from day one ───────────
-- The create-cycle sheet (A-41) has always shown «المصاريف المتوقعة» — chick cost
-- plus a feed and other-expenses forecast read off the farm's own history (T-46)
-- — and then thrown it away the moment the cycle was registered.
--
-- Keeping it turns the expenses tile from a number into a judgement: spending is
-- brown while it tracks the forecast and red once it passes it (D-46), which is
-- the difference between a figure the admin reads and one he acts on.
--
-- **Stored, not recomputed.** The forecast prices feed at the last bag bought, so
-- recomputing it mid-cycle would move the line every time he buys feed — the
-- cycle would quietly become "over budget" or not because of a price change, not
-- because of his spending. This column is what he was told when he started.
--
-- Nullable: cycles registered before this migration were never told anything, and
-- the tile stays brown for them rather than inventing a line to cross.
-- Safe to run more than once.

alter table cycle
  add column if not exists estimated_expenses numeric(12,2);

comment on column cycle.estimated_expenses is
  'The «المصاريف المتوقعة» total shown on A-41 when this cycle was registered. Null for cycles created before migration 018.';
