ALTER TABLE users
  ADD COLUMN IF NOT EXISTS plan               TEXT NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_expires_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS card_count_period   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS period_start        TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS payments (
  id                          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan                        TEXT NOT NULL,
  amount_centavos             INTEGER NOT NULL,
  currency                    TEXT NOT NULL DEFAULT 'PHP',
  paymongo_payment_intent_id  TEXT UNIQUE NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at                     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
