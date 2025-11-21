#!/bin/bash

echo "🔍 Debugging user profile queries..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

# Test doctor profile query
echo "🔍 Testing doctor profile query..."
DOCTOR_ID="e70efb0d-879e-4fdf-81ea-014ec7d50ba8"

echo "Query: /rest/v1/user_profiles?id=eq.$DOCTOR_ID"
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.$DOCTOR_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n🔍 Testing with single() equivalent..."
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.$DOCTOR_ID" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Accept: application/vnd.pgrst.object+json" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n🔍 Testing with anon key..."
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.I6HTtC0i_iyZJt-ksyZHd_XdgJQm6hAZE1Xl7SZb7qg"

curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.$DOCTOR_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ Debug complete"