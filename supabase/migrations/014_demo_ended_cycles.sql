-- ──────────────── Demo data: two finished cycles (A-42) ────────────────
-- The cycles list draws three kinds of row — a running cycle and the cycles that
-- came before it — but the database only ever held the one running cycle, so the
-- finished row had nothing to render. This adds two closed cycles behind the
-- current one, with the full trail a real cycle leaves: mortality, feed
-- purchases, running expenses, and delivered orders with their payments.
--
-- Everything is derived, never typed twice: the profit the list shows is the
-- income of these orders minus these costs, exactly as `cycleAccounting`
-- computes it on read (D-05 — nothing is stored pre-totalled).
--
-- Numbers follow the farm's real ones: ٨٠ جنيه/kg, ١٠ جنيه cleaning, ~١٠٣٠ جنيه a
-- bag, ٣.٥ kg of feed per bird. The second cycle deliberately leaves four orders
-- unpaid so the "متبقي مبلغ ديون" line has something to say.
--
-- Guarded and idempotent: it does nothing if these two cycles already exist.

do $$
declare
  v_farm      uuid;
  v_cycle     uuid;
  v_order     uuid;
  v_customers uuid[];
  v_badi      int;
  v_total     numeric;
  v_weight    numeric;
  v_lines     int;
  v_left      int;
  i           int;
  j           int;
  spec        record;
begin
  select id into v_farm from farm order by created_at limit 1;
  if v_farm is null then
    return;
  end if;

  if exists (
    select 1 from cycle
    where farm_id = v_farm and name in ('دورة مايو ٢٠٢٦', 'دورة يونيو ٢٠٢٦')
  ) then
    return;
  end if;

  select array_agg(id order by created_at) into v_customers
  from customer where farm_id = v_farm;
  if v_customers is null then
    return;
  end if;

  -- The running cycle becomes the third one on the farm — the two below it came
  -- first. Order numbers are built from this (`formatOrderNumber`), so its live
  -- orders renumber from ١٠٠١ to ٣٠٠١; they are demo orders either way.
  update cycle set seq = 3 where farm_id = v_farm and is_active;

  for spec in
    select * from (values
      -- name,             seq, start,             end,               chicks, chick price, dead, bags, bag price, other expenses, unpaid orders
      ('دورة مايو ٢٠٢٦',   1, date '2026-04-15', date '2026-05-24', 250, 11.50, 6, 18, 1010.00, 1850.00, 0),
      ('دورة يونيو ٢٠٢٦',  2, date '2026-05-30', date '2026-07-08', 300, 12.00, 9, 21, 1030.00, 2100.00, 4)
    ) as t(name, seq, start_date, end_date, chicks, chick_price, dead, bags, bag_price, other_expenses, unpaid)
  loop
    insert into cycle (farm_id, seq, name, chick_count, chick_price, start_date,
                       is_active, sale_open, ended_at, created_at)
    values (v_farm, spec.seq, spec.name, spec.chicks, spec.chick_price, spec.start_date,
            false, false, spec.end_date + time '18:00', spec.start_date)
    returning id into v_cycle;

    -- Mortality, spread over the cycle the way it actually happens: most of it in
    -- the first days, a straggler later on.
    insert into mortality (farm_id, cycle_id, count, died_on) values
      (v_farm, v_cycle, spec.dead - 2, spec.start_date + 4),
      (v_farm, v_cycle, 2,             spec.start_date + 19);

    -- Feed: بادي first (٠.٧٥ كجم/فرخة), the rest نامي — the same split
    -- `expectedFeedBags` forecasts.
    v_badi := ceil(spec.chicks * 0.75 / 50.0);
    insert into feed (farm_id, cycle_id, bags, bag_price, phase, purchased_on) values
      (v_farm, v_cycle, v_badi,             spec.bag_price, 'badi', spec.start_date),
      (v_farm, v_cycle, spec.bags - v_badi, spec.bag_price, 'nami', spec.start_date + 12);

    insert into expense (farm_id, cycle_id, category, description, amount, spent_on) values
      (v_farm, v_cycle, 'utilities', 'مياه وكهرباء', round(spec.other_expenses * 0.55), spec.start_date + 10),
      (v_farm, v_cycle, 'medicine',  'أدوية وتحصينات', round(spec.other_expenses * 0.30), spec.start_date + 6),
      (v_farm, v_cycle, 'other',     'نشارة وصيانة',  round(spec.other_expenses * 0.15), spec.start_date + 22);

    -- The flock, sold twelve birds at a time until it runs out.
    v_left := spec.chicks - spec.dead;
    i := 0;
    while v_left > 0 loop
      i := i + 1;
      v_lines := least(12, v_left);
      v_left := v_left - v_lines;

      insert into orders (farm_id, cycle_id, customer_id, status, source, cleaning,
                          pickup_date, pickup_time, unit_price, cleaning_price,
                          weighed_at, delivered_at, created_at)
      values (v_farm, v_cycle,
              v_customers[1 + (i % array_length(v_customers, 1))],
              'delivered',
              case when i % 3 = 0 then 'admin' else 'customer' end::order_source,
              true,
              spec.end_date - (i % 6), (array['10:00', '13:00', '16:00', '19:00'])[1 + (i % 4)],
              80.00, 10.00,
              (spec.end_date - (i % 6)) + time '11:30',
              (spec.end_date - (i % 6)) + time '12:15',
              (spec.end_date - (i % 6)) - interval '1 day')
      returning id into v_order;

      -- Weights walk between ١.٧٥ and ٢.٢٥ كجم, averaging two kilos a bird.
      for j in 1..v_lines loop
        v_weight := 1.75 + ((i * 7 + j * 3) % 6) * 0.10;
        insert into order_line (farm_id, order_id, batch_no, position,
                                approx_weight, actual_weight, cleaning)
        values (v_farm, v_order, 1, j, round(v_weight * 4) / 4, v_weight, true);
      end loop;

      -- The invoice is never stored (D-05) — the payment is measured against the
      -- same arithmetic the app computes on read: weight × price + cleaning,
      -- rounded to whole pounds.
      select round(sum(actual_weight * 80 + 10)) into v_total
      from order_line where order_id = v_order;

      -- The last few orders of a cycle can stay open — that is the debt line.
      if i <= (spec.chicks - spec.dead + 11) / 12 - spec.unpaid then
        insert into payment (farm_id, order_id, amount, paid_at)
        values (v_farm, v_order, v_total, (spec.end_date - (i % 6)) + time '12:20');
      end if;
    end loop;
  end loop;
end
$$;
