#!/bin/bash

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "🔍 Verificando perfil del doctor..."
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.e70efb0d-879e-4fdf-81ea-014ec7d50ba8" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'

echo -e "\n🔍 Verificando todos los perfiles..."
curl -s -X GET "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'