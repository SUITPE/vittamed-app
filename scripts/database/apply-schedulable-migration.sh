#!/bin/bash

# Apply schedulable migration to Supabase database
PGPASSWORD='VittaMed2024!' psql \
  -h aws-0-us-east-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.mvvxeqhsatkqtsrulcil \
  -d postgres \
  -f supabase/migrations/013_add_schedulable_to_user_profiles.sql
