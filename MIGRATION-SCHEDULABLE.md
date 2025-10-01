# Aplicar Migración: Campo Schedulable

## ⚠️ Acción Requerida

Para habilitar la funcionalidad completa de "Agendable" en la gestión de usuarios, necesitas aplicar una migración a la base de datos.

## Síntomas

- Al hacer clic en el badge "Agendable" aparece error: _"⚠️ Migración requerida: El campo schedulable no está disponible aún..."_
- El campo `schedulable` se muestra pero no se puede modificar

## Solución: Aplicar Migración desde Supabase Dashboard

### Opción 1: SQL Editor (Recomendado)

1. **Ir a Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil
   ```

2. **Abrir SQL Editor**
   - En el menú lateral izquierdo, click en "SQL Editor"
   - Click en "New query"

3. **Copiar y Pegar el SQL**
   - Abrir: `supabase/migrations/013_add_schedulable_to_user_profiles.sql`
   - Copiar todo el contenido
   - Pegar en el SQL Editor

4. **Ejecutar**
   - Click en "Run" o presionar `Ctrl+Enter`
   - Verificar que aparezca "Success"

### Opción 2: SQL Directo

Puedes copiar directamente este SQL:

```sql
-- Add schedulable field to user_profiles
-- This field determines if a user can be scheduled for appointments

ALTER TABLE user_profiles
ADD COLUMN schedulable BOOLEAN NOT NULL DEFAULT false;

-- Update existing records: doctors and members should be schedulable by default
UPDATE user_profiles
SET schedulable = true
WHERE role IN ('doctor', 'member');

-- Add comment to explain the column
COMMENT ON COLUMN user_profiles.schedulable IS 'Indicates if this user can be scheduled for appointments (true for doctors, members, etc.)';
```

## Verificación

Después de aplicar la migración:

1. Ir a `/admin/manage-users`
2. Hacer click en un badge "Agendable" (Sí/No)
3. El valor debe cambiar sin errores
4. Los cambios se guardan en la base de datos

## Comportamiento Sin Migración

El sistema funciona con degradación elegante:

- ✅ La lista de usuarios se muestra correctamente
- ✅ El campo "Agendable" se infiere del rol (doctor/member = Sí, otros = No)
- ❌ No se puede modificar el valor de "Agendable"
- ⚠️ Se muestra mensaje de error al intentar cambiar

## Comportamiento Con Migración

- ✅ Todo funciona correctamente
- ✅ Los valores se leen desde la base de datos
- ✅ Los valores se pueden modificar con un click
- ✅ Los cambios persisten en la base de datos

## Archivo de Migración

- **Ubicación**: `supabase/migrations/013_add_schedulable_to_user_profiles.sql`
- **Descripción**: Agrega columna `schedulable` tipo BOOLEAN a tabla `user_profiles`
- **Default**: false
- **Valores iniciales**: true para roles 'doctor' y 'member'

## Soporte

Si encuentras problemas aplicando la migración:

1. Verifica que tengas permisos de administrador en Supabase
2. Asegúrate de estar conectado al proyecto correcto
3. Revisa el log de errores en el SQL Editor

## Notas

- La migración es segura y no afecta datos existentes
- Se puede aplicar en cualquier momento
- El sistema funciona antes y después de la migración (con funcionalidad limitada antes)
