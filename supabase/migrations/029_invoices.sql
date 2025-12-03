-- Migration: 029_invoices.sql
-- Ticket: VT-287 - Facturación: Modelo de datos y API básica
-- Description: Create invoice tables for billing system
-- Date: 2025-12-03

-- ============================================================================
-- ENUM: invoice_status
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM (
      'draft',      -- Borrador, editable
      'pending',    -- Pendiente de pago
      'paid',       -- Pagada
      'partial',    -- Pago parcial
      'overdue',    -- Vencida
      'cancelled',  -- Cancelada
      'refunded'    -- Reembolsada
    );
    RAISE NOTICE 'Created invoice_status enum';
  ELSE
    RAISE NOTICE 'invoice_status enum already exists';
  END IF;
END $$;

-- ============================================================================
-- ENUM: invoice_type
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
    CREATE TYPE invoice_type AS ENUM (
      'invoice',      -- Factura normal
      'receipt',      -- Boleta/Recibo
      'credit_note',  -- Nota de crédito
      'debit_note',   -- Nota de débito
      'proforma'      -- Proforma (cotización)
    );
    RAISE NOTICE 'Created invoice_type enum';
  ELSE
    RAISE NOTICE 'invoice_type enum already exists';
  END IF;
END $$;

-- ============================================================================
-- ENUM: payment_method
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE payment_method AS ENUM (
      'cash',           -- Efectivo
      'card',           -- Tarjeta
      'transfer',       -- Transferencia
      'yape',           -- Yape
      'plin',           -- Plin
      'culqi',          -- Culqi online
      'stripe',         -- Stripe
      'other'           -- Otro
    );
    RAISE NOTICE 'Created payment_method enum';
  ELSE
    RAISE NOTICE 'payment_method enum already exists';
  END IF;
END $$;

-- ============================================================================
-- TABLE: invoices
-- Main invoice header table
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Tenant and patient
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,

  -- Invoice identification
  invoice_number text NOT NULL,
  invoice_type invoice_type NOT NULL DEFAULT 'invoice',
  status invoice_status NOT NULL DEFAULT 'draft',

  -- Dates
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,

  -- Amounts (in local currency, e.g., PEN)
  subtotal numeric(12, 2) NOT NULL DEFAULT 0,
  tax_rate numeric(5, 2) NOT NULL DEFAULT 18.00, -- IGV Peru 18%
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL DEFAULT 0,
  paid_amount numeric(12, 2) NOT NULL DEFAULT 0,
  balance numeric(12, 2) GENERATED ALWAYS AS (total - paid_amount) STORED,

  -- Currency
  currency text NOT NULL DEFAULT 'PEN',

  -- Payment info
  payment_method payment_method,
  payment_reference text,

  -- Related appointment (optional)
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,

  -- Customer info (denormalized for invoice persistence)
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_document_type text, -- DNI, RUC, CE, etc.
  customer_document_number text,
  customer_address text,

  -- Notes
  notes text,
  internal_notes text,

  -- Audit
  created_by uuid REFERENCES custom_users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES custom_users(id) ON DELETE SET NULL,
  voided_by uuid REFERENCES custom_users(id) ON DELETE SET NULL,
  voided_at timestamp with time zone,
  void_reason text,

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT invoices_number_tenant_unique UNIQUE (tenant_id, invoice_number),
  CONSTRAINT invoices_balance_check CHECK (balance >= 0 OR status = 'refunded'),
  CONSTRAINT invoices_due_date_check CHECK (due_date IS NULL OR due_date >= issue_date)
);

-- Comments
COMMENT ON TABLE invoices IS 'Invoice headers for billing system (VT-287)';
COMMENT ON COLUMN invoices.invoice_number IS 'Unique invoice number per tenant (e.g., F001-00001)';
COMMENT ON COLUMN invoices.tax_rate IS 'Tax rate percentage (default 18% for Peru IGV)';
COMMENT ON COLUMN invoices.balance IS 'Computed remaining balance (total - paid_amount)';

