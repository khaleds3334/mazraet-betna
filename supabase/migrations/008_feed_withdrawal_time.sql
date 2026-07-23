-- ─────────────────── Feed withdrawal: opening time ───────────────────
-- The "امتي فتحت الشكارة؟" popup (A-13) captures the time the admin opened the
-- bag, and the bag-detail popup (A-13 detail) shows it ("... الساعة ١٢:٥٧ م").
-- Store it alongside the day. Nullable: existing rows predate the field.
alter table feed_withdrawal add column withdrawn_at time;
