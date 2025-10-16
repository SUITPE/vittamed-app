-- Migration: Add tenant_id to service_categories table
-- Created: 2025-10-15
-- Description: Makes service categories tenant-specific for multi-tenant isolation

-- Step 1: Add tenant_id column (nullable initially)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_categories' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE service_categories ADD COLUMN tenant_id UUID;
    RAISE NOTICE 'Column tenant_id added to service_categories';
  ELSE
    RAISE NOTICE 'Column tenant_id already exists in service_categories';
  END IF;
END $$;

-- Step 2: Add foreign key constraint to tenants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'service_categories_tenant_id_fkey'
    AND table_name = 'service_categories'
  ) THEN
    ALTER TABLE service_categories
      ADD CONSTRAINT service_categories_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
    RAISE NOTICE 'Foreign key constraint added to service_categories.tenant_id';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists on service_categories.tenant_id';
  END IF;
END $$;

-- Step 3: Create index on tenant_id for faster queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'service_categories' AND indexname = 'idx_service_categories_tenant_id'
  ) THEN
    CREATE INDEX idx_service_categories_tenant_id ON service_categories(tenant_id);
    RAISE NOTICE 'Index idx_service_categories_tenant_id created';
  ELSE
    RAISE NOTICE 'Index idx_service_categories_tenant_id already exists';
  END IF;
END $$;

-- Step 4: Create composite index for tenant_id + is_active (common query pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'service_categories' AND indexname = 'idx_service_categories_tenant_active'
  ) THEN
    CREATE INDEX idx_service_categories_tenant_active
      ON service_categories(tenant_id, is_active)
      WHERE is_active = true;
    RAISE NOTICE 'Index idx_service_categories_tenant_active created';
  ELSE
    RAISE NOTICE 'Index idx_service_categories_tenant_active already exists';
  END IF;
END $$;

-- Step 5: Add comment to document the column
COMMENT ON COLUMN service_categories.tenant_id IS 'References tenant for multi-tenant isolation. NULL means global/system category.';

-- Step 6: Display information about existing categories
DO $$
BEGIN
  RAISE NOTICE 'Existing categories will remain as global (tenant_id = NULL) unless explicitly assigned to a tenant';
END $$;

-- Display final schema
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'service_categories'
ORDER BY ordinal_position;
