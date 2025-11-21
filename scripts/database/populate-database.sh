#!/bin/bash

echo "📊 Poblando base de datos con datos demo..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "🏥 Paso 1: Creando tenants..."
curl -X POST "$API_URL/rest/v1/tenants" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Clínica San Rafael",
      "tenant_type": "clinic",
      "address": "Av. Principal 123, Ciudad",
      "phone": "+1234567890",
      "email": "contacto@clinicasanrafael.com"
    }
  ]'

echo -e "\n👨‍⚕️ Paso 2: Creando doctores..."
curl -X POST "$API_URL/rest/v1/doctors" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "first_name": "Ana",
      "last_name": "Rodríguez",
      "email": "ana.rodriguez@email.com",
      "phone": "+1234567801",
      "specialty": "Cardiología",
      "license_number": "MED-001"
    }
  ]'

echo -e "\n🏥 Paso 3: Creando servicios..."
curl -X POST "$API_URL/rest/v1/services" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[
    {
      "tenant_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Consulta Cardiología",
      "description": "Consulta especializada en cardiología",
      "duration_minutes": 45,
      "price": 150.00
    }
  ]'

echo -e "\n✅ Datos básicos creados!"
echo "Ahora ejecuta: ./create-users.sh"