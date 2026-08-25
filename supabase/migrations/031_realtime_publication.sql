-- Realtime for the four tables a screen can go stale on (T-74).
--
-- The app never reads the payload: a change is only a signal to re-run the
-- server components (`LiveRefresh`). So this publishes nothing that a screen
-- does not already show, and every figure is still computed on the server.
--
-- RLS is the filter. `orders_select` limits a customer to his own orders and
-- `notification_select` to his own notices; Realtime applies those policies per
-- subscriber, so no client has to pass an id and none can widen its own view.
--
--   orders       → the admin's orders screen, the customer's tracking cards,
--                  and the count on his «تتبع الطلب» tab
--   notification → the badge on the bell
--   cycle        → the sale opening and closing under the countdown
--   settings     → the kilo price on the order screen
--
-- Replica identity is left alone. INSERT and UPDATE evaluate RLS against the new
-- row, which is all this needs; FULL would log every old row on every write to
-- deliver DELETE payloads nothing here asks for.
alter publication supabase_realtime add table
  public.orders,
  public.notification,
  public.cycle,
  public.settings;
