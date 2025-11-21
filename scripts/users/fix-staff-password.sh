#!/bin/bash

# Update password hash for staff user
API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

# Generate password hash for "password"
PASSWORD_HASH='$2b$12$4JsyPhuEJzqp/eHNUOEbDuYk5kGJRFWsyD9cPkCS8oGJjAQa.SN7a'

echo "Updating password hash for secre@clinicasanrafael.com..."
curl -X PATCH "$API_URL/rest/v1/custom_users?email=eq.secre@clinicasanrafael.com" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"password_hash\": \"$PASSWORD_HASH\"
  }"

echo -e "\n\nPassword updated! You can now login with:"
echo "Email: secre@clinicasanrafael.com"
echo "Password: password"
