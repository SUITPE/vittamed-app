# Guía de Configuración de Producción

## 📋 Resumen

Configurar el ambiente de producción de VittaSami con:
- Nueva base de datos Supabase (vacía)
- Sin usuarios demo
- Super usuario administrador
- Schema completo desde desarrollo

---

## 🎯 Opción 1: Usar Supabase CLI (Recomendado)

### Paso 1: Vincular proyecto a Development

```bash
cd /Users/alvaro/Projects/VittaSamiApp

# Vincular a proyecto de desarrollo
npx supabase link --project-ref mvvxeqhsatkqtsrulcil

# Password de DB development: KMZvgHQAzeFdTg6O
```

### Paso 2: Extraer migraciones actuales

```bash
# Generar snapshot del schema actual
npx supabase db diff --schema public -f initial_production_schema

# Esto creará: supabase/migrations/TIMESTAMP_initial_production_schema.sql
```

### Paso 3: Vincular a Production y aplicar

```bash
# Desvincular development
npx supabase unlink

# Vincular a production
npx supabase link --project-ref emtcplanfbmydqjbcuxm

# Aplicar todas las migraciones
npx supabase db push
```

---

## 🎯 Opción 2: Usar Supabase Studio (Más Simple)

### Paso 1: Acceder a Database Development

1. Abrir: https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil
2. Ir a **Database** → **Migrations**
3. Click en **Dump SQL**
4. Descargar el archivo `schema.sql`

### Paso 2: Aplicar en Production

1. Abrir: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm
2. Ir a **SQL Editor**
3. Pegar el contenido de `schema.sql`
4. Click en **Run**

---

## 🎯 Opción 3: Script Manual (Actual)

### Archivos Necesarios

1. **Schema Base**: Crear manualmente las tablas principales
2. **Migraciones Incrementales**: Aplicar archivos 015-020
3. **RLS Policies**: Configurar seguridad
4. **Super Admin**: Crear usuario administrador

### Ejecutar

```bash
# 1. Crear schema base (TODO: crear este archivo)
# psql connection_string -f scripts/base-schema.sql

# 2. Aplicar migraciones incrementales
# psql connection_string -f scripts/all-migrations.sql

# 3. Crear super admin
# npm run create-admin
```

---

## 👤 Super Usuario Administrador

### Datos del Admin

```
Email: admin@vittasami.com
Password: [GENERAR_SEGURO]
Role: super_admin
Permisos: Acceso global a todos los tenants
```

### Script de Creación

Ver: `scripts/create-super-admin.ts`

```typescript
// Crear usuario en auth.users
// Crear perfil en public.profiles con role='super_admin'
// Asignar permisos globales
```

---

## 📊 Verificación

Después de aplicar el schema, verificar:

```bash
# Contar tablas creadas
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public';

# Listar tablas principales
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

# Verificar RLS habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

Deberías ver ~15-20 tablas incluyendo:
- tenants
- profiles
- doctors
- patients
- appointments
- services
- feature_flags
- etc.

---

## 🚀 Siguiente Paso

Una vez el schema esté aplicado:

1. Crear super usuario administrador
2. Configurar variables de entorno en Digital Ocean
3. Deploy de aplicación a producción
4. Pruebas funcionales

---

## ⚠️ Notas Importantes

- **NO** aplicar seed.sql (contiene datos demo)
- **NO** copiar usuarios de desarrollo
- **SÍ** aplicar solo el schema (estructura)
- **SÍ** verificar RLS policies activas
- **SÍ** crear backup antes de cualquier cambio

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- Solución: Schema ya fue aplicado parcialmente
- Acción: Verificar qué tablas existen y aplicar solo las faltantes

### Error: "permission denied"
- Solución: Usuario no tiene permisos
- Acción: Usar service_role_key en los scripts

### Error: "foreign key constraint"
- Solución: Tablas aplicadas en orden incorrecto
- Acción: Aplicar schema completo de una sola vez

---

**Estado Actual**: Esperando decisión sobre qué opción usar para migrar el schema.

**Recomendación**: Opción 2 (Supabase Studio) es la más simple y visual.
