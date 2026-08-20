-- ───────── An expense's description is a label, not a sentence (A-47) ─────────
-- The electricity form used to fold the meter readings into the description:
--   «كهرباء — العداد من ٥٢٠ لـ ١٢٤٠ كيلو وات»
-- That text is the الصنف column of the itemised expenses table, a column about
-- 110px wide on a 360px phone — so it wrapped over four lines and pushed the
-- three number columns out of alignment (Khaled, 2026-08-20).
--
-- Since migration 015 the consumption is a column of its own (`quantity`, in
-- kilowatt-hours), which is the figure the table actually shows. The prose was
-- repeating it in words, so the description goes back to being what the column
-- header calls it: a label.
--
-- The absolute meter readings (from 520 to 1240) are not kept. Only the
-- difference was ever used — for the bill and now for the table — and the app
-- has nowhere that reads a running meter across cycles.

update expense
set description = split_part(description, ' — ', 1)
where category = 'utilities'
  and description like '% — %';
