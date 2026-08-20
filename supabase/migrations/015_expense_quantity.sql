-- ─────────── An expense records how many, not just how much (A-47) ───────────
-- The itemised expenses table (A-47) has four columns — الصنف · العدد · السعر ·
-- الاجمالي — but `expense` only ever stored an amount and a description. Chicks
-- and feed had real quantities (they live on `cycle` and `feed`); everything the
-- admin typed by hand landed as "one at its own price", which is true for a water
-- bill and false for three bottles of medicine or 720 kilowatt-hours.
--
-- So the breakdown becomes data instead of prose. Both columns are nullable and
-- every existing row keeps its meaning: a row without them still reads as one at
-- its own price, which is what it was.
--
-- `amount` stays authoritative — it is what was actually paid, and every
-- accounting read already sums it. The two new columns explain it; they never
-- replace it.

alter table expense
  add column if not exists quantity   numeric(10,3),
  add column if not exists unit_price numeric(10,2);

alter table expense
  drop constraint if exists expense_quantity_positive;
alter table expense
  add constraint expense_quantity_positive
  check (quantity is null or quantity > 0);

alter table expense
  drop constraint if exists expense_unit_price_positive;
alter table expense
  add constraint expense_unit_price_positive
  check (unit_price is null or unit_price >= 0);

comment on column expense.quantity is
  'كم واحدة اتشترت — عدد العلب، أو كيلو وات العداد. null = واحدة واحدة.';
comment on column expense.unit_price is
  'سعر الوحدة. null = السعر هو المبلغ نفسه.';
