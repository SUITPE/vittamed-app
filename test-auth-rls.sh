#!/bin/bash

echo "🔍 Probando autenticación y RLS..."

API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzk2NzcsImV4cCI6MjA3Mzc1NTY3N30.I6HTtC0i_iyZJt-ksyZHd_XdgJQm6hAZE1Xl7SZb7qg"

echo "1️⃣ Intentando login del doctor..."
DOCTOR_LOGIN=$(curl -s -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ana.rodriguez@email.com",
    "password": "password"
  }')

echo "Respuesta de login:"
echo "$DOCTOR_LOGIN" | jq '.'

# Extraer el access_token
ACCESS_TOKEN=$(echo "$DOCTOR_LOGIN" | jq -r '.access_token // empty')
USER_ID=$(echo "$DOCTOR_LOGIN" | jq -r '.user.id // empty')

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "❌ Error: No se pudo obtener access token"
  exit 1
fi

echo -e "\n2️⃣ Probando acceso a user_profiles con token de autenticación..."
echo "User ID: $USER_ID"
echo "Access Token: ${ACCESS_TOKEN:0:50}..."

curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.$USER_ID" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n3️⃣ Probando acceso sin filtro específico (debería mostrar solo el perfil del usuario)..."
curl -s -X GET "$API_URL/rest/v1/user_profiles" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n4️⃣ Probando acceso a otro perfil (debería fallar)..."
curl -s -X GET "$API_URL/rest/v1/user_profiles?id=eq.0e79a036-4d65-4252-b0d9-ac11d84a671f" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo -e "\n✅ Test de autenticación y RLS completado"