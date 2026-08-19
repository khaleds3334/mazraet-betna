-- Chickens the family takes for its own house (FR-36).
--
-- Modelled as a flag on the order rather than a separate kind of record: the act
-- is identical to any other order — catch the birds, weigh them, clean them —
-- and an order already comes out of the flock, so availability (FR-11) keeps
-- working with no change to the calculation.
--
-- What the flag changes is only the money: a house order is not revenue and
-- creates no debt. It carries no customer either (customer_id stays null, which
-- FR-13 already allows), so it is already invisible to every per-customer debt
-- tally without those needing to know this column exists.
alter table orders
  add column if not exists is_house boolean not null default false;

-- The selling dashboard reads every order of a cycle and then splits house from
-- sale, so the flag is part of that hot path.
create index if not exists orders_cycle_is_house_idx
  on orders (cycle_id, is_house);

comment on column orders.is_house is
  'Birds taken for the family house: leaves the flock, never counts as revenue or debt (FR-36).';
