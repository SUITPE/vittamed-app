# Deprecated Code

This folder contains code that is no longer in use or has been replaced by better implementations.

## Files moved here on 2025-11-22

### Authentication-related files (user_profiles → custom_users migration)

**Reason:** These files were written for Supabase Auth + `user_profiles` table, but the project uses JWT custom auth + `custom_users` table.

#### `withFeature.ts`
- **Original location:** `src/middleware/withFeature.ts`
- **Problem:** References non-existent `user_profiles` table
- **Replacement:** Use `useFeatures` hook from `src/hooks/useFeatures.ts` instead
- **Status:** Never used in production

#### `useFeature.ts`
- **Original location:** `src/hooks/useFeature.ts`
- **Problem:** Calls broken API endpoints that reference `user_profiles`
- **Replacement:** Use `useFeatures` or `useFeatureFlag` from `src/hooks/useFeatures.ts`
- **Status:** Never used (verified with grep)

#### `api-features/`
- **Original location:** `src/app/api/features/{list,check}/route.ts`
- **Problem:**
  - Uses `supabase.auth.getUser()` instead of `customAuth.getCurrentUser()`
  - Queries `user_profiles` table which doesn't exist
  - Returns 401/404 on all requests
- **Replacement:** `/api/tenants/${tenantId}/features` endpoint
- **Status:** Broken, never worked in production

## Important Notes

- **DO NOT** restore these files without updating them to use:
  - `customAuth.getCurrentUser()` instead of `supabase.auth.getUser()`
  - `custom_users` table instead of `user_profiles`

- The correct feature gating system is in:
  - Hook: `src/hooks/useFeatures.ts`
  - API: `src/app/api/tenants/[tenantId]/features/route.ts`
  - Library: `src/lib/feature-gating.ts`

## Related Migration

See `supabase/migrations/022_fix_medical_records_foreign_keys.sql` for the database schema fix that changed references from `user_profiles` to `custom_users`.
