-- ───────── Freeze the price on orders taken before prices were stamped ─────────
--
-- T-15 as amended (2026-08-21) stamps `unit_price` / `cleaning_price` onto an
-- order the moment it is booked, so changing the kilo price in settings never
-- re-prices an order the farm has already promised.
--
-- Orders taken BEFORE that change carry nulls, which means they still float:
-- they pick up whatever the price happens to be on the day they are weighed.
-- That is the exact bug the amendment was made to stop, and it is live on every
-- order still sitting in «الجديدة».
--
-- What price to give them is a genuine unknown — nobody recorded what those
-- customers were quoted. The farm's current price is the best available answer:
-- it is what those orders would have been billed at today anyway, so this
-- changes nothing about what they cost. It only stops them changing again.
--
-- Weighed orders are left alone: they were stamped at the scale under the old
-- rule and already hold a real, recorded price.
--
-- Safe to run more than once — only ever touches rows that are still null.

update orders o
set unit_price     = s.sale_price,
    cleaning_price = s.cleaning_price
from settings s
where s.farm_id = o.farm_id
  and o.unit_price is null;

comment on column orders.unit_price is
  'Kilo price held from the moment the order was booked (T-15 as amended). Orders predating migration 020 were frozen at the farm price current then.';
