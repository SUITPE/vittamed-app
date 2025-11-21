-- Migration: Add subscription fields to tenants table (TASK-BE-005)
-- Purpose: Track subscription status and payment info for each tenant
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Add new subscription fields to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS subscription_plan_key text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_starts_at timestamptz,
ADD COLUMN IF NOT EXISTS subscription_ends_at timestamptz,
ADD COLUMN IF NOT EXISTS billing_cycle text, -- 'monthly', 'annual'
ADD COLUMN IF NOT EXISTS last_payment_date timestamptz,
ADD COLUMN IF NOT EXISTS last_payment_amount numeric(10, 2),
ADD COLUMN IF NOT EXISTS last_payment_error text,
ADD COLUMN IF NOT EXISTS last_payment_attempt timestamptz,
ADD COLUMN IF NOT EXISTS cancellation_reason text;

-- Create index for subscription status queries
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_plan ON tenants(subscription_plan_key);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_ends ON tenants(subscription_ends_at);

-- Add comments
COMMENT ON COLUMN tenants.subscription_plan_key IS 'free | care | pro | enterprise';
COMMENT ON COLUMN tenants.subscription_status IS 'active | expired | cancelled | payment_failed';
COMMENT ON COLUMN tenants.billing_cycle IS 'monthly | annual';
COMMENT ON COLUMN tenants.last_payment_amount IS 'Amount in currency (PEN)';

-- Update existing tenants to have default subscription (free plan)
UPDATE tenants
SET subscription_plan_key = 'free',
    subscription_status = 'active'
WHERE subscription_plan_key IS NULL;
