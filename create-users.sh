#!/bin/bash

echo "👥 Creando usuarios de autenticación..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "🔐 Creando usuario admin..."
ADMIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinicasanrafael.com",
    "password": "password",
    "email_confirm": true,
    "user_metadata": {
      "first_name": "Admin",
      "last_name": "Sistema",
      "role": "admin_tenant"
    }
  }')

echo "Admin response: $ADMIN_RESPONSE"
ADMIN_ID=$(echo $ADMIN_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Admin ID: $ADMIN_ID"

echo -e "\n👨‍⚕️ Creando usuario doctor..."
DOCTOR_RESPONSE=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana.rodriguez@email.com",
    "password": "password",
    "email_confirm": true,
    "user_metadata": {
      "first_name": "Ana",
      "last_name": "Rodríguez",
      "role": "doctor"
    }
  }')

echo "Doctor response: $DOCTOR_RESPONSE"
DOCTOR_ID=$(echo $DOCTOR_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Doctor ID: $DOCTOR_ID"

echo -e "\n🏥 Creando usuario paciente..."
PATIENT_RESPONSE=$(curl -s -X POST "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password",
    "email_confirm": true,
    "user_metadata": {
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "patient"
    }
  }')

echo "Patient response: $PATIENT_RESPONSE"
PATIENT_ID=$(echo $PATIENT_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Patient ID: $PATIENT_ID"

echo -e "\n📝 Creando perfiles de usuario..."

if [ ! -z "$ADMIN_ID" ]; then
  curl -s -X POST "$API_URL/rest/v1/user_profiles" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$ADMIN_ID\",
      \"email\": \"admin@clinicasanrafael.com\",
      \"first_name\": \"Admin\",
      \"last_name\": \"Sistema\",
      \"role\": \"admin_tenant\",
      \"tenant_id\": \"f47ac10b-58cc-4372-a567-0e02b2c3d479\"
    }"
  echo "✅ Perfil admin creado"
fi

if [ ! -z "$DOCTOR_ID" ]; then
  curl -s -X POST "$API_URL/rest/v1/user_profiles" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$DOCTOR_ID\",
      \"email\": \"ana.rodriguez@email.com\",
      \"first_name\": \"Ana\",
      \"last_name\": \"Rodríguez\",
      \"role\": \"doctor\",
      \"doctor_id\": \"550e8400-e29b-41d4-a716-446655440001\"
    }"
  echo "✅ Perfil doctor creado"
fi

if [ ! -z "$PATIENT_ID" ]; then
  curl -s -X POST "$API_URL/rest/v1/user_profiles" \
    -H "apikey: $SERVICE_KEY" \
    -H "Authorization: Bearer $SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"id\": \"$PATIENT_ID\",
      \"email\": \"patient@example.com\",
      \"first_name\": \"Juan\",
      \"last_name\": \"Pérez\",
      \"role\": \"patient\"
    }"
  echo "✅ Perfil paciente creado"
fi

echo -e "\n🎉 USUARIOS CREADOS:"
echo "   Admin: admin@clinicasanrafael.com / password"
echo "   Doctor: ana.rodriguez@email.com / password"
echo "   Patient: patient@example.com / password"
echo ""
echo "Ahora ejecuta: ./test-auth.sh"