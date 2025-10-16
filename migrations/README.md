# Database Migration: Add Profile Fields to custom_users

## 📋 Overview

This migration adds extended profile fields to the `custom_users` table to store additional user information.

## 🆕 New Columns

| Column | Type | Description |
|--------|------|-------------|
| `phone` | VARCHAR(20) | User phone number with country code (e.g., +51 999 999 999) |
| `date_of_birth` | DATE | User date of birth for age calculation |
| `address` | TEXT | User full address (street, city, postal code) |

## 🚀 How to Apply the Migration

### Option 1: Using the Bash Script (Recommended)

```bash
cd /Users/alvaro/Projects/VittaMedApp/migrations
./apply-profile-migration.sh
```

The script will:
1. Check if the migration file exists
2. Ask for confirmation before proceeding
3. Apply the migration safely (idempotent)
4. Show a summary of changes

### Option 2: Using psql Directly

```bash
PGPASSWORD='KMZvgHQAzeFdTg6O' psql \
  "postgresql://postgres:KMZvgHQAzeFdTg6O@db.mvvxeqhsatkqtsrulcil.supabase.co:5432/postgres" \
  -f add_profile_fields_to_custom_users.sql
```

### Option 3: Using Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project: `mvvxeqhsatkqtsrulcil`
3. Navigate to SQL Editor
4. Copy and paste the contents of `add_profile_fields_to_custom_users.sql`
5. Click "Run"

## ✅ Safety Features

This migration is **idempotent** and safe to run multiple times:
- ✅ Checks if columns already exist before adding them
- ✅ Skips columns that are already present
- ✅ Shows informative messages about what was done
- ✅ Creates indexes only if they don't exist
- ✅ No data loss - only adds new columns

## 🔍 Verification

After running the migration, verify the changes:

```sql
-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'custom_users'
  AND column_name IN ('phone', 'date_of_birth', 'address');

-- Check index was created
SELECT indexname FROM pg_indexes
WHERE tablename = 'custom_users'
  AND indexname = 'idx_custom_users_phone';
```

Expected output:
```
   column_name   | data_type
-----------------+-----------
 phone           | character varying
 date_of_birth   | date
 address         | text
```

## 📝 What Gets Updated

After migration, these components will work with the new fields:

### API Endpoints
- ✅ `GET /api/users/[userId]/profile` - Returns new fields
- ✅ `PATCH /api/users/[userId]/profile` - Updates new fields

### Frontend Pages
- ✅ `/profile` - Full profile editing with all fields

### Database Schema
```sql
custom_users:
  - id (uuid, primary key)
  - email (varchar, unique)
  - first_name (varchar)
  - last_name (varchar)
  - phone (varchar(20)) ⭐ NEW
  - date_of_birth (date) ⭐ NEW
  - address (text) ⭐ NEW
  - role (varchar)
  - tenant_id (uuid, nullable)
  - password_hash (varchar)
  - created_at (timestamp)
  - updated_at (timestamp)
```

## 🔄 Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove new columns (CAUTION: This will delete data)
ALTER TABLE custom_users DROP COLUMN IF EXISTS phone;
ALTER TABLE custom_users DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE custom_users DROP COLUMN IF EXISTS address;

-- Remove index
DROP INDEX IF EXISTS idx_custom_users_phone;
```

⚠️ **Warning:** Rollback will permanently delete any data stored in these columns!

## 📊 Testing

After migration, test the profile page:

1. Login to the application: http://localhost:3000/auth/login
2. Navigate to profile: http://localhost:3000/profile
3. Fill in new fields (phone, date of birth, address)
4. Click "Guardar Cambios"
5. Verify the data is saved correctly

## 🐛 Troubleshooting

### Error: "relation 'custom_users' does not exist"
- Ensure you're connected to the correct database
- Check that the `custom_users` table exists

### Error: "column already exists"
- This is normal! The migration is idempotent
- The script will skip existing columns

### Error: "permission denied"
- Ensure you're using the correct database credentials
- Check that the user has ALTER TABLE permissions

## 📞 Support

If you encounter issues:
1. Check the error message in the terminal
2. Verify database connection credentials
3. Ensure the Supabase project is accessible
4. Check the PostgreSQL logs in Supabase dashboard

---

**Created:** 2025-10-15
**Author:** VittaMed Development Team
**Status:** ✅ Ready to apply
