# Best Practices - VittaMed Development

## 🎯 Lecciones Aprendidas de Multi-tenant Service Categories

### 1. Row Level Security (RLS) y Service Role Key

#### Problema Común
Las políticas RLS de Supabase bloquean operaciones INSERT/UPDATE/DELETE incluso cuando el usuario está autenticado y autorizado.

#### Solución
Usar `createAdminClient()` con service role key para operaciones que requieren bypass de RLS.

```typescript
// ❌ MAL - Usa anon key, sujeto a RLS
const supabase = await getSupabaseServerClient()
const { data, error } = await supabase.from('table').insert(...)

// ✅ BIEN - Usa service role key, bypassa RLS
const adminClient = await createAdminClient()
const { data, error } = await adminClient.from('table').insert(...)
```

#### Cuándo Usar Admin Client
- **DELETE**: Siempre que necesites eliminar registros
- **INSERT**: Cuando RLS bloquea creación de registros
- **UPDATE**: Si las políticas RLS son restrictivas
- **Bulk Operations**: Operaciones masivas que necesitan eficiencia

#### Checklist de Seguridad
Antes de usar admin client, SIEMPRE verificar:
1. ✅ Usuario está autenticado
2. ✅ Usuario pertenece al tenant correcto
3. ✅ Usuario tiene el rol apropiado (admin_tenant, staff, etc.)
4. ✅ Validar ownership de los recursos (tenant_id match)

```typescript
// Patrón de seguridad recomendado
export async function DELETE(request: NextRequest) {
  // 1. Autenticación
  const user = await customAuth.getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Verificar perfil y rol
  const supabase = await getSupabaseServerClient()
  const { data: profile } = await supabase
    .from('custom_users')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!['admin_tenant', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Verificar ownership del recurso
  const { data: resource } = await supabase
    .from('resource_table')
    .select('tenant_id')
    .eq('id', resourceId)
    .single()

  if (resource.tenant_id !== profile.tenant_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. AHORA SÍ usar admin client
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('resource_table')
    .delete()
    .eq('id', resourceId)
}
```

---

### 2. Context7 Flows vs Direct Database Operations

#### Problema
Context7 flows que llaman al mismo endpoint que los invocó crean **loops infinitos**.

```typescript
// ❌ CAUSA LOOP INFINITO
export async function POST(request: Request) {
  // Este endpoint es llamado desde el frontend
  const result = await executeServiceFlow('create', body)
  // El flow internamente hace: fetch('/api/tenants/[id]/services')
  // Lo cual llama de nuevo a POST → loop infinito
}
```

#### Solución
Para operaciones CRUD simples, usar **inserción directa** en lugar de flows.

```typescript
// ✅ CORRECTO - Inserción directa
export async function POST(request: Request) {
  const adminClient = await createAdminClient()
  const { data, error } = await adminClient
    .from('services')
    .insert(body)
    .select()
    .single()

  return NextResponse.json({ service: data }, { status: 201 })
}
```

#### Cuándo Usar Context7 Flows
- ✅ Procesos multi-paso con lógica de negocio compleja
- ✅ Operaciones que requieren rollback
- ✅ Workflows que involucran múltiples tablas/servicios
- ✅ Integración con servicios externos (Stripe, notificaciones)

#### Cuándo NO Usar Context7 Flows
- ❌ CRUD simple de una sola tabla
- ❌ Operaciones que llaman al mismo endpoint
- ❌ Queries de lectura simples
- ❌ Validaciones básicas

---

### 3. Data Refresh en Next.js 15

#### Problema
`router.refresh()` no siempre actualiza datos del servidor de forma confiable.

```typescript
// ❌ NO CONFIABLE
const handleDelete = async () => {
  await fetch('/api/delete', { method: 'DELETE' })
  router.refresh() // Puede no actualizar los datos
}
```

#### Solución
Fetch explícito desde el servidor con `cache: 'no-store'`.

```typescript
// ✅ CONFIABLE
const refreshData = async () => {
  try {
    const [servicesRes, categoriesRes] = await Promise.all([
      fetch(`/api/tenants/${tenantId}/services`, {
        cache: 'no-store'
      }),
      fetch(`/api/tenants/${tenantId}/categories`, {
        cache: 'no-store'
      })
    ])

    if (servicesRes.ok) {
      const data = await servicesRes.json()
      setServices(data.services || [])
    }

    if (categoriesRes.ok) {
      const data = await categoriesRes.json()
      setCategories(data || [])
    }

    router.refresh() // Opcional, para actualizar Server Components
  } catch (error) {
    console.error('Error refreshing data:', error)
  }
}

const handleDelete = async () => {
  await fetch('/api/delete', { method: 'DELETE' })
  await refreshData() // Fetch explícito
}
```

#### Patrón Optimistic Updates (Opcional)
Para mejor UX, combinar con updates optimistas:

```typescript
const handleDelete = async (id: string) => {
  // 1. Update optimista inmediato
  setCategories(prev => prev.filter(c => c.id !== id))

  try {
    // 2. Llamada al servidor
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      // 3. Rollback si falla
      await refreshData()
      throw new Error('Delete failed')
    }

    // 4. Confirmar con servidor
    await refreshData()
  } catch (error) {
    // Ya hicimos rollback
    setError('Error al eliminar')
  }
}
```

