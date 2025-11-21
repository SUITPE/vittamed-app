# VT-38: Ciclo de vida de la cita - Implementación Completa

## 📋 Resumen del Ticket

**Título:** Ciclo de vida de la cita
**Descripción:** Gestionar estados de la cita (pendiente, confirmada, completada, cancelada)
**Criterio de aceptación:** Cada cambio queda registrado con timestamp
**Estado:** ✅ **COMPLETADO**

## 🎯 Objetivos Cumplidos

VT-38 implementa un sistema completo de gestión de ciclo de vida de citas que:
- **Rastrea todos los cambios de estado** con timestamps completos y audit trail
- **Valida transiciones de estado** según reglas de negocio
- **Registra automáticamente** cada cambio mediante triggers de base de datos
- **Proporciona APIs robustas** para gestión manual y consulta de historial
- **Integra con el sistema existente** manteniendo compatibilidad completa

## 🗄️ Implementación de Base de Datos

### Nueva Tabla: `appointment_status_history`
```sql
create table appointment_status_history (
  id uuid default uuid_generate_v4() primary key,
  appointment_id uuid references appointments(id) on delete cascade not null,
  tenant_id uuid references tenants(id) on delete cascade not null,
  status appointment_status not null,
  previous_status appointment_status,
  changed_by_user_id uuid, -- Usuario que inició el cambio
  changed_by_role text,    -- Rol del usuario (admin_tenant, doctor, member, etc.)
  reason text,             -- Razón opcional para el cambio
  notes text,              -- Notas adicionales
  automated boolean default false, -- Si fue un cambio automático
  change_source text default 'manual', -- 'manual', 'system', 'api', 'webhook'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### Triggers Automáticos para Audit Trail
```sql
-- Trigger que registra automáticamente todos los cambios de estado
create trigger appointment_status_change_trigger
  after update on appointments
  for each row
  execute function log_appointment_status_change();

-- Trigger que registra la creación inicial de citas
create trigger appointment_creation_trigger
  after insert on appointments
  for each row
  execute function log_appointment_creation();
```

### Vista de Consulta Optimizada
```sql
-- Vista que combina historial de estado con información de contexto
create view appointment_lifecycle_view as
select
  ash.id as history_id,
  ash.appointment_id,
  ash.status,
  ash.previous_status,
  ash.reason,
  ash.notes,
  ash.created_at as status_changed_at,
  -- Usuario que hizo el cambio
  up.first_name as changed_by_first_name,
  up.last_name as changed_by_last_name,
  up.email as changed_by_email,
  ash.changed_by_role,
  -- Contexto de la cita
  a.appointment_date,
  a.start_time,
  s.name as service_name,
  p.first_name as patient_first_name,
  p.last_name as patient_last_name
from appointment_status_history ash
left join user_profiles up on ash.changed_by_user_id = up.id
left join appointments a on ash.appointment_id = a.id
left join services s on a.service_id = s.id
left join patients p on a.patient_id = p.id;
```

## 🔧 APIs Implementadas

### Estructura de Endpoints
```
/api/appointments/[id]/status/          # Gestión de estado individual
├── PUT /                               # Cambiar estado de cita específica
└── GET /                               # Obtener historial de cita específica

/api/appointment-status-history/        # Historial general
├── GET /                               # Consultar historiales con filtros
└── POST /                              # Crear entrada manual de historial

/api/appointments/                      # Integración con sistema existente
├── GET /?include_history=true          # Listar citas con historial incluido
└── POST /                              # Crear cita (automáticamente registra estado inicial)
```

### Funcionalidades Principales

#### **Status Management API (`/api/appointments/[id]/status`)**

**PUT - Cambiar Estado de Cita:**
```typescript
// Ejemplo de cambio de estado
PUT /api/appointments/{appointmentId}/status
{
  "new_status": "confirmed",
  "reason": "Patient confirmed via phone",
  "notes": "Patient requested morning appointment",
  "change_source": "manual"
}

// Respuesta
{
  "success": true,
  "appointment": { /* appointment details */ },
  "status_change": {
    "from": "pending",
    "to": "confirmed",
    "changed_at": "2025-09-25T10:00:00Z",
    "changed_by": {
      "id": "user-uuid",
      "role": "receptionist"
    },
    "reason": "Patient confirmed via phone",
    "notes": "Patient requested morning appointment"
  },
  "recent_history": [ /* last 5 status changes */ ],
  "message": "Appointment status updated from 'pending' to 'confirmed' successfully"
}
```

**GET - Obtener Historial de Cita:**
```typescript
// Consulta
GET /api/appointments/{appointmentId}/status

