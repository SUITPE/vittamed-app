# Fix: Error al registrar consulta médica

## 🐛 Problema

Al intentar crear un registro médico (consulta), la operación falla con un error de foreign key violation.

**Payload de ejemplo:**
```json
{
  "record_type": "consultation",
  "record_date": "2025-11-22",
  "chief_complaint": "Le duela la muela",
  "prescriptions": [],
  "diagnoses": []
}
```

## 🔍 Causa Raíz

La tabla `medical_records` tiene foreign keys que apuntan a `user_profiles(id)`:

```sql
doctor_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL
created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
updated_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL
```

**Pero** el sistema de autenticación usa `custom_users`, no `user_profiles`.

Cuando el backend intenta insertar:
```typescript
doctor_id: user.id,  // ID from custom_users
created_by: user.id  // ID from custom_users
```

La foreign key falla porque ese ID no existe en la tabla `user_profiles`.

## ✅ Solución

Migración creada: `supabase/migrations/022_fix_medical_records_foreign_keys.sql`

Esta migración:
1. Elimina las foreign keys antiguas que apuntan a `user_profiles`
2. Crea nuevas foreign keys que apuntan a `custom_users`
3. Actualiza las RLS policies para usar `custom_users`

## 📋 Cómo aplicar la migración

### Opción 1: Supabase Dashboard (RECOMENDADO)

1. Ve a https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil/sql/new
2. Copia y pega el contenido de `supabase/migrations/022_fix_medical_records_foreign_keys.sql`
3. Ejecuta el SQL
4. Verifica que no haya errores

### Opción 2: API de Supabase (si tienes acceso a Vercel environment)

Crear un API endpoint temporal:

```typescript
// src/app/api/admin/apply-migration/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Read migration
  const migration = fs.readFileSync('supabase/migrations/022_fix_medical_records_foreign_keys.sql', 'utf-8')

  // Execute statements one by one
  const statements = migration.split(';').filter(s => s.trim() && !s.trim().startsWith('--'))

  for (const stmt of statements) {
    await supabase.from('_sql').select().sql(stmt)
  }

  return NextResponse.json({ success: true })
}
```

### Opción 3: SQL Editor manual

Ejecutar estos comandos uno por uno en el SQL Editor:

```sql
-- 1. Drop old constraints
ALTER TABLE medical_records
  DROP CONSTRAINT IF EXISTS medical_records_doctor_id_fkey,
  DROP CONSTRAINT IF EXISTS medical_records_created_by_fkey,
  DROP CONSTRAINT IF EXISTS medical_records_updated_by_fkey;

-- 2. Add new constraints
ALTER TABLE medical_records
  ADD CONSTRAINT medical_records_doctor_id_fkey
    FOREIGN KEY (doctor_id) REFERENCES custom_users(id) ON DELETE SET NULL,
  ADD CONSTRAINT medical_records_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES custom_users(id) ON DELETE SET NULL,
  ADD CONSTRAINT medical_records_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES custom_users(id) ON DELETE SET NULL;

-- 3. Fix prescriptions
ALTER TABLE prescriptions
  DROP CONSTRAINT IF EXISTS prescriptions_prescribed_by_fkey;

ALTER TABLE prescriptions
  ADD CONSTRAINT prescriptions_prescribed_by_fkey
    FOREIGN KEY (prescribed_by) REFERENCES custom_users(id) ON DELETE SET NULL;

-- 4. Fix diagnoses
ALTER TABLE diagnoses
  DROP CONSTRAINT IF EXISTS diagnoses_diagnosed_by_fkey;

ALTER TABLE diagnoses
  ADD CONSTRAINT diagnoses_diagnosed_by_fkey
    FOREIGN KEY (diagnosed_by) REFERENCES custom_users(id) ON DELETE SET NULL;
```

## 🧪 Verificación

Después de aplicar la migración, prueba crear una consulta médica:

```bash
curl -X POST https://vittasami-staging.vercel.app/api/patients/[PATIENT_ID]/medical-records \
  -H "Content-Type: application/json" \
  -H "Cookie: vittasami-auth-token=YOUR_TOKEN" \
  -d '{
    "record_type": "consultation",
    "record_date": "2025-11-22",
    "chief_complaint": "Test"
  }'
```

Debería retornar `201 Created` con el registro médico creado.

## 📝 Archivos modificados

- ✅ `supabase/migrations/022_fix_medical_records_foreign_keys.sql` - Migración creada
- ✅ `docs/MEDICAL-RECORDS-FIX.md` - Este documento
- ❌ `scripts/database/apply-medical-records-fix.ts` - Script helper (no funcional aún)

## 🔗 Referencias

- Issue reportado: Error en https://vittasami-staging.vercel.app/api/patients/32981432-0c7c-4dc9-8847-c11aa519a5ac/medical-records
- Backend: `src/app/api/patients/[patientId]/medical-records/route.ts:153`
- Migración original: `supabase/migrations/016_medical_history.sql:19`
