#!/bin/bash

echo "🧪 Probando sistema de autenticación..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "📋 Paso 1: Verificando usuarios de autenticación..."
AUTH_USERS=$(curl -s -X GET "$API_URL/auth/v1/admin/users" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "Usuarios encontrados:"
echo $AUTH_USERS | jq '.users | length' 2>/dev/null || echo "Error obteniendo usuarios"

echo -e "\n📋 Paso 2: Verificando perfiles de usuario..."
USER_PROFILES=$(curl -s -X GET "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "Perfiles encontrados:"
echo $USER_PROFILES | jq '. | length' 2>/dev/null || echo "Error obteniendo perfiles"

echo -e "\n📋 Paso 3: Verificando tenants..."
TENANTS=$(curl -s -X GET "$API_URL/rest/v1/tenants" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "Tenants encontrados:"
echo $TENANTS | jq '. | length' 2>/dev/null || echo "Error obteniendo tenants"

echo -e "\n📋 Paso 4: Verificando doctores..."
DOCTORS=$(curl -s -X GET "$API_URL/rest/v1/doctors" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "Doctores encontrados:"
echo $DOCTORS | jq '. | length' 2>/dev/null || echo "Error obteniendo doctores"

echo -e "\n📋 Paso 5: Verificando servicios..."
SERVICES=$(curl -s -X GET "$API_URL/rest/v1/services" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json")

echo "Servicios encontrados:"
echo $SERVICES | jq '. | length' 2>/dev/null || echo "Error obteniendo servicios"

echo -e "\n🔐 Paso 6: Probando login con admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinicasanrafael.com",
    "password": "password"
  }')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // empty' 2>/dev/null)
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Login admin exitoso"
else
  echo "❌ Login admin falló"
  echo "Response: $LOGIN_RESPONSE"
fi

echo -e "\n🔐 Paso 7: Probando login con doctor..."
DOCTOR_LOGIN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana.rodriguez@email.com",
    "password": "password"
  }')

DOCTOR_TOKEN=$(echo $DOCTOR_LOGIN | jq -r '.access_token // empty' 2>/dev/null)
if [ ! -z "$DOCTOR_TOKEN" ] && [ "$DOCTOR_TOKEN" != "null" ]; then
  echo "✅ Login doctor exitoso"
else
  echo "❌ Login doctor falló"
  echo "Response: $DOCTOR_LOGIN"
fi

echo -e "\n🔐 Paso 8: Probando login con paciente..."
PATIENT_LOGIN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@example.com",
    "password": "password"
  }')

PATIENT_TOKEN=$(echo $PATIENT_LOGIN | jq -r '.access_token // empty' 2>/dev/null)
if [ ! -z "$PATIENT_TOKEN" ] && [ "$PATIENT_TOKEN" != "null" ]; then
  echo "✅ Login paciente exitoso"
else
  echo "❌ Login paciente falló"
  echo "Response: $PATIENT_LOGIN"
fi

echo -e "\n🎯 RESUMEN:"
echo "================================"
if [ ! -z "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Admin: OK"
else
  echo "❌ Admin: FALLA"
fi

if [ ! -z "$DOCTOR_TOKEN" ] && [ "$DOCTOR_TOKEN" != "null" ]; then
  echo "✅ Doctor: OK"
else
  echo "❌ Doctor: FALLA"
fi

if [ ! -z "$PATIENT_TOKEN" ] && [ "$PATIENT_TOKEN" != "null" ]; then
  echo "✅ Paciente: OK"
else
  echo "❌ Paciente: FALLA"
fi

echo ""
echo "🚀 Si todos los usuarios están OK, ejecuta:"
echo "   npm test"
echo ""
echo "🔧 Si hay fallos, revisa la configuración de Supabase"