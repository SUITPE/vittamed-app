#!/bin/bash

echo "🔥 RESETEANDO SUPABASE COMPLETAMENTE..."

PROJECT_REF="mvvxeqhsatkqtsrulcil"

echo "📋 Paso 1: Verificar conexión con Supabase"
npx supabase projects list

echo -e "\n📋 Paso 2: Resetear base de datos remota"
echo "⚠️  ESTO BORRARÁ TODOS LOS DATOS"
read -p "¿Continuar? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase db reset --linked
else
    echo "Operación cancelada"
    exit 1
fi

echo -e "\n📋 Paso 3: Verificar que el reset funcionó"
echo "Verificando estado de la base de datos..."

echo -e "\n🎉 Reset completado!"
echo "Ahora ejecuta: ./populate-database.sh"