-- 003_seed.sql — realistic development data (Phase 1)
-- One active cycle (day ~28, sale open) + 5 customers + orders in every state.
-- Admin PIN for the seeded farm = 123456 (dev only). Prices in EGP.
-- Runs under the service role, so RLS is bypassed for the insert.

do $$
declare
  v_farm  uuid := gen_random_uuid();
  v_cycle uuid := gen_random_uuid();
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  o  uuid;
begin
  -- Farm + admin credentials + sale settings
  insert into farm (id, name, owner_phone)
    values (v_farm, 'مزرعة بيتنا', '01000000000');

  insert into admin_credentials (farm_id, pin_hash)
    values (v_farm, crypt('123456', gen_salt('bf')));

  insert into settings (farm_id, sale_price, cleaning_price, available_weights, pickup_times, default_cleaning)
    values (v_farm, 130, 10, '{1.500,2.000,2.500}', array['10:00','13:00','16:00','19:00'], true);

  -- Active cycle: started 28 days ago, selling phase open, window closes in ~8 days
  insert into cycle (id, farm_id, chick_count, chick_price, start_date, is_active, sale_open, sale_closes_at)
    values (v_cycle, v_farm, 500, 32, current_date - 28, true, true,
            now() + interval '8 days 12 hours 40 minutes');

  -- Customers (permanent across cycles)
  insert into customer (farm_id, name, phone) values (v_farm, 'أحمد محمود', '01111111111') returning id into c1;
  insert into customer (farm_id, name, phone) values (v_farm, 'فاطمة علي', '01222222222') returning id into c2;
  insert into customer (farm_id, name, phone) values (v_farm, 'محمد سعيد', '01333333333') returning id into c3;
  insert into customer (farm_id, name, phone) values (v_farm, 'سعاد حسن', '01444444444') returning id into c4;
  insert into customer (farm_id, name, phone) values (v_farm, 'خالد إبراهيم', '01555555555') returning id into c5;

  -- ── Order A — pending (waiting for pickup, no weights yet) ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time, notes)
    values (v_farm, v_cycle, c1, 'pending', 'customer', current_date + 1, '13:00', 'فراخ صغيرة لو أمكن')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight) values
    (v_farm, o, 1, 2.000), (v_farm, o, 2, 2.000), (v_farm, o, 3, 2.000);

  -- ── Order B — weighed, partially paid ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time,
                      unit_price, cleaning_price, weighed_at)
    values (v_farm, v_cycle, c2, 'weighed', 'customer', current_date, '10:00', 130, 10, now() - interval '2 hours')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight, actual_weight) values
    (v_farm, o, 1, 2.000, 2.100), (v_farm, o, 2, 1.500, 1.480);
  insert into payment (farm_id, order_id, amount, note) values (v_farm, o, 200, 'دفعة عند الوزن');
  -- total 485.40 · paid 200 · remaining 285.40

  -- ── Order C — ready for pickup, split into two batches, fully paid ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time,
                      unit_price, cleaning_price, weighed_at)
    values (v_farm, v_cycle, c3, 'ready', 'customer', current_date, '16:00', 130, 10, now() - interval '3 hours')
    returning id into o;
  insert into order_line (farm_id, order_id, batch_no, position, approx_weight, actual_weight) values
    (v_farm, o, 1, 1, 2.000, 2.050), (v_farm, o, 1, 2, 2.000, 1.980),
    (v_farm, o, 2, 1, 1.500, 1.520), (v_farm, o, 2, 2, 1.500, 1.600);
  insert into payment (farm_id, order_id, amount, note) values (v_farm, o, 969.50, 'مدفوع بالكامل');
  insert into notification (farm_id, audience, customer_id, order_id, title, body)
    values (v_farm, 'customer', c3, o, 'طلبك جاهز للاستلام', 'إجمالي الفاتورة ٩٦٩٫٥٠ جنيه');

  -- ── Order D — delivered, fully paid ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time,
                      unit_price, cleaning_price, weighed_at, delivered_at)
    values (v_farm, v_cycle, c4, 'delivered', 'customer', current_date - 1, '19:00', 130, 10,
            now() - interval '1 day 3 hours', now() - interval '1 day')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight, actual_weight) values
    (v_farm, o, 1, 2.000, 2.200), (v_farm, o, 2, 2.000, 2.000);
  insert into payment (farm_id, order_id, amount, note) values (v_farm, o, 566, 'مدفوع بالكامل');

  -- ── Order E — delivered with remaining balance (debt) ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time,
                      unit_price, cleaning_price, weighed_at, delivered_at)
    values (v_farm, v_cycle, c5, 'delivered', 'customer', current_date - 1, '10:00', 130, 10,
            now() - interval '1 day 5 hours', now() - interval '1 day')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight, actual_weight) values
    (v_farm, o, 1, 2.000, 2.100), (v_farm, o, 2, 2.000, 1.900), (v_farm, o, 3, 2.500, 2.300);
  insert into payment (farm_id, order_id, amount, note) values (v_farm, o, 500, 'دفعة عند الاستلام');
  -- total 849.00 · paid 500 · remaining 349.00 (debt)

  -- ── Order F — orphan order (added by admin, not linked to a customer yet) ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time, on_behalf_of)
    values (v_farm, v_cycle, null, 'pending', 'admin', current_date + 1, '19:00', 'أم أحمد')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight) values
    (v_farm, o, 1, 2.500), (v_farm, o, 2, 2.500);

  -- ── Order G — cancelled ──
  insert into orders (farm_id, cycle_id, customer_id, status, source, pickup_date, pickup_time, cancelled_at)
    values (v_farm, v_cycle, c1, 'cancelled', 'customer', current_date, '13:00', now() - interval '5 hours')
    returning id into o;
  insert into order_line (farm_id, order_id, position, approx_weight) values (v_farm, o, 1, 2.000);

  -- Cycle accounting inputs
  insert into expense (farm_id, cycle_id, category, description, amount, spent_on) values
    (v_farm, v_cycle, 'medicine',  'أدوية ولقاحات',   500, current_date - 20),
    (v_farm, v_cycle, 'utilities', 'كهربا ومياه',     300, current_date - 10),
    (v_farm, v_cycle, 'other',     'نقل',             200, current_date - 5);

  insert into feed (farm_id, cycle_id, bags, bag_price, purchased_on) values
    (v_farm, v_cycle, 20, 900, current_date - 25),
    (v_farm, v_cycle, 15, 950, current_date - 8);

  insert into mortality (farm_id, cycle_id, count, died_on) values
    (v_farm, v_cycle, 8, current_date - 22),
    (v_farm, v_cycle, 5, current_date - 12);

  insert into notification (farm_id, audience, customer_id, title, body) values
    (v_farm, 'customer', c1, 'البيع فتح دلوقتي', 'الأسعار متاحة، تقدر تطلب من التطبيق');
end $$;
