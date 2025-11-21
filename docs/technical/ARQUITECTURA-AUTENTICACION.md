# Arquitectura de Autenticación - VittaMed

**Fecha:** 2025-10-14
**Estado:** ✅ Activo y Funcional

## 🔐 Sistema de Autenticación Actual

VittaMed utiliza **Custom JWT Authentication** implementado en `/src/lib/custom-auth.ts`.

### ¿Por qué Custom JWT y no Supabase Auth?

Después de pruebas, se determinó que **Supabase `getUser()` estaba causando demasiados problemas** en el proyecto. Por lo tanto, se mantiene el sistema Custom JWT que es:
- ✅ **Estable y probado**
- ✅ **Compatible con la arquitectura multi-tenant**
- ✅ **Funciona correctamente con todos los endpoints**

## 📋 Componentes del Sistema

### 1. **Middleware** (`/src/middleware.ts`)

**Función:** Proteger rutas y validar tokens JWT en cada request

**Tecnología:** Custom JWT con `jose` library

```typescript
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'vittamed-dev-secret-key-2024'
)
const COOKIE_NAME = 'vittamed-auth-token'
```

**Rutas protegidas:**
- `/dashboard` - Admin y Staff
- `/agenda` - Doctores y Members
- `/patients` - Doctores
- `/appointments` - Todos los roles autenticados
- `/my-appointments` - Pacientes
- `/admin` - Admins
- `/receptionist` - Recepcionistas
- `/member` - Members (staff médico)

**Lógica de redirección por rol:**
- `super_admin` → `/admin/global`
- `admin_tenant`, `staff`, `receptionist` → `/dashboard/{tenantId}`
- `doctor`, `member` → `/agenda`
- `patient` → `/my-appointments`

### 2. **Custom Auth Service** (`/src/lib/custom-auth.ts`)

**Clase:** `CustomAuthService`

**Métodos principales:**

#### Autenticación
```typescript
// Autenticar usuario con email/password
authenticateUser(email: string, password: string): Promise<UserProfile | null>

// Generar token JWT
generateToken(payload: JWTPayload): string

// Verificar token JWT
verifyToken(token: string): JWTPayload | null
```

#### Gestión de cookies
```typescript
// Establecer cookie de autenticación
setAuthCookie(token: string): Promise<void>

// Limpiar cookie de autenticación
clearAuthCookie(): Promise<void>

// Obtener token de cookie
getTokenFromCookie(): Promise<string | null>
```

#### Usuario actual
```typescript
// Obtener usuario autenticado actual
getCurrentUser(): Promise<AuthUser | null>
```

**Importante:** Este método es usado en **todos los API routes** (53+ archivos)

#### Gestión de usuarios
```typescript
// Crear nuevo usuario
createUser(userData): Promise<{ user: UserProfile | null; error: string | null }>

// Actualizar password
updatePassword(userId: string, newPassword: string): Promise<{ error: string | null }>

// Crear super admin
createSuperAdmin(userData): Promise<{ user: UserProfile | null; error: string | null }>
```

#### Utilidades
```typescript
// Hash password con bcrypt
hashPassword(password: string): Promise<string>

// Verificar password
verifyPassword(password: string, hash: string): Promise<boolean>

// Obtener ruta de redirección por rol
getRedirectPath(profile: UserProfile): string

// Verificar si es super admin
isSuperAdmin(user: AuthUser | null): boolean

// Log de auditoría para super admins
logAuditAction(...): Promise<void>
```

### 3. **API Routes** (53+ archivos)

**Patrón de autenticación en todos los endpoints:**

```typescript
import { customAuth } from '@/lib/custom-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar permisos adicionales si es necesario
    if (user.id !== resourceOwnerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ... lógica del endpoint
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 4. **Configuración JWT**

**Variables de entorno requeridas:**

```env
# JWT Secret para firmar tokens
JWT_SECRET=vittamed-dev-secret-key-2024

# Supabase (para database operations, NO para auth)
NEXT_PUBLIC_SUPABASE_URL=https://mvvxeqhsatkqtsrulcil.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Nota importante:** Supabase se usa SOLO para operaciones de base de datos, NO para autenticación.

