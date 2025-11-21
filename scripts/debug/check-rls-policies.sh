#!/bin/bash

echo "🔍 Verificando políticas RLS en user_profiles..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "📋 Consultando políticas RLS..."
psql "postgresql://postgres:yPxhEKAFOJWwJCHH@db.mvvxeqhsatkqtsrulcil.supabase.co:5432/postgres" -c "
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_profiles';"

echo -e "\n📋 Verificando si RLS está habilitado..."
psql "postgresql://postgres:yPxhEKAFOJWwJCHH@db.mvvxeqhsatkqtsrulcil.supabase.co:5432/postgres" -c "
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';"

echo -e "\n🔍 Verificando estructura de la tabla..."
psql "postgresql://postgres:yPxhEKAFOJWwJCHH@db.mvvxeqhsatkqtsrulcil.supabase.co:5432/postgres" -c "
\d user_profiles;"

echo -e "\n✅ Verificación completa"