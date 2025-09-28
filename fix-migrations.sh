#!/bin/bash

echo "🔧 Arreglando migraciones para usar gen_random_uuid()..."

# Backup original migration
cp /Users/alvaro/Projects/VittaMedApp/supabase/migrations/001_initial_schema.sql /Users/alvaro/Projects/VittaMedApp/supabase/migrations/001_initial_schema.sql.backup

# Replace uuid_generate_v4() with gen_random_uuid() in all migration files
find /Users/alvaro/Projects/VittaMedApp/supabase/migrations/ -name "*.sql" -type f -exec sed -i '' 's/uuid_generate_v4()/gen_random_uuid()/g' {} \;

echo "✅ Migraciones corregidas"
echo "Ahora ejecuta: npx supabase db push"