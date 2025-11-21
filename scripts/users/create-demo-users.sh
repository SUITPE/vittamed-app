#!/bin/bash

# Create demo users using Supabase API
API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.-LxDF04CO66mJrg4rVpHHJLmNnTgNu_lFyfL-qZKsdw"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "Creating demo tenants..."
curl -X POST "$API_URL/rest/v1/tenants" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
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

echo -e "\nCreating demo doctors..."
curl -X POST "$API_URL/rest/v1/doctors" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
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

echo -e "\nCreating demo patients..."
curl -X POST "$API_URL/rest/v1/patients" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "first_name": "Juan",
      "last_name": "Pérez",
      "email": "patient@example.com",
      "phone": "+1234567901",
      "date_of_birth": "1985-03-15",
      "gender": "M",
      "address": "Calle Paciente 123"
    }
  ]'

echo -e "\nCreating demo user profiles..."
curl -X POST "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "id": "00000000-0000-0000-0000-000000000001",
      "email": "admin@clinicasanrafael.com",
      "first_name": "Admin",
      "last_name": "Sistema",
      "role": "admin_tenant",
      "tenant_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    },
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "email": "ana.rodriguez@email.com",
      "first_name": "Ana",
      "last_name": "Rodríguez",
      "role": "doctor",
      "doctor_id": "550e8400-e29b-41d4-a716-446655440001"
    },
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "email": "patient@example.com",
      "first_name": "Juan",
      "last_name": "Pérez",
      "role": "patient"
    }
  ]'

echo -e "\nDemo users created successfully!"
echo "Admin: admin@clinicasanrafael.com / password"
echo "Doctor: ana.rodriguez@email.com / password"
echo "Patient: patient@example.com / password"