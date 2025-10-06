# Sistema de Feature Flags y Suscripciones

Este documento describe el sistema de feature flags implementado en VittaMed para gestionar funcionalidades basadas en suscripciones.

## Tabla de Contenidos

1. [Arquitectura](#arquitectura)
2. [Tablas de Base de Datos](#tablas-de-base-de-datos)
3. [Planes de Suscripción](#planes-de-suscripción)
4. [Features Disponibles](#features-disponibles)
5. [Uso en Código](#uso-en-código)
6. [API Endpoints](#api-endpoints)
7. [Migración](#migración)

## Arquitectura

El sistema está diseñado para:
- ✅ Gestionar funcionalidades habilitadas/deshabilitadas por tenant
- ✅ Soportar múltiples planes de suscripción
- ✅ Permitir overrides personalizados por tenant
- ✅ Escalar fácilmente agregando nuevas features
- ✅ Preparado para integración con sistema de pagos

### Flujo de Decisión

```
¿Está habilitado para el tenant?
  ↓
  1. ¿Hay un override en tenant_features? → Usar ese valor
  2. ¿Está incluido en el plan del tenant? → Usar ese valor
  3. Por defecto → FALSE
```

## Tablas de Base de Datos

### `feature_flags`
Define todas las features disponibles en el sistema.

```sql
- id: uuid (PK)
- feature_key: text (UNIQUE) -- Identificador único
- feature_name: text -- Nombre para mostrar
- description: text
- category: text -- 'clinical', 'business', 'marketing', 'integration'
- is_premium: boolean -- Requiere plan de pago
```

### `tenant_features`
Overrides personalizados por tenant (opcional).

```sql
- id: uuid (PK)
- tenant_id: uuid (FK → tenants)
- feature_key: text (FK → feature_flags)
- is_enabled: boolean
- enabled_at: timestamp
- disabled_at: timestamp
- notes: text
```

### `subscription_plans`
Planes de suscripción disponibles.

```sql
- id: uuid (PK)
- plan_key: text (UNIQUE) -- 'free', 'basic', 'professional', 'enterprise'
- plan_name: text
- description: text
- price_monthly: numeric
- price_yearly: numeric
- max_users: integer
- max_appointments_per_month: integer
```

### `plan_features`
Mapeo de features incluidas en cada plan.

```sql
- id: uuid (PK)
- plan_key: text (FK → subscription_plans)
- feature_key: text (FK → feature_flags)
- is_included: boolean
```

### Columnas agregadas a `tenants`

```sql
- subscription_plan_key: text (FK → subscription_plans)
- subscription_starts_at: timestamp
- subscription_ends_at: timestamp
- subscription_status: text -- 'active', 'trial', 'expired', 'cancelled', 'paused'
```

## Planes de Suscripción

### Plan Gratuito (Free)
- **Precio:** $0/mes
- **Features:**
  - ✅ Gestión de Citas
  - ✅ Reservas Online
- **Límites:**
  - 2 usuarios
  - 100 citas/mes

### Plan Básico (Basic)
- **Precio:** $29/mes | $290/año
- **Features:**
  - ✅ Todo del plan Free
  - ✅ Gestión de Pacientes
  - ✅ Recetas Electrónicas
  - ✅ Historias Clínicas
  - ✅ Facturación
  - ✅ Notificaciones WhatsApp
- **Límites:**
  - 5 usuarios
  - 500 citas/mes

### Plan Profesional (Professional)
- **Precio:** $79/mes | $790/año
- **Features:**
  - ✅ Todo del plan Basic
  - ✅ Resultados de Laboratorio
  - ✅ Almacenamiento de Imágenes
  - ✅ Gestión de Inventario
  - ✅ Reportes y Estadísticas
  - ✅ Email Marketing
  - ✅ Sincronización de Calendarios
  - ✅ Integración Stripe
- **Límites:**
  - 15 usuarios
  - 2000 citas/mes

### Plan Empresarial (Enterprise)
- **Precio:** $199/mes | $1990/año
- **Features:**
  - ✅ Todas las features
  - ✅ Multi-sucursal
  - ✅ Acceso API
- **Límites:**
  - Usuarios ilimitados
  - Citas ilimitadas

## Features Disponibles

### Clínicas (Clinical)

| Feature Key | Nombre | Plan Mínimo |
|-------------|--------|-------------|
| `patient_management` | Gestión de Pacientes | Basic |
| `electronic_prescriptions` | Recetas Electrónicas | Basic |
| `medical_records` | Historias Clínicas | Basic |
| `lab_results` | Resultados de Laboratorio | Professional |
| `imaging_storage` | Almacenamiento de Imágenes | Professional |

### Negocio (Business)

| Feature Key | Nombre | Plan Mínimo |
|-------------|--------|-------------|
| `appointments` | Gestión de Citas | Free |
| `inventory_management` | Gestión de Inventario | Professional |
| `billing` | Facturación | Basic |
| `reports` | Reportes y Estadísticas | Professional |
| `multi_location` | Multi-sucursal | Enterprise |

### Marketing

| Feature Key | Nombre | Plan Mínimo |
|-------------|--------|-------------|
| `email_marketing` | Email Marketing | Professional |
| `whatsapp_notifications` | Notificaciones WhatsApp | Basic |
| `online_booking` | Reservas Online | Free |
| `loyalty_program` | Programa de Fidelización | Professional |

### Integraciones

| Feature Key | Nombre | Plan Mínimo |
|-------------|--------|-------------|
| `api_access` | Acceso API | Enterprise |
| `calendar_sync` | Sincronización de Calendario | Professional |
| `stripe_integration` | Integración Stripe | Professional |

## Uso en Código

### Hook de React

```typescript
import { useFeatures, useFeatureFlag } from '@/hooks/useFeatures'

// Opción 1: Hook completo
function MyComponent() {
  const { hasFeature, isFeatureEnabled, toggleFeature } = useFeatures()

  if (isFeatureEnabled('patient_management')) {
    return <PatientManagementUI />
  }

  return <UpgradePlanPrompt />
}

// Opción 2: Hook simple para una feature
function PatientsList() {
  const canManagePatients = useFeatureFlag('patient_management')

  if (!canManagePatients) {
    return <FeatureLockedMessage feature="Gestión de Pacientes" />
  }

  return <PatientsTable />
}
```

### Función de Base de Datos

```sql
-- Verificar si un tenant tiene una feature
SELECT tenant_has_feature(
  '123e4567-e89b-12d3-a456-426614174000',  -- tenant_id
  'patient_management'                      -- feature_key
);

-- Habilitar/deshabilitar una feature
SELECT set_tenant_feature(
  '123e4567-e89b-12d3-a456-426614174000',  -- tenant_id
  'patient_management',                     -- feature_key
  true,                                     -- is_enabled
  'Habilitado por upgrade de plan'          -- notes (opcional)
);
```

## API Endpoints

### GET /api/tenants/:tenantId/features

Obtener todas las features del tenant con su estado.

**Response:**
```json
{
  "features": [
    {
      "id": "...",
      "feature_key": "patient_management",
      "feature_name": "Gestión de Pacientes",
      "description": "Historia clínica, recetas médicas...",
      "category": "clinical",
      "is_premium": true,
      "is_enabled": true,
      "is_available_in_plan": true
    }
  ],
  "subscription_plan": "professional"
}
```

### PATCH /api/tenants/:tenantId/features

Habilitar/deshabilitar una feature (requiere rol admin).

**Request:**
```json
{
  "feature_key": "patient_management",
  "is_enabled": true,
  "notes": "Habilitado manualmente"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature patient_management enabled successfully"
}
```

### GET /api/subscription-plans

Obtener todos los planes con sus features incluidas.

**Response:**
```json
{
  "plans": [
    {
      "id": "...",
      "plan_key": "professional",
      "plan_name": "Plan Profesional",
      "price_monthly": 79,
      "price_yearly": 790,
      "max_users": 15,
      "features": [
        {
          "feature_key": "patient_management",
          "feature_name": "Gestión de Pacientes",
          ...
        }
      ]
    }
  ]
}
```

## Migración

Para aplicar el sistema de feature flags a tu base de datos:

1. **Ejecutar migración:**
   ```bash
   # En Supabase Dashboard > SQL Editor
   # Ejecutar el contenido de:
   supabase/migrations/015_tenant_features_flags.sql
   ```

2. **Verificar instalación:**
   ```sql
   -- Verificar que las tablas se crearon
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('feature_flags', 'tenant_features', 'subscription_plans', 'plan_features');

   -- Verificar que hay features cargadas
   SELECT COUNT(*) FROM feature_flags;  -- Debe retornar 17

   -- Verificar que hay planes cargados
   SELECT COUNT(*) FROM subscription_plans;  -- Debe retornar 4
   ```

3. **Actualizar tenants existentes:**
   ```sql
   -- Todos los tenants existentes quedarán en el plan 'free' por defecto
   -- Para actualizar un tenant a otro plan:
   UPDATE tenants
   SET subscription_plan_key = 'professional',
       subscription_starts_at = NOW(),
       subscription_status = 'active'
   WHERE id = 'tenant-id-aqui';
   ```

## Ejemplos de Uso

### Ejemplo 1: Condicionar renderizado de UI

```typescript
import { useFeatureFlag } from '@/hooks/useFeatures'

export default function DashboardPage() {
  const hasPatientManagement = useFeatureFlag('patient_management')
  const hasReports = useFeatureFlag('reports')

  return (
    <div>
      <h1>Dashboard</h1>

      {hasPatientManagement && (
        <PatientsSummaryCard />
      )}

      {hasReports && (
        <AdvancedReportsSection />
      )}

      {!hasReports && (
        <UpgradePrompt
          feature="Reportes Avanzados"
          requiredPlan="professional"
        />
      )}
    </div>
  )
}
```

### Ejemplo 2: Validación en API

```typescript
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const supabase = createClient(...)

  // Verificar si el tenant tiene la feature habilitada
  const { data: hasFeature } = await supabase.rpc('tenant_has_feature', {
    p_tenant_id: tenantId,
    p_feature_key: 'electronic_prescriptions'
  })

  if (!hasFeature) {
    return NextResponse.json({
      error: 'Esta funcionalidad requiere el Plan Básico o superior'
    }, { status: 403 })
  }

  // Continuar con la lógica...
}
```

### Ejemplo 3: Toggle de Feature

```typescript
import { useFeatures } from '@/hooks/useFeatures'

export default function AdminSettingsPage() {
  const { features, toggleFeature } = useFeatures()

  const handleToggle = async (featureKey: string, enabled: boolean) => {
    const success = await toggleFeature(
      featureKey,
      enabled,
      `Toggled by admin at ${new Date().toISOString()}`
    )

    if (success) {
      alert('Feature actualizada exitosamente')
    }
  }

  return (
    <div>
      {features.map(feature => (
        <div key={feature.feature_key}>
          <label>
            <input
              type="checkbox"
              checked={feature.is_enabled}
              onChange={(e) => handleToggle(feature.feature_key, e.target.checked)}
              disabled={!feature.is_available_in_plan}
            />
            {feature.feature_name}
            {!feature.is_available_in_plan && ' (No disponible en tu plan)'}
          </label>
        </div>
      ))}
    </div>
  )
}
```

## Próximos Pasos

1. **Integración con Stripe:**
   - Webhook para actualizar `subscription_status`
   - Sincronización automática de planes

2. **UI de Gestión:**
   - Página de features en `/settings`
   - Comparación de planes
   - Proceso de upgrade

3. **Métricas:**
   - Track de uso por feature
   - Alertas de límites (usuarios, citas)

4. **Notificaciones:**
   - Avisar cuando se acerca al límite
   - Recordatorios de renovación
