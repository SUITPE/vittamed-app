#!/bin/bash

echo "🔧 Arreglando políticas RLS de user_profiles..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "🗑️ Eliminando políticas RLS existentes..."
curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DROP POLICY IF EXISTS \"Users can view their own profile\" ON user_profiles;"
  }'

curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "DROP POLICY IF EXISTS \"Users can update their own profile\" ON user_profiles;"
  }'

echo "✅ Políticas antiguas eliminadas"

echo "🔒 Creando nuevas políticas RLS..."

# Política para permitir a usuarios autenticados leer su propio perfil
curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE POLICY \"Authenticated users can view their own profile\" ON user_profiles FOR SELECT USING (auth.uid() = id);"
  }'

# Política para permitir a usuarios autenticados actualizar su propio perfil
curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE POLICY \"Authenticated users can update their own profile\" ON user_profiles FOR UPDATE USING (auth.uid() = id);"
  }'

# Política adicional: permitir insertar perfil propio cuando el usuario se registra
curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "CREATE POLICY \"Users can insert their own profile\" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);"
  }'

echo "✅ Nuevas políticas RLS creadas"

echo "🔍 Verificando políticas aplicadas..."
curl -s -X POST "$API_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "sql": "SELECT policyname, cmd, permissive, roles, qual FROM pg_policies WHERE tablename = '\''user_profiles'\'';"
  }' | jq '.'

echo -e "\n🧪 Probando acceso con anon key después del fix..."
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.I6HTtC0i_iyZJt-ksyZHd_XdgJQm6hAZE1Xl7SZb7qg"

# Test con un ID específico (esto debería seguir fallando ya que anon no está autenticado)
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.e70efb0d-879e-4fdf-81ea-014ec7d50ba8" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ Fix de RLS completado!"
echo "Nota: Los usuarios autenticados ahora pueden acceder a sus propios perfiles"
echo "Los usuarios anónimos (no autenticados) no pueden acceder a ningún perfil"