// Respuesta
{
  "appointment": {
    "id": "appointment-uuid",
    "current_status": "confirmed",
    "tenant_id": "tenant-uuid"
  },
  "status_history": [
    {
      "history_id": "history-uuid",
      "status": "confirmed",
      "previous_status": "pending",
      "status_changed_at": "2025-09-25T10:00:00Z",
      "changed_by_first_name": "Ana",
      "changed_by_last_name": "García",
      "changed_by_role": "receptionist",
      "reason": "Patient confirmed via phone"
    },
    {
      "history_id": "history-uuid-2",
      "status": "pending",
      "previous_status": null,
      "status_changed_at": "2025-09-25T09:00:00Z",
      "reason": "Initial appointment creation"
    }
  ],
  "total_changes": 2,
  "available_transitions": ["completed", "cancelled", "no_show"]
}
```

#### **General Status History API (`/api/appointment-status-history`)**

**GET - Consultar Historiales con Filtros:**
```typescript
// Ejemplos de consulta con filtros
GET /api/appointment-status-history?appointment_id={id}
GET /api/appointment-status-history?status=confirmed&page=1&limit=20
GET /api/appointment-status-history?changed_by_role=doctor

// Respuesta paginada
{
  "status_history": [ /* array of status changes */ ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 95,
    "items_per_page": 20,
    "has_next_page": true,
    "has_previous_page": false
  },
  "filters": { /* applied filters */ },
  "summary": {
    "total_status_changes": 95,
    "unique_appointments": 23
  }
}
```

#### **Enhanced Appointments API (`/api/appointments`)**

**GET - Citas con Historial Incluido:**
```typescript
// Consulta con historial
GET /api/appointments?include_history=true&status=pending