-- ============================================================================
-- TABLE: invoice_items
-- Line items for each invoice
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Item details
  item_type text NOT NULL DEFAULT 'service', -- 'service', 'product', 'other'
  description text NOT NULL,

  -- Reference to service or product (optional)
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  product_id uuid, -- Will reference products table if exists

  -- Quantity and pricing
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  unit_price numeric(12, 2) NOT NULL,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 0,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  tax_included boolean NOT NULL DEFAULT true,

  -- Computed totals
  subtotal numeric(12, 2) NOT NULL,
  tax_amount numeric(12, 2) NOT NULL DEFAULT 0,
  total numeric(12, 2) NOT NULL,

  -- Sort order
  sort_order integer NOT NULL DEFAULT 0,

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Comments
COMMENT ON TABLE invoice_items IS 'Line items for invoices (VT-287)';
COMMENT ON COLUMN invoice_items.tax_included IS 'True if unit_price includes tax';

-- ============================================================================
-- TABLE: invoice_payments
-- Payment records for invoices (supports partial payments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

  -- Payment details
  amount numeric(12, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,

  -- Provider info (for online payments)
  provider text, -- 'culqi', 'stripe', etc.
  provider_transaction_id text,

  -- Notes
  notes text,

  -- Audit
  received_by uuid REFERENCES custom_users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT invoice_payments_amount_positive CHECK (amount > 0)
);

-- Comments
COMMENT ON TABLE invoice_payments IS 'Payment records for invoices (VT-287)';

-- ============================================================================
-- TABLE: invoice_sequences
-- Auto-increment sequences per tenant and invoice type
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoice_sequences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,

  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_type invoice_type NOT NULL,
  prefix text NOT NULL DEFAULT 'F001', -- e.g., F001, B001, NC01
  current_number integer NOT NULL DEFAULT 0,

  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  -- Constraints
  CONSTRAINT invoice_sequences_tenant_type_unique UNIQUE (tenant_id, invoice_type)
);

-- Comments
COMMENT ON TABLE invoice_sequences IS 'Auto-increment sequences for invoice numbers (VT-287)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status ON invoices(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_date ON invoices(tenant_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_appointment ON invoices(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);

-- invoice_items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_service ON invoice_items(service_id) WHERE service_id IS NOT NULL;

-- invoice_payments indexes
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_sequences ENABLE ROW LEVEL SECURITY;

-- invoices policies
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
CREATE POLICY "invoices_select_policy" ON invoices
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
CREATE POLICY "invoices_insert_policy" ON invoices
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'receptionist', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
CREATE POLICY "invoices_update_policy" ON invoices
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'receptionist', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;
CREATE POLICY "invoices_delete_policy" ON invoices
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'super_admin')
    )
    AND status = 'draft' -- Only drafts can be deleted
  );

-- invoice_items policies (inherit from invoice)
DROP POLICY IF EXISTS "invoice_items_select_policy" ON invoice_items;
CREATE POLICY "invoice_items_select_policy" ON invoice_items
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id IN (
        SELECT tenant_id FROM custom_users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "invoice_items_all_policy" ON invoice_items;
CREATE POLICY "invoice_items_all_policy" ON invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id IN (
        SELECT tenant_id FROM custom_users
        WHERE id = auth.uid()
        AND role IN ('admin_tenant', 'staff', 'receptionist', 'super_admin')
      )
    )
  );

-- invoice_payments policies
DROP POLICY IF EXISTS "invoice_payments_select_policy" ON invoice_payments;
CREATE POLICY "invoice_payments_select_policy" ON invoice_payments
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id IN (
        SELECT tenant_id FROM custom_users WHERE id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "invoice_payments_insert_policy" ON invoice_payments;
CREATE POLICY "invoice_payments_insert_policy" ON invoice_payments
  FOR INSERT WITH CHECK (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id IN (
        SELECT tenant_id FROM custom_users
        WHERE id = auth.uid()
        AND role IN ('admin_tenant', 'staff', 'receptionist', 'super_admin')
      )
    )
  );

-- invoice_sequences policies
DROP POLICY IF EXISTS "invoice_sequences_all_policy" ON invoice_sequences;
CREATE POLICY "invoice_sequences_all_policy" ON invoice_sequences
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff', 'receptionist', 'super_admin')
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- updated_at triggers
DROP TRIGGER IF EXISTS update_invoices_updated_at ON invoices;
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_items_updated_at ON invoice_items;
CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoice_sequences_updated_at ON invoice_sequences;
CREATE TRIGGER update_invoice_sequences_updated_at
  BEFORE UPDATE ON invoice_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: generate_invoice_number
