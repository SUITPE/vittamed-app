-- Add missing columns from migration 019
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS billing_cycle text,
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10, 2),
ADD COLUMN IF NOT EXISTS last_payment_error text,
ADD COLUMN IF NOT EXISTS last_payment_attempt timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Add comments
COMMENT ON COLUMN tenants.billing_cycle IS 'monthly | annual';
COMMENT ON COLUMN tenants.last_payment_amount IS 'Amount in currency (PEN)';

SELECT 'Migration completed successfully' as result;
