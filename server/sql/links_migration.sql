-- Run this in the Neon SQL editor after switching billing to PayMongo
-- Payment Links (replaces the QR Ph Payment Intent flow).
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS paymongo_link_id TEXT,
  ADD COLUMN IF NOT EXISTS reference_number TEXT,
  ALTER COLUMN paymongo_payment_intent_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_link_id
  ON payments(paymongo_link_id) WHERE paymongo_link_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_reference_number
  ON payments(reference_number) WHERE reference_number IS NOT NULL;
