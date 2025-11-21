#!/bin/bash
#
# Script para extraer el schema completo desde Supabase Development
# y generar un archivo SQL listo para aplicar a Producción
#

set -e

echo "🔍 Extrayendo schema desde base de datos de DESARROLLO..."
echo ""

# Credenciales de Development
DB_HOST="db.mvvxeqhsatkqtsrulcil.supabase.co"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="KMZvgHQAzeFdTg6O"
DB_NAME="postgres"

# Archivo de salida
OUTPUT_FILE="scripts/production-schema.sql"

# Usar pg_dump para extraer solo el schema (sin datos)
echo "📦 Ejecutando pg_dump..."
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --schema=public \
  --schema-only \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="$OUTPUT_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Schema extraído exitosamente"
  echo "📄 Archivo: $OUTPUT_FILE"
  echo ""
  echo "Estadísticas:"
  echo "  - Líneas totales: $(wc -l < $OUTPUT_FILE)"
  echo "  - Tamaño: $(du -h $OUTPUT_FILE | cut -f1)"
  echo ""
  echo "💡 Próximo paso: Revisar el archivo y aplicarlo a producción"
else
  echo ""
  echo "❌ Error al extraer schema"
  exit 1
fi
