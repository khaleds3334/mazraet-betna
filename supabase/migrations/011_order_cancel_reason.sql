-- Why an order was cancelled (A-51). The admin types it into the confirm dialog
-- and the cancelled card shows it back, so he remembers months later why a
-- customer's order never happened. Nullable: rows cancelled before this existed
-- have no reason.
alter table orders add column if not exists cancel_reason text;