---

### 4. Multi-tenant Data Isolation

#### Checklist para Nuevas Tablas
Al agregar una nueva tabla que debe ser multi-tenant:

```sql
-- 1. Agregar columna tenant_id
ALTER TABLE nueva_tabla
  ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 2. Índices para performance
CREATE INDEX idx_nueva_tabla_tenant_id ON nueva_tabla(tenant_id);
CREATE INDEX idx_nueva_tabla_tenant_active
  ON nueva_tabla(tenant_id, is_active)
  WHERE is_active = true;

-- 3. RLS Policies
ALTER TABLE nueva_tabla ENABLE ROW LEVEL SECURITY;

-- Policy para SELECT
CREATE POLICY "Users can view their tenant data"
  ON nueva_tabla FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
    )
  );

-- Policy para INSERT (si aplica)
CREATE POLICY "Admins can insert for their tenant"
  ON nueva_tabla FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM custom_users
      WHERE id = auth.uid()
      AND role IN ('admin_tenant', 'staff')
    )
  );
```

#### TypeScript Interface
```typescript
export interface NuevaTabla {
  id: string
  tenant_id: string | null // null = global (si aplica)
  // ... otros campos
  is_active: boolean
  created_at: string
  updated_at: string
}
```

---

### 5. API Route Patterns

