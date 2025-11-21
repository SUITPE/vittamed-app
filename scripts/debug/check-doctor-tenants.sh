#!/bin/bash

echo "🔍 Verificando relación doctor-tenants..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "📋 Verificando datos del doctor..."
DOCTOR_ID="550e8400-e29b-41d4-a716-446655440001"
USER_ID="e70efb0d-879e-4fdf-81ea-014ec7d50ba8"

echo "1️⃣ Doctor en la tabla doctors:"
curl -s -X GET "$API_URL/rest/v1/doctors?id=eq.$DOCTOR_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n2️⃣ User profile del doctor:"
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.$USER_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n3️⃣ Relación doctor_tenants:"
curl -s -X GET "$API_URL/rest/v1/doctor_tenants?doctor_id=eq.$DOCTOR_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n4️⃣ Todos los doctor_tenants:"
curl -s -X GET "$API_URL/rest/v1/doctor_tenants" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n✅ Verificación completa"