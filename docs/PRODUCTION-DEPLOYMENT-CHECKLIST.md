# ✅ Checklist de Deployment a Producción

**Fecha Inicio**: 2025-11-16
**Estado**: En Progreso
**Objetivo**: Configurar ambiente de producción completo con nueva BD Supabase

---

## 📦 Archivos Creados

### Configuración
- ✅ `.env.production` - Variables de entorno de producción
- ✅ `docs/PRODUCTION-SETUP-GUIDE.md` - Guía completa de setup
- ✅ `docs/PRODUCTION-DEPLOYMENT-CHECKLIST.md` - Este checklist
- ✅ `scripts/create-super-admin.ts` - Script para crear admin global

### Scripts de Migración
- ✅ `scripts/all-migrations.sql` - Consolidación de migraciones 015-020 (965 líneas)
- ✅ `scripts/extract-production-schema.sh` - Script para pg_dump (requiere conexión)
- ⏳ Schema completo - Pendiente extracción

---

## 🗄️ Base de Datos de Producción

### Credenciales (Nueva BD Vacía)
```
URL: https://emtcplanfbmydqjbcuxm.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...EU70mcxjelqzuWd7izvsowusigFsIvdhzIBg_k-5LSo
Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...yaWPAW9uy45SWEjQRR4jXzmkrDvkog0xi0T0fDtWRzQ
Estado: ✅ Configurada en .env.production
```

### Pendiente
- [ ] Aplicar schema completo
- [ ] Verificar tablas creadas
- [ ] Configurar RLS policies
- [ ] Crear super usuario administrador

---

## 🚀 Próximos Pasos (RECOMENDADOS)

### Opción A: Usar Supabase Studio (MÁS SIMPLE)

1. **Exportar Schema desde Development**
   - Ir a: https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil
   - Database → SQL Editor
   - Ejecutar query para obtener DDL:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```
   - Copiar definición de cada tabla

2. **Importar a Production**
   - Ir a: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm
   - Database → SQL Editor
   - Pegar y ejecutar el schema completo

3. **Aplicar Migraciones Incrementales**
   ```bash
   # Desde SQL Editor en production, ejecutar contenido de:
   cat scripts/all-migrations.sql
   ```

4. **Crear Super Admin**
   ```bash
   npm run tsx scripts/create-super-admin.ts
   ```

### Opción B: Usar pg_dump Manual (SI FUNCIONA CONEXIÓN)

1. **Desde tu máquina local con pg_dump instalado**:
   ```bash
   PGPASSWORD="KMZvgHQAzeFdTg6O" pg_dump \
     -h db.mvvxeqhsatkqtsrulcil.supabase.co \
     -U postgres \
     -d postgres \
     --schema=public \
     --schema-only \
     --no-owner \
     --no-privileges \
     -f scripts/production-schema-full.sql
   ```

2. **Aplicar a Production**:
   ```bash
   PGPASSWORD="<PRODUCTION_PASSWORD>" psql \
     -h db.emtcplanfbmydqjbcuxm.supabase.co \
     -U postgres \
     -d postgres \
     -f scripts/production-schema-full.sql
   ```

### Opción C: Usar Supabase CLI con Docker

1. **Iniciar Docker Desktop**

2. **Generar diff del schema**:
   ```bash
   npx supabase db diff --schema public --file 000_initial_prod_schema
   ```

3. **Vincular a production y aplicar**:
   ```bash
   npx supabase unlink
   npx supabase link --project-ref emtcplanfbmydqjbcuxm
   npx supabase db push
   ```

---

## 🎯 Super Usuario Administrador

### Usar el Script Creado

```bash
# Modo interactivo (te preguntará los datos)
npx tsx scripts/create-super-admin.ts

# Modo comando directo
npx tsx scripts/create-super-admin.ts admin@vittasami.com "TuPasswordSeguro123!" "Admin Global"
```

### Datos Sugeridos
```
Email: admin@vittasami.com
Password: [GENERAR PASSWORD SEGURO]
Nombre: VittaSami Admin
Role: super_admin
```

**⚠️ IMPORTANTE**: Este usuario tendrá acceso global a TODOS los tenants. Guardar credenciales de forma segura.

---

## 🌐 Digital Ocean - Producción

### Configuración Actual
- **Ambiente**: Docker en Digital Ocean Droplet
- **Versión Actual**: Next.js 15.5.3 (pendiente upgrade a 16.0.3)
- **Domain**: app.vittasami.lat

### Pasos para Actualizar

1. **SSH al droplet**:
   ```bash
   ssh root@<DROPLET_IP>
   ```

2. **Actualizar código**:
   ```bash
   cd /app/vittasami
   git fetch origin
   git checkout main
   git pull origin main
   ```

3. **Actualizar .env con producción**:
   ```bash
   cp .env.production .env
   # Editar y agregar secrets faltantes (EMAIL_PASSWORD, TWILIO, etc.)
   ```

4. **Rebuild con Next.js 16**:
   ```bash
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

5. **Verificar logs**:
   ```bash
   docker-compose logs -f app
   ```

---

## ✅ Verificación Final

### Base de Datos
```sql
-- Contar tablas
SELECT count(*) FROM information_schema.tables
WHERE table_schema = 'public';
-- Esperado: ~15-20 tablas

-- Verificar RLS
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- Todas deberían tener rowsecurity = true

-- Verificar super admin
SELECT id, email, role FROM profiles
WHERE role = 'super_admin';
```

### Aplicación
```bash
# Test de conectividad
curl -I https://app.vittasami.lat

# Test de health endpoint (si existe)
curl https://app.vittasami.lat/api/health

# Verificar autenticación
# Login con super admin en https://app.vittasami.lat/auth/login
```

---

## 📋 Resumen de Estado Actual

### ✅ Completado
- [x] Staging environment en Vercel funcionando
- [x] Next.js 16.0.3 upgrade exitoso
- [x] Variables de entorno de producción configuradas
- [x] Script de super admin creado
- [x] Documentación completa

### ⏳ Pendiente
- [ ] Aplicar schema a base de datos de producción
- [ ] Crear super usuario administrador
- [ ] Actualizar Digital Ocean a Next.js 16
- [ ] Configurar variables de producción en droplet
- [ ] Deploy final y pruebas

### 🎯 Siguiente Acción Inmediata

**Opción Recomendada**: Usar Supabase Studio (web) para copiar el schema manualmente desde development a production. Es visual, simple y no requiere herramientas adicionales.

**Pasos**:
1. Abrir ambos proyectos Supabase en pestañas diferentes
2. Ir a SQL Editor en development
3. Copiar definiciones de tablas
4. Pegar y ejecutar en production
5. Aplicar migrations incrementales (`all-migrations.sql`)
6. Crear super admin

---

**Última Actualización**: 2025-11-16 22:00 UTC-5
**Tech Lead**: Alvaro
**Status**: 🟡 Esperando aplicación de schema a producción
