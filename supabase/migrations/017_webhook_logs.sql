-- Migration: webhook_logs table for Culqi webhook auditing (TASK-BE-004)
-- Purpose: Log all webhook attempts for security and debugging
-- Author: Backend Dev 1
-- Date: 2025-11-07

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Provider info
  provider text NOT NULL, -- 'culqi', 'stripe', etc.

  -- Event info
  event_type text NOT NULL, -- 'charge.succeeded', 'charge.failed', etc.
  status text NOT NULL, -- 'received', 'processed', 'signature_failed', 'error'

  -- Payload and signature
  payload jsonb NOT NULL,
  signature_header text,

  -- Error tracking
  processing_error text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- Index for idempotency check (TASK-BE-005)
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id
ON webhook_logs(provider, (payload->>'id'), status)
WHERE status = 'processed';

-- Add comment
COMMENT ON TABLE webhook_logs IS 'Logs all webhook attempts for auditing and debugging (TASK-BE-004)';
COMMENT ON COLUMN webhook_logs.status IS 'received | processed | signature_failed | signature_missing | error';
COMMENT ON COLUMN webhook_logs.processing_error IS 'Error message if processing failed';
