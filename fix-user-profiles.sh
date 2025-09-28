#!/bin/bash

echo "🔧 Arreglando user_profiles..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

# Get user IDs from the auth system
echo "📋 Obteniendo IDs de usuarios..."
ADMIN_USER=$(curl -s -X GET "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | \
  jq -r '.users[] | select(.email == "admin@clinicasanrafael.com") | .id')

DOCTOR_USER=$(curl -s -X GET "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | \
  jq -r '.users[] | select(.email == "ana.rodriguez@email.com") | .id')

PATIENT_USER=$(curl -s -X GET "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | \
  jq -r '.users[] | select(.email == "patient@example.com") | .id')

echo "Admin ID: $ADMIN_USER"
echo "Doctor ID: $DOCTOR_USER"
echo "Patient ID: $PATIENT_USER"

# Create user profiles with proper JSON
echo -e "\n📝 Creando perfiles de usuario..."

# Admin profile
echo "Creando perfil admin..."
curl -s -X POST "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$ADMIN_USER\",
    \"email\": \"admin@clinicasanrafael.com\",
    \"first_name\": \"Admin\",
    \"last_name\": \"Sistema\",
    \"role\": \"admin_tenant\",
    \"tenant_id\": \"f47ac10b-58cc-4372-a567-0e02b2c3d479\"
  }"
echo "✅ Perfil admin creado"

# Doctor profile
echo "Creando perfil doctor..."
curl -s -X POST "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$DOCTOR_USER\",
    \"email\": \"ana.rodriguez@email.com\",
    \"first_name\": \"Ana\",
    \"last_name\": \"Rodríguez\",
    \"role\": \"doctor\",
    \"doctor_id\": \"550e8400-e29b-41d4-a716-446655440001\"
  }"
echo "✅ Perfil doctor creado"

# Patient profile
echo "Creando perfil paciente..."
curl -s -X POST "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$PATIENT_USER\",
    \"email\": \"patient@example.com\",
    \"first_name\": \"Juan\",
    \"last_name\": \"Pérez\",
    \"role\": \"patient\"
  }"
echo "✅ Perfil paciente creado"

echo -e "\n🎉 User profiles arreglados!"
echo "Ahora ejecuta: ./test-auth.sh"