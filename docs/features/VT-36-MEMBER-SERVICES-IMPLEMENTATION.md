# VT-36: Asociar servicios a miembros - Implementación Completa

## 📋 Resumen del Ticket

**Título:** Asociar servicios a miembros
**Descripción:** Los servicios pueden asignarse a miembros específicos
**Criterio de aceptación:** El sistema solo permite reservar con miembros que brindan ese servicio
**Estado:** ✅ **COMPLETADO**

## 🗄️ Cambios en la Base de Datos

### Nueva Tabla: `member_services`
```sql
CREATE TABLE member_services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_user_id uuid NOT NULL, -- Referencias a user_profiles donde role='member'
  service_id uuid REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

  UNIQUE(member_user_id, service_id, tenant_id)
);
```

### Campos Agregados a `appointments`
```sql
ALTER TABLE appointments ADD COLUMN member_id uuid;
ALTER TABLE appointments ADD COLUMN assigned_member_id uuid;
```

**Explicación de los campos:**
- `member_id`: Miembro que realmente brindó el servicio (para citas completadas)
- `assigned_member_id`: Miembro asignado para brindar este servicio

### Políticas de Seguridad (RLS)
- **Administradores y recepcionistas**: Pueden ver/gestionar todas las asociaciones en su tenant
- **Miembros**: Pueden ver solo sus propias asignaciones de servicios
- **Doctores**: Pueden ver asociaciones en su tenant (para propósitos de reserva)
- **Público**: Puede ver asociaciones activas (para reservas)

## 🔧 APIs Implementadas

### Estructura de Endpoints
```
/api/member-services/              # CRUD asociaciones miembro-servicio
├── GET /                          # Listar asociaciones (con filtros)
├── POST /                         # Crear nueva asociación
└── [id]/
    ├── GET /                      # Obtener asociación específica
    ├── PUT /                      # Actualizar asociación
    └── DELETE /                   # Eliminar asociación

/api/members/[memberId]/services/  # Obtener servicios de un miembro
└── GET /                          # Listar servicios asignados a miembro

/api/services/[serviceId]/members/ # Obtener miembros de un servicio
├── GET /                          # Listar miembros asignados a servicio
└── POST /                         # Asignar/desasignar miembros en lote

/api/services/[serviceId]/available-members/
└── GET /                          # Obtener miembros disponibles para servicio
```

### Funcionalidades por Endpoint

#### **Member Services (`/api/member-services`)**
- `GET /` - Listar asociaciones con filtros avanzados y paginación
- `POST /` - Crear asociación (validaciones completas)
- `GET /:id` - Obtener asociación específica con relaciones
- `PUT /:id` - Actualizar asociación (solo campos permitidos)
- `DELETE /:id` - Eliminar asociación (solo admins, con validaciones de uso)

**Filtros disponibles:**
- `member_user_id` - Filtrar por miembro específico
- `service_id` - Filtrar por servicio específico
- `tenant_id` - Filtrar por tenant
- `is_active` - Filtrar por estado activo/inactivo
- `search` - Búsqueda en nombres de miembro o servicio

#### **Member Services by Member (`/api/members/[memberId]/services`)**
- `GET /` - Obtener todos los servicios asignados a un miembro
- Query params: `active_only=true` - Solo servicios activos

#### **Member Services by Service (`/api/services/[serviceId]/members`)**
- `GET /` - Obtener todos los miembros asignados a un servicio
- `POST /` - Asignar/desasignar miembros en lote

**Asignación en lote:**
```json
{
  "member_user_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "assign" | "unassign"
}
```

#### **Available Members (`/api/services/[serviceId]/available-members`)**
- `GET /` - Obtener miembros disponibles para brindar un servicio específico
- Útil para interfaces de reserva

## 📝 Tipos TypeScript Agregados

### Interfaces Principales
```typescript
// Asociación miembro-servicio
interface MemberService {
  id: string
  member_user_id: string
  service_id: string
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Relaciones pobladas
  service?: Service
  member?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string
  }
}

// Tipos para formularios
interface CreateMemberServiceData {
  member_user_id: string
  service_id: string
  tenant_id: string
  is_active?: boolean
}

interface UpdateMemberServiceData {
  is_active?: boolean
}

// Tipos extendidos con relaciones
interface ServiceWithMembers extends Service {
  assigned_members?: {
    id: string
    member_user_id: string
    is_active: boolean
    member: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
    }
  }[]
}

interface MemberWithServices {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string
  tenant_id: string | null
  assigned_services?: {
    id: string
    service_id: string
    is_active: boolean
    service: Service
  }[]
}
```

## 🔐 Validaciones Implementadas

### Validaciones de Negocio
1. **Asociación única**: Un miembro no puede estar asignado al mismo servicio múltiples veces en el mismo tenant
2. **Validación de rol**: Solo usuarios con rol 'member' pueden ser asignados a servicios
3. **Validación de tenant**: Tanto el miembro como el servicio deben pertenecer al mismo tenant
4. **Validación de servicio activo**: Solo se pueden asignar servicios activos
5. **Prevención de eliminación**: No se pueden eliminar asociaciones si hay citas activas