#### GET Endpoint Pattern
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    const { searchParams } = new URL(request.url)

    // Autenticación
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar tenant
    if (user.profile?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Query con filtros
    const supabase = await getSupabaseServerClient()
    let query = supabase
      .from('table')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    // Filtros opcionales
    const search = searchParams.get('search')
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const isActive = searchParams.get('is_active')
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### POST Endpoint Pattern
```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params

    // 1. Autenticación
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Autorización
    if (user.profile?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!['admin_tenant', 'staff'].includes(user.profile?.role || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Parsear y validar body
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (name.length > 255) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 })
    }

    // 4. Check duplicates
    const supabase = await getSupabaseServerClient()
    const { data: existing } = await supabase
      .from('table')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', name.trim())
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `"${name}" already exists` },
        { status: 409 }
      )
    }

    // 5. Insert con admin client
    const adminClient = await createAdminClient()
    const { data, error } = await adminClient
      .from('table')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Creation failed' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

#### DELETE Endpoint Pattern
```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 1. Autenticación
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get perfil
    const supabase = await getSupabaseServerClient()
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!['admin_tenant', 'staff'].includes(profile?.role || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 3. Check dependencies
    const { data: dependencies } = await supabase
      .from('dependent_table')
      .select('id')
      .eq('foreign_key', id)
      .limit(1)

    if (dependencies && dependencies.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete - resource is in use' },
        { status: 409 }
      )
    }

    // 4. Verify ownership
    const { data: resource } = await supabase
      .from('table')
      .select('id, tenant_id')
      .eq('id', id)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (resource.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Delete con admin client
    const adminClient = await createAdminClient()
    const { data: deleted, error } = await adminClient
      .from('table')
      .delete()
      .eq('id', id)
      .select()

    if (error || !deleted || deleted.length === 0) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Deleted successfully',
      deleted: deleted[0]
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

---

### 6. Form Input Best Practices

#### Controlled Inputs con Números
```typescript
// ❌ MAL - Puede causar NaN
<input
  type="number"
  value={formData.price}
  onChange={(e) => setFormData({
    ...formData,
    price: parseFloat(e.target.value)
  })}
/>

// ✅ BIEN - Maneja empty string
<input
  type="number"
  value={formData.price || ''}
  onChange={(e) => setFormData({
    ...formData,
    price: parseFloat(e.target.value) || 0
  })}
/>
```

#### Validación de Inputs
```typescript
// En el componente
const [errors, setErrors] = useState<Record<string, string>>({})

const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {}

  if (!formData.name.trim()) {
    newErrors.name = 'El nombre es requerido'
  } else if (formData.name.length > 255) {
    newErrors.name = 'El nombre es muy largo'
  }

  if (formData.price < 0) {
    newErrors.price = 'El precio debe ser positivo'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  // Continuar con submit...
}
```

---

### 7. Migration Best Practices

#### Idempotent Migrations
Siempre usar bloques `DO` para hacer migrations idempotentes:

```sql
-- ✅ Idempotente - puede ejecutarse múltiples veces
DO $$
BEGIN
  -- Agregar columna solo si no existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'table' AND column_name = 'new_column'
  ) THEN
    ALTER TABLE table ADD COLUMN new_column UUID;
    RAISE NOTICE 'Column added';
  ELSE
    RAISE NOTICE 'Column already exists';
  END IF;
END $$;

-- ✅ Agregar constraint solo si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'constraint_name'
  ) THEN
    ALTER TABLE table
      ADD CONSTRAINT constraint_name
      FOREIGN KEY (column) REFERENCES other_table(id);
    RAISE NOTICE 'Constraint added';
  END IF;
END $$;

-- ✅ Crear índice solo si no existe
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```

#### Migration Checklist
1. ✅ Schema changes (columnas, constraints)
2. ✅ Índices para performance
3. ✅ RLS policies
4. ✅ Data migration (si aplica)
5. ✅ Rollback plan documentado

---

### 8. Tablas de Usuarios: `custom_users` vs `profiles` (VT-265)

#### Decisión de Arquitectura

**`custom_users` es la ÚNICA fuente de verdad para usuarios.**

| Tabla | Estado | Propósito Original | Uso Actual |
|-------|--------|-------------------|------------|
| `custom_users` | ✅ **ACTIVA** | Auth custom JWT + bcrypt | Autenticación principal |
| `profiles` | ⚠️ **DEPRECATED** | Supabase Auth (auth.users) | NO USAR |

#### Historia

1. VittaSami inicialmente usaba **Supabase Auth** con la tabla `profiles` vinculada a `auth.users`
2. Se tomó la decisión de migrar a **autenticación custom** con JWT + bcrypt por:
   - Control total sobre lógica de auth
   - Facilidad de migración de usuarios legacy
   - Flexibilidad para features custom (2FA, SSO)
   - Independencia de proveedores
3. Se creó `custom_users` como tabla standalone con `password_hash`
4. `profiles` quedó como legacy pero **no se usa en producción**

#### Diferencias Clave

```sql
-- profiles (DEPRECATED - NO USAR)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id),  -- ⚠️ Vinculada a Supabase Auth
  role user_role,
  tenant_id UUID
);

-- custom_users (ACTIVA - USAR ESTA)
CREATE TABLE custom_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- ✅ Standalone
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,  -- ✅ Bcrypt hash
  role user_role,
  tenant_id UUID,
  schedulable BOOLEAN  -- ✅ Campo adicional
);
```

#### Roles Disponibles

```sql
CREATE TYPE user_role AS ENUM (
  'super_admin',     -- Admin global (sin tenant)
  'admin_tenant',    -- Admin de un tenant
  'staff',           -- Staff general
  'receptionist',    -- Recepcionista
  'doctor',          -- Doctor/profesional médico
  'member',          -- Miembro (spas, wellness)
  'patient'          -- Paciente/cliente
);
```

#### Código Correcto

```typescript
// ✅ CORRECTO - Usar custom_users
const { data: user } = await supabase
  .from('custom_users')
  .select('*')
  .eq('email', email)
  .single()

// ❌ INCORRECTO - NO usar profiles
const { data: user } = await supabase
  .from('profiles')
  .select('*')
  .eq('email', email)
  .single()
```

#### Librerías de Autenticación

- **`src/lib/custom-auth.ts`**: Servicio principal de autenticación (JWT, bcrypt, cookies)
- **`src/lib/auth.ts`**: Cliente browser para obtener usuario actual (usa `custom_users`)

#### Scripts Legacy (NO USAR)

Los siguientes scripts aún referencian `profiles` y **no deben usarse**:
- `scripts/admin/create-admin-development.ts`
- `scripts/admin/create-super-admin.ts`
- `scripts/admin/check-admin-user.ts`
- `scripts/debug/debug-login.ts`

Usar en su lugar los métodos de `customAuth`:
```typescript
import { customAuth } from '@/lib/custom-auth'

// Crear usuario
await customAuth.createUser({ email, password, first_name, last_name, role })

// Crear super admin
await customAuth.createSuperAdmin({ email, password, first_name, last_name })
```

#### TODO Futuro

- [ ] Eliminar tabla `profiles` una vez confirmado que no se usa
- [ ] Actualizar scripts legacy para usar `custom_users`
- [ ] Agregar migración para limpiar referencia a `auth.users`

---

## 🚀 Quick Reference

### Cuándo Usar Cada Herramienta

| Operación | Herramienta | Razón |
|-----------|-------------|-------|
| CRUD simple | Direct DB | Más rápido, menos overhead |
| Workflow complejo | Context7 Flow | Rollback, multi-step |
| RLS bloqueando | Admin Client | Bypass RLS con seguridad |
| Refresh data | Explicit fetch | Más confiable que router.refresh() |
| Validación | Antes de DB | Menos queries, mejor UX |

### Security Checklist
- [ ] Usuario autenticado
- [ ] Usuario pertenece al tenant
- [ ] Usuario tiene rol correcto
- [ ] Resource ownership verificado
- [ ] Inputs validados y sanitizados
- [ ] Dependencies checkeadas (DELETE)
- [ ] Duplicates checkeados (INSERT)

### Performance Checklist
- [ ] Índices en tenant_id
- [ ] Índices en campos de búsqueda
- [ ] Composite indexes (tenant_id + is_active)
- [ ] Queries con .limit() cuando sea posible
- [ ] Parallel fetches con Promise.all()

---

## 📚 Recursos

- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js 15 Data Fetching**: https://nextjs.org/docs/app/building-your-application/data-fetching
- **Multi-tenancy Patterns**: https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/welcome.html

---

*Última actualización: 2025-11-29*
*Incluye decisión VT-265: profiles vs custom_users*
