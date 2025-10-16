#!/bin/bash

# Script to apply tenant_id migration to service_categories table
# Usage: ./apply-category-tenant-migration.sh

set -e  # Exit on any error

echo "================================================"
echo "   Service Categories Tenant Migration"
echo "================================================"
echo ""

# Database connection details
DB_HOST="db.mvvxeqhsatkqtsrulcil.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="KMZvgHQAzeFdTg6O"

# Connection string
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "📊 Database: ${DB_HOST}/${DB_NAME}"
echo "👤 User: ${DB_USER}"
echo ""

# Check if migration file exists
MIGRATION_FILE="$(dirname "$0")/add_tenant_to_service_categories.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $(basename "$MIGRATION_FILE")"
echo ""

# Confirm before proceeding
echo "⚠️  This will add tenant_id column to service_categories table."
echo "    Existing categories will remain as global (tenant_id = NULL)."
read -p "Do you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Migration cancelled."
  exit 0
fi

echo ""
echo "🚀 Applying migration..."
echo ""

# Apply migration using psql
PGPASSWORD="$DB_PASSWORD" psql "$DB_URL" -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "================================================"
  echo "✅ Migration applied successfully!"
  echo "================================================"
  echo ""
  echo "📋 Summary of changes:"
  echo "  • Added column: tenant_id (UUID, nullable)"
  echo "  • Added foreign key: service_categories_tenant_id_fkey"
  echo "  • Created index: idx_service_categories_tenant_id"
  echo "  • Created index: idx_service_categories_tenant_active"
  echo ""
  echo "🎉 Service categories are now multi-tenant ready!"
  echo ""
  echo "📝 Notes:"
  echo "  - Existing categories remain global (tenant_id = NULL)"
  echo "  - New categories can be tenant-specific or global"
  echo "  - APIs will filter by tenant_id automatically"
  echo ""
else
  echo ""
  echo "❌ Migration failed. Please check the error messages above."
  exit 1
fi
