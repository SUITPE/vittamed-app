#!/bin/bash

# Script to apply profile fields migration to custom_users table
# Usage: ./apply-profile-migration.sh

set -e  # Exit on any error

echo "================================================"
echo "   Custom Users Profile Fields Migration"
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
MIGRATION_FILE="$(dirname "$0")/add_profile_fields_to_custom_users.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Error: Migration file not found: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Migration file: $(basename "$MIGRATION_FILE")"
echo ""

# Confirm before proceeding
echo "⚠️  This will modify the custom_users table structure."
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
  echo "  • Added column: phone (VARCHAR(20))"
  echo "  • Added column: date_of_birth (DATE)"
  echo "  • Added column: address (TEXT)"
  echo "  • Created index: idx_custom_users_phone"
  echo ""
  echo "🎉 Your custom_users table is now ready for extended profile data!"
  echo ""
else
  echo ""
  echo "❌ Migration failed. Please check the error messages above."
  exit 1
fi
