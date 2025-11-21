# Campo Schedulable - Configuración

## ✅ Estado: Columna Ya Existe

La columna `schedulable` ya ha sido agregada a la base de datos. Sin embargo, es posible que necesites actualizar los valores para los usuarios existentes.

## Síntomas Posibles

- ❌ Algunos usuarios tienen `schedulable = false` cuando deberían ser agendables
- ❌ Doctores o miembros del equipo no aparecen como agendables

## Solución: Actualizar Valores de Usuarios Existentes

### Paso 1: Ir a Supabase Dashboard

```
https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil
```

### Paso 2: Abrir SQL Editor

- En el menú lateral izquierdo, click en "SQL Editor"
- Click en "New query"

### Paso 3: Actualizar Valores Existentes

Copia y pega este SQL para actualizar los usuarios existentes:

```sql
-- Update existing user_profiles to set schedulable based on role
UPDATE user_profiles
SET schedulable = true
WHERE role IN ('doctor', 'member') AND (schedulable IS NULL OR schedulable = false);

-- Verify the update
SELECT role, schedulable, COUNT(*) as count
FROM user_profiles
GROUP BY role, schedulable
ORDER BY role, schedulable;
```

### Paso 4: Ejecutar

- Click en "Run" o presionar `Ctrl+Enter`
- Deberías ver cuántos registros fueron actualizados
- La segunda query te mostrará un resumen de los estados

### Si la Columna No Existe (Error 42703)

Si recibes un error diciendo que la columna no existe, aplica primero la migración completa:

```sql
-- Solo si la columna NO existe aún
ALTER TABLE user_profiles
ADD COLUMN schedulable BOOLEAN NOT NULL DEFAULT false;

-- Luego actualiza los valores
UPDATE user_profiles
SET schedulable = true
WHERE role IN ('doctor', 'member');

COMMENT ON COLUMN user_profiles.schedulable IS 'Indicates if this user can be scheduled for appointments';
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
