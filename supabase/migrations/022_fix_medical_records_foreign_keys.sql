-- Fix medical_records foreign keys to reference custom_users instead of user_profiles
-- This migration fixes the issue where medical records couldn't be created because
-- the foreign keys were pointing to user_profiles instead of custom_users

-- =====================================================
-- 1. DROP EXISTING FOREIGN KEY CONSTRAINTS
-- =====================================================
ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey,
  DROP CONSTRAINT IF EXISTS medical_records_created_by_fkey,
  DROP CONSTRAINT IF EXISTS medical_records_updated_by_fkey;

ALTER TABLE prescriptions
  DROP CONSTRAINT IF EXISTS prescriptions_prescribed_by_fkey;

ALTER TABLE diagnoses
  DROP CONSTRAINT IF EXISTS diagnoses_diagnosed_by_fkey;

ALTER TABLE vaccinations
  DROP CONSTRAINT IF EXISTS vaccinations_administered_by_fkey;

-- =====================================================
-- 2. ADD NEW FOREIGN KEY CONSTRAINTS TO custom_users
-- =====================================================
ALTER TABLE medical_records
  ADD CONSTRAINT medical_records_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES custom_users(id) ON DELETE SET NULL,
  ADD CONSTRAINT medical_records_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES custom_users(id) ON DELETE SET NULL,
  ADD CONSTRAINT medical_records_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES custom_users(id) ON DELETE SET NULL;

ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_prescribed_by_fkey
    FOREIGN KEY (prescribed_by) REFERENCES custom_users(id) ON DELETE SET NULL;

ALTER TABLE diagnoses
  ADD CONSTRAINT diagnoses_diagnosed_by_fkey
    FOREIGN KEY (diagnosed_by) REFERENCES custom_users(id) ON DELETE SET NULL;

ALTER TABLE vaccinations
  ADD CONSTRAINT vaccinations_administered_by_fkey
    FOREIGN KEY (administered_by) REFERENCES custom_users(id) ON DELETE SET NULL;

-- =====================================================
-- 3. UPDATE RLS POLICIES TO USE custom_users
-- =====================================================
-- Drop old policies that referenced user_profiles
DROP POLICY IF EXISTS "Users can view medical records for their tenant" ON medical_records;
DROP POLICY IF EXISTS "Doctors can create medical records" ON medical_records;
DROP POLICY IF EXISTS "Doctors can update their own medical records" ON medical_records;

-- Create new policies using custom_users
CREATE POLICY "Users can view medical records for their tenant"
  ON medical_records FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Doctors can create medical records"
  ON medical_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_users
      WHERE id = auth.uid()
        AND role IN ('doctor', 'admin_tenant', 'super_admin')
        AND tenant_id = medical_records.tenant_id
    )
  );

CREATE POLICY "Doctors can update their own medical records"
  ON medical_records FOR UPDATE
  USING (
    doctor_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM custom_users
      WHERE id = auth.uid()
        AND role IN ('admin_tenant', 'super_admin')
        AND tenant_id = medical_records.tenant_id
    )
  );

-- Update prescriptions policies
DROP POLICY IF EXISTS "Users can view prescriptions for their tenant" ON prescriptions;
DROP POLICY IF EXISTS "Doctors can manage prescriptions" ON prescriptions;

CREATE POLICY "Users can view prescriptions for their tenant"
  ON prescriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage prescriptions"
  ON prescriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_users
      WHERE id = auth.uid()
        AND role IN ('doctor', 'admin_tenant', 'super_admin')
        AND tenant_id = prescriptions.tenant_id
    )
  );

-- Update diagnoses policies
DROP POLICY IF EXISTS "Users can view diagnoses for their tenant" ON diagnoses;
DROP POLICY IF EXISTS "Doctors can manage diagnoses" ON diagnoses;

CREATE POLICY "Users can view diagnoses for their tenant"
  ON diagnoses FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Doctors can manage diagnoses"
  ON diagnoses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_users
      WHERE id = auth.uid()
        AND role IN ('doctor', 'admin_tenant', 'super_admin')
        AND tenant_id = diagnoses.tenant_id
    )
  );
