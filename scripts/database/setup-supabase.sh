#!/bin/bash

echo "🚀 Configurando Supabase para VittaMed..."

# Configurar variables
PROJECT_REF="mvvxeqhsatkqtsrulcil"
API_URL="https://mvvxeqhsatkqtsrulcil.supabase.co"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dnhlcWhzYXRrcXRzcnVsY2lsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODE3OTY3NywiZXhwIjoyMDczNzU1Njc3fQ.OcNBQsO8VEfdd6p87P4qVt74iHr8NeoDRAZ4r6fZmGU"

echo "📋 Paso 1: Link del proyecto local con Supabase remoto"
echo "   Ejecuta: npx supabase link --project-ref $PROJECT_REF"
echo "   Cuando te pida la database password, usa: NdV2lVgNHzxXq2ZH"
echo ""

echo "📋 Paso 2: Verificar estado actual"
echo "   Ejecuta: npx supabase db dump --data-only"
echo ""

echo "📋 Paso 3: Resetear y aplicar migraciones"
echo "   Ejecuta: npx supabase db reset --linked"
echo ""

echo "⚠️  INSTRUCCIONES:"
echo "1. Ejecuta cada comando UNO POR UNO"
echo "2. Si npx supabase link falla, ejecuta primero: npx supabase login"
echo "3. Después de reset, ejecuta: ./populate-database.sh"
echo ""
echo "🔐 Credenciales necesarias:"
echo "   Database password: NdV2lVgNHzxXq2ZH"
echo "   Project ref: $PROJECT_REF"