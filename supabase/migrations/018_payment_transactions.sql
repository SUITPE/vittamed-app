-- Migration: payment_transactions table (TASK-BE-005)
-- Purpose: Track all payment transactions and subscription events
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant reference
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Provider info
  provider text NOT NULL, -- 'culqi', 'stripe'
  provider_charge_id text NOT NULL UNIQUE,

  -- Transaction details
  amount numeric(10, 2) NOT NULL, -- Negative for refunds
  currency text NOT NULL DEFAULT 'PEN',
  status text NOT NULL, -- 'succeeded', 'failed', 'refunded', 'pending'

  -- Plan info
  plan_key text, -- 'free', 'care', 'pro', 'enterprise'
  billing_cycle text, -- 'monthly', 'annual'

  -- Error handling
  error_message text,

  -- Metadata from payment provider
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_charge ON payment_transactions(provider_charge_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE payment_transactions IS 'Payment transactions for subscription management (TASK-BE-005)';
COMMENT ON COLUMN payment_transactions.amount IS 'Amount in currency (negative for refunds)';
COMMENT ON COLUMN payment_transactions.status IS 'succeeded | failed | refunded | pending';
COMMENT ON COLUMN payment_transactions.plan_key IS 'free | care | pro | enterprise';
