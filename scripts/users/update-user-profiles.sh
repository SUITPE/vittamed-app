#!/bin/bash

echo "🔧 Actualizando user_profiles existentes..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

# IDs de usuarios conocidos
ADMIN_USER="0e79a036-4d65-4252-b0d9-ac11d84a671f"
DOCTOR_USER="e70efb0d-879e-4fdf-81ea-014ec7d50ba8"
PATIENT_USER="05a980e0-11ea-4b7e-8abe-c7029b49853d"

echo "📝 Actualizando perfiles de usuario..."

# Update admin profile
echo "Actualizando perfil admin..."
curl -s -X PATCH "$API_URL/rest/v1/user_profiles?id=eq.$ADMIN_USER" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"admin@clinicasanrafael.com\",
    \"first_name\": \"Admin\",
    \"last_name\": \"Sistema\",
    \"role\": \"admin_tenant\",
    \"tenant_id\": \"f47ac10b-58cc-4372-a567-0e02b2c3d479\"
  }"
echo "✅ Perfil admin actualizado"

# Update doctor profile
echo "Actualizando perfil doctor..."
curl -s -X PATCH "$API_URL/rest/v1/user_profiles?id=eq.$DOCTOR_USER" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"ana.rodriguez@email.com\",
    \"first_name\": \"Ana\",
    \"last_name\": \"Rodríguez\",
    \"role\": \"doctor\",
    \"doctor_id\": \"550e8400-e29b-41d4-a716-446655440001\"
  }"
echo "✅ Perfil doctor actualizado"

# Update patient profile
echo "Actualizando perfil paciente..."
curl -s -X PATCH "$API_URL/rest/v1/user_profiles?id=eq.$PATIENT_USER" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"patient@example.com\",
    \"first_name\": \"Juan\",
    \"last_name\": \"Pérez\",
    \"role\": \"patient\"
  }"
echo "✅ Perfil paciente actualizado"

echo -e "\n📋 Verificando perfiles actualizados..."
curl -s -X GET "$API_URL/rest/v1/user_profiles?select=id,email,role" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n🎉 User profiles actualizados!"
echo "Ahora ejecuta: npm test"