### Validaciones en Reservas (VT-36)
- **Nueva validación crítica**: Al crear una cita con `member_id`, se valida que el miembro esté autorizado para brindar ese servicio específico
- **Prevención de doble booking**: Se verifican conflictos tanto para doctores como para miembros
- **Campos opcionales**: Las citas pueden tener `doctor_id` O `member_id`, pero no ambos

## 🚀 Integración con Sistema de Reservas

### API de Appointments Actualizada
La API `/api/appointments` ahora acepta:

```json
{
  "tenant_id": "uuid",
  "service_id": "uuid",
  "appointment_date": "2025-09-25",
  "start_time": "14:30",
  // NUEVO: Soporte para miembros
  "member_id": "uuid",  // O doctor_id, pero no ambos
  "patient_first_name": "Juan",
  "patient_last_name": "Pérez",
  "patient_email": "juan@email.com",
  "patient_phone": "+1234567890"
}
```

### Validaciones de Reserva
1. **Validación de autorización**: Si se especifica `member_id`, se verifica que existe una asociación activa en `member_services`
2. **Prevención de conflictos**: Se verifican horarios ocupados tanto para doctores como miembros
3. **Campos requeridos**: Se requiere `doctor_id` O `member_id`, pero no ambos

### Nuevos Campos en Appointments
- `assigned_member_id`: Miembro asignado para brindar el servicio
- `member_id`: Miembro que realmente brindó el servicio (opcional, para tracking)

## 🧪 Ejemplos de Uso

### 1. Asignar un miembro a un servicio
```bash
POST /api/member-services
{
  "member_user_id": "member-uuid",
  "service_id": "service-uuid",
  "tenant_id": "tenant-uuid",
  "is_active": true
}
```

### 2. Obtener miembros disponibles para un servicio
```bash
GET /api/services/{serviceId}/available-members?tenant_id=tenant-uuid
```

### 3. Crear cita con miembro
```bash
POST /api/appointments
{
  "tenant_id": "tenant-uuid",
  "member_id": "member-uuid",  # En lugar de doctor_id
  "service_id": "service-uuid",
  "appointment_date": "2025-09-25",
  "start_time": "14:30",
  "patient_first_name": "Juan",
  "patient_last_name": "Pérez",
  "patient_email": "juan@email.com"
}
```

### 4. Asignación masiva de miembros a un servicio
```bash
POST /api/services/{serviceId}/members
{
  "member_user_ids": ["uuid1", "uuid2", "uuid3"],
  "action": "assign"
}
```

## ✅ Casos de Prueba Exitosos

### Validaciones Funcionando
1. ✅ **Autorización de servicio**: Las citas solo se pueden crear si el miembro está autorizado
2. ✅ **Prevención de duplicados**: No se pueden crear asociaciones duplicadas
3. ✅ **Validación de roles**: Solo usuarios con rol 'member' se pueden asignar
4. ✅ **Seguridad por tenant**: Las asociaciones respetan los límites del tenant
5. ✅ **APIs respondiendo**: Todos los endpoints devuelven respuestas correctas

### Funcionalidades Operativas
1. ✅ **CRUD completo** para asociaciones miembro-servicio
2. ✅ **Filtros avanzados** y paginación
3. ✅ **Asignación en lote** de miembros a servicios
4. ✅ **Integración con reservas** validando autorización
5. ✅ **Prevención de conflictos** de horarios

## 📊 Resumen Técnico

### Archivos Creados/Modificados
```
supabase/migrations/
└── 003_member_services.sql                    # Migración completa

src/types/
└── catalog.ts                                 # Tipos agregados para VT-36

src/app/api/
├── member-services/
│   ├── route.ts                              # CRUD principal
│   └── [id]/route.ts                         # CRUD individual
├── members/[memberId]/services/
│   └── route.ts                              # Servicios por miembro
├── services/[serviceId]/
│   ├── members/route.ts                      # Miembros por servicio
│   └── available-members/route.ts            # Miembros disponibles
└── appointments/
    └── route.ts                              # API actualizada con validación VT-36
```

### Características Avanzadas
- **Row Level Security (RLS)**: Políticas completas de seguridad
- **Validaciones robustas**: Integridad referencial y de negocio
- **Paginación eficiente**: Para listas grandes
- **Búsqueda de texto completo**: En nombres y descripciones
- **Asignación en lote**: Para gestión masiva de miembros
- **Prevención de conflictos**: Validación de horarios ocupados
- **Compatibilidad**: Funciona junto con el sistema de doctores existente

## 🎉 **Resultado Final**

✅ **VT-36 IMPLEMENTADO COMPLETAMENTE**

El sistema de asociación de servicios a miembros está **100% funcional** con todas las validaciones requeridas:

1. ✅ **Los servicios se pueden asignar a miembros específicos**
2. ✅ **El sistema solo permite reservar con miembros que brindan ese servicio**
3. ✅ **APIs completas para gestión de asociaciones**
4. ✅ **Validaciones robustas y seguridad por tenant**
5. ✅ **Integración completa con el sistema de reservas**

**El sistema está listo para producción y cumple completamente con los criterios de aceptación del ticket VT-36.**