// Respuesta mejorada
{
  "appointments": [
    {
      "id": "appointment-uuid",
      "status": "pending",
      "appointment_date": "2025-09-26",
      "start_time": "14:00",
      "patient": { /* patient details */ },
      "service": { /* service details */ },
      // VT-38: Información de ciclo de vida
      "status_history": [ /* complete status history */ ],
      "status_change_count": 1,
      "last_status_change": "2025-09-25T10:00:00Z"
    }
  ],
  "summary": {
    "total_appointments": 45,
    "status_distribution": {
      "pending": 15,
      "confirmed": 20,
      "completed": 8,
      "cancelled": 2
    }
  }
}
```

## 🔐 Validaciones de Estado Implementadas

### Reglas de Transición de Estado
```typescript
const STATUS_TRANSITION_RULES = {
  'pending': {
    allowed_next: ['confirmed', 'cancelled'],
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'confirmed': {
    allowed_next: ['completed', 'cancelled', 'no_show'],
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'cancelled': {
    allowed_next: [], // Estado terminal
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'completed': {
    allowed_next: [], // Estado terminal
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  },
  'no_show': {
    allowed_next: [], // Estado terminal
    required_roles: ['admin_tenant', 'receptionist', 'doctor', 'member']
  }
}
```

### Validaciones Aplicadas
1. **Transición válida**: Solo se permiten cambios de estado según las reglas definidas
2. **Autorización de rol**: Solo usuarios con roles apropiados pueden cambiar estados
3. **Tenancy**: Los usuarios solo pueden modificar citas dentro de su tenant
4. **Prevención de duplicados**: No se permite cambiar al mismo estado actual
5. **Audit trail inmutable**: El historial no puede modificarse una vez creado

### Mensajes de Error Específicos
- `"Status transition from 'completed' to 'pending' is not allowed"`
- `"Role 'patient' is not authorized to change appointment status"`
- `"Appointment is already in 'confirmed' status"`
- `"Appointment not found or access denied"`

## 📊 TypeScript Types Agregados

### Interfaces de Ciclo de Vida
```typescript
// Entrada de historial de estado
export interface AppointmentStatusHistory {
  id: string
  appointment_id: string
  tenant_id: string
  status: AppointmentStatus
  previous_status: AppointmentStatus | null
  changed_by_user_id: string | null
  changed_by_role: string | null
  reason?: string
  notes?: string
  automated: boolean
  change_source: 'manual' | 'system' | 'api' | 'webhook'
  created_at: string
}

// Vista extendida con contexto
export interface AppointmentLifecycleView {
  history_id: string
  appointment_id: string
  status: AppointmentStatus
  previous_status: AppointmentStatus | null
  status_changed_at: string
  // Usuario que hizo el cambio
  changed_by_first_name?: string
  changed_by_last_name?: string
  changed_by_email?: string
  changed_by_role?: string
  // Contexto de la cita
  appointment_date: string
  service_name?: string
  patient_first_name?: string
  patient_last_name?: string
  reason?: string
  notes?: string
}

// Datos para transición de estado
export interface StatusTransitionData {
  appointment_id: string
  new_status: AppointmentStatus
  reason?: string
  notes?: string
  automated?: boolean
  change_source?: 'manual' | 'system' | 'api' | 'webhook'
}

// Cita con información de ciclo de vida
export interface AppointmentWithLifecycle {
  /* ... campos de cita existentes ... */
  // Información de ciclo de vida
  status_history: AppointmentStatusHistory[]
  last_status_change?: string
  changed_by?: string
  status_change_count: number
}
```

## 🔄 Flujo Completo de Ciclo de Vida

### Creación de Cita
```
1. POST /api/appointments → Crea cita con status='pending'
2. Trigger automático → Registra estado inicial en appointment_status_history
3. Respuesta → Incluye appointment con status inicial registrado
```

### Cambio de Estado
```
1. PUT /api/appointments/{id}/status → Solicitud de cambio de estado
2. Validaciones → Transición válida + autorización + tenancy
3. UPDATE appointments → Actualiza status en tabla principal
4. Trigger automático → Registra cambio en appointment_status_history
5. Respuesta → Confirma cambio + historial reciente + transiciones disponibles
```

### Consulta de Historial
```
1. GET /api/appointments/{id}/status → Obtiene historial completo de una cita
2. GET /api/appointment-status-history → Consulta general con filtros
3. GET /api/appointments?include_history=true → Lista citas con historial incluido
```

## 🧪 Ejemplos de Uso

### 1. Crear cita (registra estado inicial automáticamente)
```bash
curl -X POST http://localhost:3001/api/appointments \
-H "Content-Type: application/json" \
-H "Authorization: Bearer {token}" \
-d '{
  "tenant_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "doctor_id": "doctor-uuid",
  "service_id": "service-uuid",
  "appointment_date": "2025-09-26",
  "start_time": "14:00",
  "patient_first_name": "Juan",
  "patient_last_name": "Pérez",
  "patient_email": "juan@email.com"
}'

# Resultado: Cita creada con status='pending' + entrada en status_history
```

### 2. Confirmar cita
```bash
curl -X PUT http://localhost:3001/api/appointments/{appointment-id}/status \
-H "Content-Type: application/json" \
-H "Authorization: Bearer {token}" \
-d '{
  "new_status": "confirmed",
  "reason": "Patient confirmed by phone",
  "notes": "Patient prefers morning appointments"
}'

# Resultado: Status cambia a 'confirmed' + nueva entrada en historial
```

### 3. Completar cita
```bash
curl -X PUT http://localhost:3001/api/appointments/{appointment-id}/status \
-H "Content-Type: application/json" \
-H "Authorization: Bearer {token}" \
-d '{
  "new_status": "completed",
  "reason": "Service provided successfully",
  "notes": "Patient satisfied with treatment"
}'

# Resultado: Status final 'completed' + entrada en historial
```

### 4. Consultar historial de una cita
```bash
curl -X GET http://localhost:3001/api/appointments/{appointment-id}/status \
-H "Authorization: Bearer {token}"

# Resultado: Historial completo de cambios de estado con detalles
```

### 5. Listar citas con historial incluido
```bash
curl -X GET "http://localhost:3001/api/appointments?include_history=true&date=2025-09-26" \
-H "Authorization: Bearer {token}"

# Resultado: Citas del día con historial de estados incluido
```

### 6. Consultar historiales con filtros
```bash
curl -X GET "http://localhost:3001/api/appointment-status-history?status=confirmed&changed_by_role=doctor" \
-H "Authorization: Bearer {token}"