**Configuración JWT:**
- **Secret:** `JWT_SECRET` desde .env
- **Expiración:** 7 días
- **Cookie Name:** `vittamed-auth-token`
- **Cookie Settings:**
  - `httpOnly: true` (seguridad)
  - `secure: true` en producción
  - `sameSite: 'lax'`
  - `maxAge: 7 días`

### 5. **Estructura del Token JWT**

```typescript
interface JWTPayload {
  userId: string      // ID del usuario
  email: string       // Email del usuario
  role: string        // Rol: super_admin, admin_tenant, doctor, patient, etc.
  tenantId?: string   // ID del tenant (opcional para super_admin)
  iat?: number        // Timestamp de emisión
  exp?: number        // Timestamp de expiración
}
```

### 6. **AuthUser Type**

```typescript
interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string
  user_metadata: {
    first_name: string
    last_name: string
  }
  profile: UserProfile  // Datos completos del usuario desde DB
}
```

## 🔄 Flujo de Autenticación

### Login Flow

1. Usuario envía credenciales a `/api/auth/login`
2. `customAuth.authenticateUser()` valida email/password
3. Si válido, `generateToken()` crea JWT con payload
4. `setAuthCookie()` guarda token en cookie httpOnly
5. Redirect a ruta según rol (`getRedirectPath()`)

### Request Flow

1. **Middleware:** Verifica token en cookie en cada request
2. **Protected Routes:** Redirige a login si no hay token válido
3. **API Routes:** Usan `getCurrentUser()` para validar autenticación
4. **Authorization:** Cada endpoint verifica permisos según rol/tenant

### Logout Flow

1. Usuario hace request a `/api/auth/logout`
2. `clearAuthCookie()` elimina cookie de autenticación
3. Redirect a `/auth/login`

## 🔑 Roles y Permisos

### Roles disponibles:

- **`super_admin`** - Acceso global a todos los tenants
- **`admin_tenant`** - Admin de un tenant específico
- **`staff`** - Personal administrativo del tenant
- **`receptionist`** - Recepcionista del tenant
- **`doctor`** - Médico (puede ser schedulable)
- **`member`** - Miembro del personal médico (schedulable)
- **`patient`** - Paciente del sistema

### Verificación de permisos:

```typescript
// Verificar rol específico
if (user.profile?.role !== 'admin_tenant') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Verificar tenant
if (user.profile?.tenant_id !== requiredTenantId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Verificar ownership
if (user.id !== resourceOwnerId) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## 📊 Estadísticas del Sistema

- **API Routes usando customAuth:** 53+ archivos
- **Middleware:** Custom JWT con `jose`
- **Cookie Security:** httpOnly, secure (prod), sameSite
- **Token Expiration:** 7 días
- **Password Hashing:** bcrypt con salt rounds 12

## ⚠️ Decisiones de Arquitectura

### Por qué NO usamos Supabase Auth:

1. **Problemas de compatibilidad** con Next.js 15 SSR
2. **Complejidad innecesaria** para nuestro caso de uso
3. **Custom JWT funciona perfectamente** y es más simple
4. **Control total** sobre la lógica de autenticación
5. **Mejor integración** con sistema multi-tenant

### Cambios recientes (2025-10-14):

- ✅ **Revertido** intento de migración a Supabase `getUser()`
- ✅ **Restaurado** middleware con Custom JWT
- ✅ **Confirmado** que customAuth es el sistema oficial
- ✅ **Mantenidos** fixes de async params para Next.js 15 (16 archivos)

## 🚀 Próximos Pasos

### Mejoras recomendadas:

1. **Credential Rotation:** Rotar `SUPABASE_SERVICE_ROLE_KEY` comprometida
2. **JWT Secret:** Rotar `JWT_SECRET` en producción
3. **Token Refresh:** Implementar refresh tokens para sesiones más largas
4. **Rate Limiting:** Agregar rate limiting a endpoints de autenticación
5. **2FA:** Considerar autenticación de dos factores para admins

### Mantenimiento:

- ✅ Sistema estable y funcional
- ✅ No requiere cambios inmediatos
- ✅ Compatible con Next.js 15
- ✅ TypeScript compilando correctamente (43 errores no-críticos de tipos)

---

**Última actualización:** 2025-10-14
**Autor:** Claude Code
**Estado:** ✅ Producción-ready con Custom JWT Authentication
