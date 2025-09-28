#!/bin/bash

# Create demo auth users using Supabase Auth API
API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "Creating admin user..."
curl -X POST "$API_URL/auth/v1/admin/users" \
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
  }'

echo -e "\nCreating doctor user..."
curl -X POST "$API_URL/auth/v1/admin/users" \
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
  }'

echo -e "\nCreating patient user..."
curl -X POST "$API_URL/auth/v1/admin/users" \
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
  }'

echo -e "\nDemo auth users created successfully!"