# Resultado: Historiales de confirmaciones hechas por doctores
```

## ✅ Casos de Prueba Exitosos

### Validaciones de Transición Funcionando
1. ✅ **Transiciones válidas**: `pending → confirmed → completed` permitidas
2. ✅ **Transiciones inválidas**: `completed → pending` bloqueadas
3. ✅ **Estados terminales**: `cancelled`, `completed`, `no_show` no permiten cambios
4. ✅ **Autorización por rol**: Solo roles autorizados pueden cambiar estados
5. ✅ **Prevención de duplicados**: No permite cambiar al mismo estado actual

### Registro Automático de Historial
1. ✅ **Creación de cita**: Estado inicial 'pending' registrado automáticamente
2. ✅ **Cambios manuales**: Todos los cambios se registran con timestamp
3. ✅ **Metadatos completos**: Usuario, rol, razón, notas capturados
4. ✅ **Audit trail inmutable**: Historial no puede modificarse
5. ✅ **Triggers funcionando**: Cambios automáticos y manuales registrados

### APIs Respondiendo Correctamente
1. ✅ **Status management**: PUT/GET en `/api/appointments/[id]/status` funcional
2. ✅ **General history**: GET/POST en `/api/appointment-status-history` funcional
3. ✅ **Enhanced appointments**: GET con `include_history=true` funcional
4. ✅ **Error handling**: Mensajes específicos para cada tipo de error
5. ✅ **Authentication**: Protección de endpoints funcionando

## 📈 Características Avanzadas

### Row Level Security (RLS)
- **Políticas multi-tenant**: Usuarios solo acceden a historiales de su tenant
- **Audit trail inmutable**: Previene modificación/eliminación del historial
- **Roles diferenciados**: Permisos específicos por tipo de usuario

### Optimización de Performance
- **Índices estratégicos**: En appointment_id, tenant_id, status, created_at
- **Vista pre-calculada**: `appointment_lifecycle_view` para consultas complejas
- **Paginación**: Soporte para grandes volúmenes de historial

### Flexibilidad de Integración
- **Change sources**: Soporte para cambios manuales, sistema, API, webhooks
- **Automated flag**: Diferencia entre cambios automáticos y manuales
- **Custom reasons**: Razones personalizables para cada cambio
- **Rich metadata**: Contexto completo de usuario, cita, paciente, servicio

## 📊 Resumen Técnico

### Archivos Creados/Modificados
```
supabase/migrations/
└── 005_appointment_lifecycle.sql      # Migración completa con tablas, triggers, vista

src/types/
└── catalog.ts                         # Tipos extendidos para VT-38

src/app/api/
├── appointments/
│   ├── [id]/status/route.ts           # Status management individual
│   └── route.ts                       # GET mejorado con include_history
└── appointment-status-history/
    └── route.ts                       # API general de historial

VT-38-APPOINTMENT-LIFECYCLE-IMPLEMENTATION.md  # Esta documentación
```

### Compatibilidad e Integración
- ✅ **Backward compatible**: Sistema existente sigue funcionando sin cambios
- ✅ **VT-36/VT-37 integrado**: Funciona con doctores y miembros
- ✅ **Multi-tenant**: Respeta aislamiento de tenants
- ✅ **Role-based**: Autorización por roles existente
- ✅ **API-first**: Endpoints RESTful consistentes con el sistema

## 🎉 **Resultado Final**

✅ **VT-38 IMPLEMENTADO COMPLETAMENTE**

El sistema de ciclo de vida de citas está **100% funcional** con todas las capacidades requeridas:

1. ✅ **Gestión completa de estados de cita** (pending, confirmed, completed, cancelled, no_show)
2. ✅ **Cada cambio queda registrado con timestamp** - Criterio de aceptación CUMPLIDO
3. ✅ **Validaciones robustas** de transiciones de estado y autorización
4. ✅ **APIs completas** para gestión manual y consulta de historiales
5. ✅ **Triggers automáticos** que capturan todos los cambios sin intervención
6. ✅ **Audit trail inmutable** que garantiza integridad del historial
7. ✅ **Integración transparente** con el sistema de citas existente

**Criterio de aceptación:** ✅ **"Cada cambio queda registrado con timestamp"** - COMPLETAMENTE CUMPLIDO

Cada cambio de estado se registra automáticamente con:
- ✅ Timestamp exacto del cambio
- ✅ Usuario que realizó el cambio
- ✅ Estado anterior y nuevo estado
- ✅ Razón y notas del cambio
- ✅ Contexto completo (paciente, servicio, cita)
- ✅ Fuente del cambio (manual/automático/API)

**VT-38 está listo para producción y completa el sistema de gestión de citas con un ciclo de vida robusto y auditable.**