#!/bin/bash

echo "🔧 Configurando relación doctor-tenants..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

# IDs conocidos
DOCTOR_ID="550e8400-e29b-41d4-a716-446655440001"
TENANT_ID="f47ac10b-58cc-4372-a567-0e02b2c3d479"

echo "📝 Creando relación doctor-tenant..."
curl -s -X POST "$API_URL/rest/v1/doctor_tenants" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"doctor_id\": \"$DOCTOR_ID\",
    \"tenant_id\": \"$TENANT_ID\",
    \"is_active\": true,
    \"hourly_rate\": 150.00
  }" | jq '.'

echo -e "\n✅ Relación doctor-tenant creada!"

echo -e "\n🔍 Verificando relación creada..."
curl -s -X GET "$API_URL/rest/v1/doctor_tenants?doctor_id=eq.$DOCTOR_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n🎉 ¡Doctor vinculado al tenant correctamente!"
echo "Ahora el doctor debería poder acceder a su agenda."