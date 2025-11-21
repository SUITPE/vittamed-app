# Production Database Migration Plan

## Objetivo
Migrar schema completo de desarrollo a producción (base de datos vacía)

## Base de Datos de Producción
- **URL**: https://emtcplanfbmydqjbcuxm.supabase.co
- **Estado**: Nueva, vacía
- **Sin usuarios demo**

## Orden de Migración

### 1. Schema Base (Tablas Principales)
Necesitamos identificar y crear las tablas base que no están en las migraciones incrementales:
- `tenants`
- `users` / `profiles`
- `doctors`
- `patients`
- `services`
- `appointments`
- etc.

### 2. Migraciones Incrementales (en orden)
- 015_tenant_features_flags.sql
- 016_medical_history.sql
- 017_webhook_logs.sql
- 018_payment_transactions.sql
- 019_tenants_subscription_fields.sql
- 020_icd10_codes.sql

### 3. RLS Policies
Configurar Row Level Security

### 4. Super Usuario Administrador
Crear usuario administrador global con permisos completos

## Próximos Pasos
1. Extraer schema base desde BD de desarrollo
2. Crear script consolidado
3. Aplicar a producción
4. Verificar integridad