-- Generates next invoice number for a tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_tenant_id uuid,
  p_invoice_type invoice_type DEFAULT 'invoice'
) RETURNS text AS $$
DECLARE
  v_prefix text;
  v_next_number integer;
  v_invoice_number text;
BEGIN
  -- Get or create sequence
  INSERT INTO invoice_sequences (tenant_id, invoice_type, prefix, current_number)
  VALUES (
    p_tenant_id,
    p_invoice_type,
    CASE p_invoice_type
      WHEN 'invoice' THEN 'F001'
      WHEN 'receipt' THEN 'B001'
      WHEN 'credit_note' THEN 'NC01'
      WHEN 'debit_note' THEN 'ND01'
      WHEN 'proforma' THEN 'PF01'
    END,
    0
  )
  ON CONFLICT (tenant_id, invoice_type) DO NOTHING;

  -- Increment and get next number
  UPDATE invoice_sequences
  SET current_number = current_number + 1,
      updated_at = now()
  WHERE tenant_id = p_tenant_id AND invoice_type = p_invoice_type
  RETURNING prefix, current_number INTO v_prefix, v_next_number;

  -- Format: PREFIX-00000001
  v_invoice_number := v_prefix || '-' || lpad(v_next_number::text, 8, '0');

  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: update_invoice_totals
-- Recalculates invoice totals from items
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_totals() RETURNS trigger AS $$
DECLARE
  v_subtotal numeric(12, 2);
  v_tax_amount numeric(12, 2);
  v_total numeric(12, 2);
  v_invoice_record RECORD;
BEGIN
  -- Get the invoice_id (works for INSERT, UPDATE, DELETE)
  IF TG_OP = 'DELETE' THEN
    SELECT * INTO v_invoice_record FROM invoices WHERE id = OLD.invoice_id;
  ELSE
    SELECT * INTO v_invoice_record FROM invoices WHERE id = NEW.invoice_id;
  END IF;

  -- Calculate totals from items
  SELECT
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(total), 0)
  INTO v_subtotal, v_tax_amount, v_total
  FROM invoice_items
  WHERE invoice_id = v_invoice_record.id;

  -- Update invoice
  UPDATE invoices
  SET
    subtotal = v_subtotal,
    tax_amount = v_tax_amount,
    total = v_total - COALESCE(discount_amount, 0),
    updated_at = now()
  WHERE id = v_invoice_record.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice totals when items change
DROP TRIGGER IF EXISTS update_invoice_totals_trigger ON invoice_items;
CREATE TRIGGER update_invoice_totals_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- ============================================================================
-- FUNCTION: update_invoice_paid_amount
-- Updates paid_amount when payments change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_invoice_paid_amount() RETURNS trigger AS $$
DECLARE
  v_paid_amount numeric(12, 2);
  v_invoice_id uuid;
  v_invoice_record RECORD;
BEGIN
  -- Get the invoice_id
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_paid_amount
  FROM invoice_payments
  WHERE invoice_id = v_invoice_id;

  -- Update invoice
  SELECT * INTO v_invoice_record FROM invoices WHERE id = v_invoice_id;

  UPDATE invoices
  SET
    paid_amount = v_paid_amount,
    paid_date = CASE WHEN v_paid_amount >= total THEN CURRENT_DATE ELSE NULL END,
    status = CASE
      WHEN v_paid_amount >= total THEN 'paid'::invoice_status
      WHEN v_paid_amount > 0 THEN 'partial'::invoice_status
      ELSE status
    END,
    updated_at = now()
  WHERE id = v_invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update invoice paid_amount when payments change
DROP TRIGGER IF EXISTS update_invoice_paid_amount_trigger ON invoice_payments;
CREATE TRIGGER update_invoice_paid_amount_trigger
  AFTER INSERT OR UPDATE OR DELETE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('invoices', 'invoice_items', 'invoice_payments', 'invoice_sequences');

  IF table_count = 4 THEN
    RAISE NOTICE '✅ Migration 029 completed successfully. All 4 invoice tables created.';
  ELSE
    RAISE WARNING '⚠️ Migration 029 may have issues. Expected 4 tables, found %', table_count;
  END IF;
END $$;
