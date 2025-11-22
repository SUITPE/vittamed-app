# Lineamientos y Consideraciones de Desarrollo - VittaSami

**Versión:** 1.1
**Fecha:** Noviembre 22, 2025
**Proyecto:** VittaSami - Sistema de Gestión para Salud y Bienestar

---

## 📋 Tabla de Contenidos

1. [Información General](#información-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Backend](#backend)
4. [Frontend](#frontend)
5. [Mobile](#mobile)
6. [Workflow de Git](#workflow-de-git)
7. [Testing y QA](#testing-y-qa)
8. [Documentación](#documentación)
9. [Mejores Prácticas](#mejores-prácticas)
10. [Recursos y Herramientas](#recursos-y-herramientas)

---

## 📖 Información General

### Stack Tecnológico

```yaml
Framework: Next.js 15.5.3
Lenguaje: TypeScript (strict mode)
Base de Datos: Supabase (PostgreSQL)
Autenticación: Custom JWT + bcrypt (NO Supabase Auth)
Pagos: Culqi (Perú)
Estilos: Tailwind CSS 3.4.0
Testing: Playwright
Deployment: Vercel
Business Logic: MCP Context7
```

### Ambientes

| Ambiente   | URL                                    | Base de Datos               |
|------------|----------------------------------------|-----------------------------|
| Production | https://vittasami.com                  | emtcplanfbmydqjbcuxm        |
| Staging    | https://vittasami-staging.vercel.app   | mvvxeqhsatkqtsrulcil        |
| Local      | http://localhost:3003                  | Según .env.local            |

### Dominios

- **Marketing:** vittasami.com (landing, pricing, invest)
- **App:** app.vittasami.lat (dashboard, agenda, pacientes)

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas

```
VittaSamiApp/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (marketing)/          # Grupo de rutas públicas
│   │   │   ├── page.tsx          # Landing page
│   │   │   ├── pricing/          # Planes de precio
│   │   │   └── invest/           # Página de inversionistas
│   │   ├── (app)/                # Grupo de rutas autenticadas
│   │   │   ├── dashboard/        # Dashboard principal
│   │   │   ├── agenda/           # Gestión de agenda
│   │   │   ├── patients/         # Gestión de pacientes
│   │   │   └── admin/            # Administración
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Autenticación
│   │   │   ├── tenants/          # Multi-tenant
│   │   │   ├── culqi/            # Pagos
│   │   │   └── features/         # Feature flags
│   │   └── auth/                 # Páginas de auth
│   ├── components/               # Componentes React
│   │   ├── ui/                   # Design system
│   │   ├── marketing/            # Componentes públicos
│   │   ├── admin/                # Componentes admin
│   │   └── medical/              # Componentes médicos
│   ├── lib/                      # Utilidades y configs
│   │   ├── custom-auth.ts        # Sistema de autenticación
│   │   ├── supabase-server.ts    # Cliente Supabase
│   │   ├── culqi.ts              # Integración pagos
│   │   └── config.ts             # Configuración global
│   ├── hooks/                    # React hooks personalizados
│   ├── constants/                # Constantes globales
│   ├── types/                    # TypeScript types
│   └── middleware/               # Next.js middleware
├── supabase/
│   └── migrations/               # Migraciones SQL
├── tests/                        # Tests E2E (Playwright)
├── scripts/                      # Scripts de utilidad
│   ├── admin/                    # Scripts admin
│   ├── database/                 # Scripts DB
│   └── debug/                    # Scripts debug
└── docs/                         # Documentación
    ├── technical/                # Docs técnicas
    ├── features/                 # Docs de features
    └── deployment/               # Docs de deployment
```

### Patrón Multi-Tenant

```typescript
// Todos los usuarios (excepto super_admin) tienen tenant_id
// RLS políticas filtran automáticamente por tenant
// API endpoints validan tenant ownership
```

**Roles:**
- `super_admin`: Acceso global, sin tenant
- `admin_tenant`: Admin de un tenant específico
- `staff`: Personal del tenant
- `receptionist`: Recepcionista
- `doctor`: Médico
- `patient`: Paciente

---

## 🔧 Backend

### Tecnologías Core

- **Runtime:** Node.js 20+
- **Framework:** Next.js 15 App Router
- **Database:** Supabase (PostgreSQL 15)
- **ORM:** Supabase Client (sin Prisma)
- **Auth:** Custom JWT + bcrypt
- **Business Logic:** MCP Context7

### Autenticación Custom

**⚠️ IMPORTANTE:** NO usar Supabase Auth. Sistema custom con `custom_users` table.

```typescript
// ✅ CORRECTO
import { customAuth } from '@/lib/custom-auth'

const user = await customAuth.getCurrentUser()
const isValid = await customAuth.authenticateUser(email, password)

// ❌ INCORRECTO
import { createClient } from '@supabase/supabase-js'
const { data: { user } } = await supabase.auth.getUser()
```

**Flujo de autenticación:**

1. Usuario envía email/password a `/api/auth/login`
2. Verificar contra `custom_users.password_hash` (bcrypt)
3. Generar JWT con `userId`, `email`, `role`, `tenantId`
4. Guardar en cookie `vittasami-auth-token` (httpOnly, secure)
5. Frontend lee JWT para determinar permisos

**Archivo clave:** `src/lib/custom-auth.ts`

### API Routes

**Convenciones:**

```typescript
// Estructura estándar
export async function GET(request: NextRequest) {
  // 1. Autenticación
  const user = await customAuth.getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Verificar tenant ownership (si aplica)
  const { tenantId } = params
  if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Lógica de negocio
  const supabase = createAdminClient() // Bypass RLS para operations
  const { data, error } = await supabase.from('table').select()

  // 4. Respuesta
  return NextResponse.json({ data }, { status: 200 })
}
```

**Clientes Supabase:**

```typescript
// Para SELECT (usa RLS)
import { createClient } from '@/lib/supabase-server'
const supabase = createClient()

// Para INSERT/UPDATE/DELETE (bypass RLS)
import { createAdminClient } from '@/lib/supabase-server'
const supabase = createAdminClient()
```

### Base de Datos

**Tablas principales:**

```sql
-- Usuarios
custom_users (
  id uuid PRIMARY KEY,
  email text UNIQUE,
  password_hash text,
  first_name text,
  last_name text,
  role user_role,
  tenant_id uuid REFERENCES tenants(id),
  schedulable boolean DEFAULT false
)

-- Tenants
tenants (
  id uuid PRIMARY KEY,
  name text,
  business_type text,
  subscription_plan text,
  subscription_status text
)

-- Citas
appointments (
  id uuid PRIMARY KEY,
  tenant_id uuid,
  patient_id uuid,
  doctor_id uuid,
  service_id uuid,
  appointment_date timestamptz,
  status appointment_status
)

-- Más tablas: patients, services, member_availability, etc.
```

**RLS Policies:**

```sql
-- SIEMPRE filtrar por tenant_id
CREATE POLICY "Users can view own tenant data"
ON custom_users FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM custom_users WHERE tenant_id = custom_users.tenant_id
));
```

**Migraciones:**

```bash
# Ubicación: supabase/migrations/
# Nombrado: NNN_descriptive_name.sql

# Crear migración idempotente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='custom_users' AND column_name='schedulable') THEN
    ALTER TABLE custom_users ADD COLUMN schedulable boolean DEFAULT false;
  END IF;
END $$;
```

### MCP Context7

**⚠️ USO OBLIGATORIO:** Para lógica de negocio compleja.

```typescript
// Flujos complejos: reserva de citas, pagos, notificaciones
// Context7 maneja: transacciones, rollbacks, validaciones, eventos

// Ejemplo: Crear cita con pago
import { executeFlow } from '@/lib/context7'

const result = await executeFlow('create-appointment-with-payment', {
  appointmentData: {...},
  paymentData: {...},
  notificationData: {...}
})

// Context7 garantiza:
// - Si pago falla → rollback de cita
// - Si notificación falla → log pero no rollback
// - Validaciones en cada paso
```

**Ubicación:** `src/flows/`

**NO usar Context7 para:**
- CRUD simple (un solo INSERT/UPDATE)
- Consultas de lectura
- Operaciones atómicas

**SÍ usar Context7 para:**
- Múltiples operaciones relacionadas
- Transacciones con rollback
- Integraciones externas (pagos, SMS)
- Lógica de negocio compleja

### Integraciones

**Culqi (Pagos):**

```typescript
import { createCulqiCharge } from '@/lib/culqi'

const charge = await createCulqiCharge({
  amount: 5000, // En centavos
  email: user.email,
  source_id: tokenId
})
```

**Twilio (WhatsApp - opcional):**

```typescript
import { sendWhatsAppMessage } from '@/lib/notifications'

await sendWhatsAppMessage({
  to: '+51999999999',
  message: 'Tu cita ha sido confirmada'
})
```

---

## 🎨 Frontend

### Tecnologías Core

- **Framework:** Next.js 15 (App Router)
- **React:** 18+ (Server Components + Client Components)
- **Estilos:** Tailwind CSS 3.4.0
- **UI:** Componentes custom (no Shadcn/UI)
- **Animaciones:** Framer Motion
- **Forms:** React Hook Form (recomendado)
- **State:** React Context + useState

### React Server Components (RSC)

**⚠️ IMPORTANTE:** Next.js 15 usa RSC por defecto.

```tsx
// ✅ Server Component (default)
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await customAuth.getCurrentUser() // ✅ Puede usar await
  const data = await fetch('/api/data', { cache: 'no-store' })

  return <DashboardClient data={data} />
}

// ✅ Client Component (necesita interactividad)
// src/components/DashboardClient.tsx
'use client'

import { useState } from 'react'

export default function DashboardClient({ data }) {
  const [state, setState] = useState(data)

  return <div onClick={() => setState(...)}>...</div>
}
```

**Reglas:**
- Server Components NO pueden usar `useState`, `useEffect`, event handlers
- Client Components necesitan `'use client'` en la primera línea
- **Server Components deben consultar DB directamente (NO hacer fetch a APIs internas)**
- Client Components hacen fetch a API routes

### Data Fetching Patterns ⚡

**⚠️ CRÍTICO:** Esta es una de las reglas MÁS IMPORTANTES del proyecto.

#### ❌ ANTI-PATTERN: Server Component haciendo fetch a API interna

```tsx
// ❌ MAL - Server Component haciendo fetch a su propia API
// src/app/patients/page.tsx
export default async function PatientsPage() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/patients`,
    { cache: 'no-store' }
  )
  const patients = await response.json()

  return <PatientsList patients={patients} />
}
```

**Problemas:**
- ❌ Round-trip HTTP innecesario (Server → HTTP → API Route → Supabase)
- ❌ Depende de `NEXT_PUBLIC_BASE_URL` (puede no estar configurado en Vercel)
- ❌ Más lento (~50-100ms de latencia adicional)
- ❌ Más puntos de falla (URL, headers, cookies)
- ❌ Falla silenciosamente si URL está mal configurada

#### ✅ BEST PRACTICE: Consulta directa a Supabase

```tsx
// ✅ BIEN - Server Component consultando DB directamente
// src/app/patients/page.tsx
import { createClient } from '@/lib/supabase-server'

export default async function PatientsPage() {
  const user = await customAuth.getCurrentUser()
  const supabase = await createClient()

  const { data: patients, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', user.profile?.tenant_id)

  return <PatientsList patients={patients || []} />
}
```

**Ventajas:**
- ✅ Directo (Server Component → Supabase)
- ✅ No depende de configuración de URL
- ✅ Más rápido (1 salto en vez de 3)
- ✅ Más robusto (menos moving parts)
- ✅ Errores más claros

#### 📊 Matriz de Decisión: ¿Cuándo usar qué?

| Caso | Solución | Razón |
|------|----------|-------|
| Server Component necesita datos | ✅ Query directo a Supabase | Más rápido, sin HTTP overhead |
| Client Component necesita datos | ✅ fetch() a API Route | Navegador no tiene acceso a DB |
| Webhook externo (Culqi, Stripe) | ✅ API Route | Terceros llaman desde internet |
| Mutación desde cliente (POST/PUT/DELETE) | ✅ API Route | Validación centralizada |
| Lógica de negocio compleja con transacciones | ✅ API Route + Context7 | Rollbacks, múltiples operaciones |
| Simple SELECT en Server Component | ✅ Query directo | Sin complejidad adicional |

#### 🔧 Cuándo SÍ usar API Routes

API Routes son para:

1. **Client Components que necesitan datos**
   ```tsx
   'use client'
   // Cliente no tiene acceso directo a DB
   const response = await fetch('/api/patients')
   ```

2. **Webhooks externos**
   ```tsx
   // Culqi, Stripe, Twilio llaman desde internet
   export async function POST(request) { ... }
   ```

3. **Mutaciones con validación compleja**
   ```tsx
   // Lógica de negocio centralizada
   export async function POST(request) {
     // Validar datos
     // Ejecutar Context7 flow
     // Retornar resultado
   }
   ```

4. **APIs públicas para terceros**
   ```tsx
   // Si exponemos API para partners
   export async function GET(request) { ... }
   ```

#### 🚫 Cuándo NO usar API Routes

NO uses API Routes para:

1. **Server Components obteniendo datos simples**
   ```tsx
   // ❌ NO hacer esto:
   const data = await fetch('/api/data')

   // ✅ Hacer esto:
   const { data } = await supabase.from('table').select()
   ```

2. **Server-to-server dentro de tu app**
   ```tsx
   // ❌ NO hacer esto:
   const response = await fetch('http://localhost:3000/api/internal')

   // ✅ Hacer esto:
   import { getInternalData } from '@/lib/data'
   const data = await getInternalData()
   ```

#### 📝 Archivos que NECESITAN refactorización

**⚠️ DEUDA TÉCNICA IDENTIFICADA:**

Los siguientes archivos usan el anti-pattern y deben ser refactorizados:

1. **src/app/patients/page.tsx** (líneas 65-96)
   - `fetch('/api/tenants')` → Consulta directa a `tenants`
   - `fetch('/api/patients')` → Consulta directa a `patients`

2. **src/app/admin/services/page.tsx** (líneas 106-135)
   - `fetch('/api/tenants/{id}/services')` → Consulta a `services`
   - `fetch('/api/tenants/{id}/categories')` → Consulta a `service_categories`

3. **src/app/admin/settings/page.tsx** (líneas 76-84)
   - `fetch('/api/tenants')` → Consulta directa a `tenants`

4. **src/app/dashboard/[tenantId]/page.tsx** (líneas 65-131)
   - `fetch('/api/tenants')` → Consulta directa a `tenants`
   - `fetch('/api/dashboard/{id}/appointments')` → Consulta a `appointments`
   - `fetch('/api/dashboard/{id}/stats')` → MANTENER (lógica de agregación)

5. **src/app/my-appointments/page.tsx** (líneas 34-42)
   - `fetch('/api/appointments/my-appointments')` → Consulta a `appointments`

6. **src/app/appointments/page.tsx** (líneas 82-106)
   - `fetch('/api/tenants/{id}/doctors')` → Consulta a `custom_users`
   - `fetch('/api/tenants/{id}/appointments')` → Consulta a `appointments`

**Nota:** Estos deben ser refactorizados en sprints futuros siguiendo el patrón de `manage-users/page.tsx`.

#### 📚 Referencias

- [Next.js Docs: Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns)
- [Next.js: Server Components can fetch data directly](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#fetching-data-on-the-server)
- Sesión de debugging: `docs/SESSION-DEBUG-MANAGE-USERS.md`

### Estilos y Design System

**Tailwind CSS:**

```tsx
// ✅ Usar clases de Tailwind
<div className="bg-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow">

// ❌ NO usar inline styles
<div style={{ backgroundColor: 'white', padding: '24px' }}>
```

**Paleta de colores VittaSami:**

```css
/* Brand */
--primary: #40C9C6;      /* Turquesa principal */
--accent: #A6E3A1;       /* Verde suave */
--dark: #003A47;         /* Azul oscuro */

/* Uso en Tailwind */
bg-[#40C9C6]
text-[#003A47]
border-[#A6E3A1]
```

**Componentes UI base:**

```tsx
// src/components/ui/
- Heading.tsx          // Títulos con gradientes
- Section.tsx          // Contenedores con spacing
- GradientText.tsx     // Texto con gradiente brand
- Button.tsx           // Botones con variantes
- Card.tsx             // Cards con hover effects
```

### Navegación y Rutas

**Route Groups:**

```
(marketing)/    → Header público + Footer
(app)/          → AdminSidebar + AdminHeader
```

**Middleware routing:**

```typescript
// src/middleware.ts
// Redirige subdominios a carpetas correctas
// app.vittasami.lat → (app)/
// vittasami.com → (marketing)/
```

**Links:**

```tsx
import Link from 'next/link'

// ✅ Usar Link de Next.js
<Link href="/dashboard">Dashboard</Link>

// ❌ NO usar <a> para navegación interna
<a href="/dashboard">Dashboard</a>
```

### Manejo de Estado

**Local state:**

```tsx
'use client'
import { useState } from 'react'

const [users, setUsers] = useState<User[]>([])
```

**Context (autenticación):**

```tsx
import { useAuth } from '@/contexts/AuthContext'

const { user, login, logout } = useAuth()
```

**Server state (recomendado SWR o React Query):**

```tsx
// Actualmente no implementado, usar fetch directo
const response = await fetch('/api/users')
```

### Forms

**Recomendación:** React Hook Form

```tsx
'use client'
import { useForm } from 'react-hook-form'

const { register, handleSubmit, formState: { errors } } = useForm()

<input {...register('email', { required: true })} />
{errors.email && <span>Campo requerido</span>}
```

### Optimizaciones

**Images:**

```tsx
import Image from 'next/image'

<Image
  src="/vittasami/logo.svg"
  alt="VittaSami"
  width={200}
  height={50}
  priority // Para hero images
/>
```

**Fonts:**

```tsx
import { Inter, Poppins } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
const poppins = Poppins({ weight: ['400', '600', '700'], subsets: ['latin'] })
```

---

## 📱 Mobile

**Estado actual:** ❌ NO hay aplicación móvil nativa.

**Aplicación web responsiva:** ✅ SÍ

```css
/* Breakpoints Tailwind */
sm:  640px   /* Mobile landscape */
md:  768px   /* Tablet */
lg:  1024px  /* Desktop */
xl:  1280px  /* Large desktop */
```

**Si se desarrolla mobile en el futuro:**

Opciones recomendadas:
1. **React Native** con Expo
2. **PWA** (Progressive Web App)
3. **Capacitor** (web to native)

**Consideraciones:**
- Reutilizar API routes existentes
- Implementar auth con JWT (ya compatible)
- Adaptar UI para touch gestures

---

## 🔀 Workflow de Git

### Branching Strategy

**⚠️ OBLIGATORIO:** Una rama por tarea.

```bash
# Ramas principales
main          # Producción (NUNCA commit directo)
staging       # Ambiente de pruebas

# Ramas de trabajo (por desarrollador/tarea)
feature/VT-123-nombre-descriptivo
bugfix/VT-456-descripcion-bug
hotfix/descripcion-urgente
```

### Nomenclatura de Ramas

```bash
# Formato: tipo/numero-ticket-descripcion-corta

# Ejemplos:
feature/VT-45-payment-integration
bugfix/VT-78-fix-login-redirect
hotfix/critical-rls-policy
refactor/VT-90-simplify-auth

# Tipos permitidos:
feature/   # Nueva funcionalidad
bugfix/    # Corrección de bug
hotfix/    # Corrección urgente
refactor/  # Refactorización
docs/      # Documentación
test/      # Tests
```

### Flujo de Trabajo

```bash
# 1. Crear rama desde staging
git checkout staging
git pull origin staging
git checkout -b feature/VT-123-add-culqi-webhook

# 2. Trabajar en la tarea
git add .
git commit -m "feat(payments): implement Culqi webhook handler

- Add POST endpoint for Culqi webhooks
- Validate webhook signature
- Update appointment status on payment confirmation
- Add error handling and logging

Refs: VT-123"

# 3. Push a remoto
git push origin feature/VT-123-add-culqi-webhook

# 4. Crear Pull Request
# Desde GitHub: feature/VT-123 → staging

# 5. Code Review
# Esperar aprobación de al menos 1 reviewer

# 6. Merge a staging
# Después de aprobación, hacer merge (fast-forward preferido)

# 7. Deploy a staging
# Vercel auto-deploys staging

# 8. Testing en staging
# QA valida funcionalidad

# 9. Merge staging → main
# Solo después de QA approval
git checkout main
git pull origin main
git merge staging --ff-only
git push origin main

# 10. Deploy a producción
# Vercel auto-deploys main
```

### Commits Convencionales

```bash
# Formato: tipo(scope): descripción

# Tipos:
feat:      # Nueva feature
fix:       # Bug fix
docs:      # Documentación
style:     # Formateo, punto y coma, etc.
refactor:  # Refactorización
test:      # Tests
chore:     # Mantenimiento

# Ejemplos:
feat(auth): add password reset functionality
fix(api): handle null tenant_id in users endpoint
docs(readme): update installation instructions
refactor(components): extract UserCard component
test(appointments): add E2E tests for booking flow
```

### Pull Request Template

```markdown
## Descripción
[Descripción clara de los cambios]

## Ticket
VT-123

## Tipo de cambio
- [ ] Feature nueva
- [ ] Bug fix
- [ ] Refactorización
- [ ] Documentación

## Checklist
- [ ] Código sigue los lineamientos del proyecto
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] No hay warnings en consola
- [ ] Probado en local
- [ ] Probado en staging

## Screenshots (si aplica)
[Agregar capturas de pantalla]

## Notas adicionales
[Cualquier información relevante]
```

---

## 🧪 Testing y QA

### Estrategia de Testing

```
Tests E2E (Playwright)    → 80% cobertura objetivo
Tests de Integración      → API routes
Tests Unitarios           → Utilidades y helpers
```

### Playwright E2E

**Ubicación:** `tests/`

```typescript
// tests/authentication.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
  })
})
```

**Ejecutar tests:**

```bash
# Todos los tests
npm test

# Test específico
npx playwright test tests/authentication.spec.ts

# Con UI
npx playwright test --ui

# Debug mode
npx playwright test --debug

# Ver reporte
npx playwright show-report
```

### Tests de API

```bash
# Usar curl o Postman para validar endpoints

# Ejemplo: Listar usuarios
curl -X GET https://vittasami-staging.vercel.app/api/tenants/TENANT_ID/users \
  -H "Cookie: vittasami-auth-token=TOKEN"
```

### Checklist de QA

**Para cada feature:**

- [ ] Funciona en Chrome, Firefox, Safari
- [ ] Responsive (mobile, tablet, desktop)
- [ ] Sin errores en consola
- [ ] Sin warnings de React
- [ ] Performance aceptable (< 3s carga inicial)
- [ ] Accesibilidad básica (keyboard navigation)
- [ ] Validación de formularios
- [ ] Mensajes de error claros
- [ ] Loading states implementados
- [ ] Manejo de errores de red

**Antes de merge a main:**

- [ ] Todos los tests pasan
- [ ] Code review aprobado
- [ ] Probado en staging
- [ ] No hay regresiones
- [ ] Documentación actualizada

---

## 📝 Documentación

### Documentación Personal Obligatoria

**⚠️ OBLIGATORIO:** Cada desarrollador debe mantener su propio MD.

**Ubicación:** `docs/developers/NOMBRE-DESARROLLADOR.md`

**Formato:**

```markdown
# Progreso de [NOMBRE DESARROLLADOR]

## Sprint Actual: [Fecha inicio - Fecha fin]

### Tareas Asignadas

#### VT-123: Implementar webhook de Culqi
**Status:** 🟢 Completado | 🟡 En progreso | 🔴 Bloqueado

**Rama:** `feature/VT-123-culqi-webhook`

**Fecha inicio:** 2025-11-20
**Fecha fin estimada:** 2025-11-22
**Fecha fin real:** 2025-11-21

**Descripción:**
Implementar endpoint para recibir webhooks de Culqi cuando se complete un pago.

**Cambios realizados:**
- ✅ Creado POST /api/culqi/webhook
- ✅ Validación de firma Culqi
- ✅ Actualización de estado de appointment
- ✅ Tests E2E agregados
- ✅ Documentación actualizada

**Problemas encontrados:**
1. Firma de Culqi requería HMAC-SHA256, no SHA256 simple
2. RLS policy bloqueaba update desde webhook (resuelto con admin client)

**Aprendizajes:**
- Webhooks deben usar createAdminClient() para bypass RLS
- Validar firma ANTES de procesar payload
- Idempotencia importante (mismo webhook puede llegar 2 veces)

**Archivos modificados:**
- src/app/api/culqi/webhook/route.ts (nuevo)
- src/lib/culqi.ts (agregada función validateWebhookSignature)
- tests/culqi-webhook.spec.ts (nuevo)
- docs/technical/CULQI-INTEGRATION.md (actualizado)

**PR:** #456 (merged)

---

#### VT-124: Bug en listado de usuarios
**Status:** 🟢 Completado

**Rama:** `bugfix/VT-124-empty-users-list`

... (mismo formato)

---

## Sprint Anterior: [Fecha]

... (historial de sprints anteriores)

---

## Notas / Dudas

- ¿Deberíamos mover lógica de validación de Culqi a Context7?
- Ver con equipo: ¿implementar rate limiting en webhooks?
```

### Documentación Técnica

**Ubicaciones:**

```
docs/
├── technical/               # Docs técnicas
│   ├── API-ENDPOINTS.md     # Listado de endpoints
│   ├── DATABASE-SCHEMA.md   # Esquema de DB
│   ├── AUTHENTICATION.md    # Cómo funciona auth
│   └── BEST-PRACTICES.md    # Mejores prácticas
├── features/                # Docs de features
│   ├── MULTI-TENANT.md      # Sistema multi-tenant
│   ├── PAYMENTS.md          # Integración de pagos
│   └── NOTIFICATIONS.md     # Sistema de notificaciones
└── developers/              # Docs personales
    ├── JUAN-PEREZ.md
    ├── MARIA-GARCIA.md
    └── ...
```

### README.md

Mantener actualizado con:
- Instrucciones de instalación
- Variables de entorno necesarias
- Comandos principales
- Links a docs importantes

---

## ✅ Mejores Prácticas

### General

1. **TypeScript estricto:** SIEMPRE tipar correctamente
   ```typescript
   // ✅ CORRECTO
   interface User {
     id: string
     email: string
     role: UserRole
   }

   // ❌ INCORRECTO
   const user: any = {...}
   ```

2. **Error handling:** Siempre manejar errores
   ```typescript
   try {
     const data = await fetchData()
   } catch (error) {
     console.error('Error:', error)
     // Mostrar mensaje al usuario
   }
   ```

3. **Logging:** Usar console.log para debug, remover en producción
   ```typescript
   // Desarrollo
   console.log('[API] Fetching users:', { tenantId, role })

   // Producción: usar servicio de logging (TODO)
   ```

4. **Seguridad:**
   - NUNCA commitear secrets (.env en .gitignore)
   - Validar SIEMPRE inputs de usuario
   - Escapar HTML user-generated content
   - Usar HTTPS en producción

### Backend

1. **Auth primero:**
   ```typescript
   // SIEMPRE verificar auth al inicio
   const user = await customAuth.getCurrentUser()
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```

2. **Tenant isolation:**
   ```typescript
   // Verificar tenant ownership
   if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
     return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
   }
   ```

3. **Admin client para mutations:**
   ```typescript
   // Para INSERT/UPDATE/DELETE
   const supabase = createAdminClient()
   ```

4. **Migraciones idempotentes:**
   ```sql
   -- Usar IF NOT EXISTS
   DO $$
   BEGIN
     IF NOT EXISTS (...) THEN
       ALTER TABLE ...
     END IF;
   END $$;
   ```

### Frontend

1. **Server Components por defecto:**
   ```tsx
   // Solo usar 'use client' cuando necesites interactividad
   ```

2. **⚡ NUNCA hacer fetch a APIs internas desde Server Components:**
   ```tsx
   // ❌ INCORRECTO
   export default async function Page() {
     const data = await fetch('/api/data', { cache: 'no-store' })
     return <ClientComponent data={data} />
   }

   // ✅ CORRECTO - Consulta directa a Supabase
   import { createClient } from '@/lib/supabase-server'
   export default async function Page() {
     const supabase = await createClient()
     const { data } = await supabase.from('table').select()
     return <ClientComponent data={data} />
   }
   ```

3. **Tailwind sobre CSS custom:**
   ```tsx
   // ✅ Usar Tailwind
   <div className="flex items-center gap-4 p-6">

   // ❌ Evitar CSS modules/inline styles
   ```

4. **Optimizar imágenes:**
   ```tsx
   // Usar Next.js Image component
   <Image src="..." alt="..." width={...} height={...} />
   ```

5. **Ver sección completa:** [Data Fetching Patterns](#data-fetching-patterns-) para más detalles

### Git

1. **Commits descriptivos:**
   ```bash
   # ✅ CORRECTO
   feat(auth): add password reset with email verification

   # ❌ INCORRECTO
   update files
   ```

2. **Pull frecuente:**
   ```bash
   # Al menos 1 vez al día
   git pull origin staging
   ```

3. **Resolver conflictos localmente:**
   ```bash
   # Antes de push
   git pull --rebase origin staging
   ```

### Testing

1. **Tests al desarrollar, no después:**
   - Escribir test → Implementar feature → Validar test pasa

2. **Nombres descriptivos:**
   ```typescript
   test('should redirect to dashboard after successful login', ...)
   ```

3. **Evitar datos hardcodeados:**
   ```typescript
   // ✅ Usar variables
   const testEmail = 'test@example.com'

   // ❌ Hardcodear
   await page.fill('[name="email"]', 'test@example.com')
   ```

---

## 🛠️ Recursos y Herramientas

### IDEs Recomendados

- **VS Code** (configurado en .vscode/)
  - Extensiones: ESLint, Prettier, Tailwind IntelliSense
- **WebStorm** (alternativa)

### Herramientas de Desarrollo

```bash
# Package manager
npm (incluido con Node.js)

# TypeScript compiler
npx tsc --noEmit    # Verificar tipos

# Linter
npm run lint

# Formateo (si se configura Prettier)
npm run format
```

### Acceso a Servicios

**Vercel:**
- Org: vittameds-projects
- Acceso: Solicitar a admin

**Supabase:**
- Staging: https://supabase.com/dashboard/project/mvvxeqhsatkqtsrulcil
- Prod: https://supabase.com/dashboard/project/emtcplanfbmydqjbcuxm

**GitHub:**
- Repo: [URL del repo]
- Solicitar acceso a admin

### Credenciales de Prueba

**Staging:**

```
Super Admin:
  Email: admin@vittasami.com
  Password: [solicitar a admin]

Admin Tenant:
  Email: guscass@gmail.com
  Password: wasaberto
  Tenant: Dr. Gus

Doctor:
  Email: ana.rodriguez@email.com
  Password: VittaSami2024!

Patient:
  Email: patient@example.com
  Password: password
```

### Documentos Importantes

1. **BEST-PRACTICES.md** - Lecciones aprendidas del proyecto
2. **API-ENDPOINTS.md** - Documentación de API (TODO)
3. **DATABASE-SCHEMA.md** - Esquema de DB (TODO)
4. **FEATURE-FLAGS.md** - Sistema de feature flags

### Contactos

```
Tech Lead: [Nombre]
Backend Lead: [Nombre]
Frontend Lead: [Nombre]
QA Lead: [Nombre]
Product Owner: [Nombre]
```

---

## 📞 Soporte

### Dudas Técnicas

1. Revisar documentación en `/docs`
2. Buscar en issues cerrados de GitHub
3. Preguntar en canal de Slack #dev-help
4. Crear issue en GitHub con label "question"

### Reportar Bugs

1. Crear issue en GitHub con template de bug
2. Incluir: pasos para reproducir, expected vs actual, screenshots
3. Asignar prioridad: critical, high, medium, low

### Proponer Mejoras

1. Crear issue con label "enhancement"
2. Explicar problema actual y solución propuesta
3. Discutir con equipo antes de implementar

---

**Última actualización:** Noviembre 22, 2025
**Mantenido por:** Tech Team VittaSami
**Versión documento:** 1.1

## 📝 Changelog

### v1.1 - Noviembre 22, 2025
- ➕ Agregada sección crítica: **Data Fetching Patterns**
- 🔍 Identificados 6 archivos con anti-pattern (Server Component → fetch API interna)
- ✅ Documentado best practice: Consulta directa a Supabase desde Server Components
- 📊 Agregada matriz de decisión: ¿Cuándo usar API Routes vs Supabase directo?
- 📝 Listada deuda técnica a refactorizar

### v1.0 - Noviembre 2025
- 📄 Versión inicial del documento
- 📚 Documentación completa de arquitectura, backend, frontend
- ✅ Lineamientos de Git, testing, y mejores prácticas
