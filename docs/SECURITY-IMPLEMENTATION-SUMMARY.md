# Sistema de Seguridad - Resumen de Implementación

## Estado Actual: 50% Completado ✅

### ✅ COMPLETADO

1. **Migración SQL** - Ejecutada en Supabase
   - Columnas: `email_verified`, `must_change_password`
   - Tabla: `email_verification_tokens`
   - Índices y RLS configurados

2. **Librería de Tokens** (`src/lib/verification-tokens.ts`)
   - Generación segura de tokens
   - Verificación y consumo de tokens
   - Activación de cuentas
   - Configuración vía `EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS` (default: 1 hora)

3. **Templates de Email Actualizados** (`src/lib/email.ts`)
   - Soporte para activación con token
   - Soporte legacy con contraseña temporal
   - Versiones HTML y texto plano

### 🚧 PENDIENTE DE IMPLEMENTAR

#### 1. Actualizar API de Creación de Usuarios
**Archivo:** `src/app/api/tenants/[tenantId]/users/route.ts`

```typescript
// Cambios necesarios en la función POST (línea ~210):

// Crear usuario con email_verified=false y must_change_password=true
const { data: newUser, error: createError } = await adminClient
  .from('custom_users')
  .insert({
    email: email || null,
    first_name,
    last_name,
    phone: phone || null,
    role,
    tenant_id: tenantId,
    password_hash: passwordHash, // Temporal, usuario lo cambiará
    schedulable: role === 'doctor' || role === 'member',
    is_active: false, // ⚠️ Cambiar a false
    email_verified: false, // ⚠️ NUEVO
    must_change_password: true // ⚠️ NUEVO
  })
  .select()
  .single()

// Generar token de verificación
const { token, expiresAt } = await createVerificationToken(newUser.id)

// Enviar email con token (no con contraseña)
await sendInvitationEmail({
  recipientEmail: email,
  recipientName: `${first_name} ${last_name}`,
  activationToken: token, // ⚠️ Usar token
  // tempPassword: REMOVER - ya no se envía
  tenantName
})

// Retornar sin tempPassword
return NextResponse.json({
  user: { ...newUser },
  message: 'Usuario creado. Se ha enviado un email de activación.',
  emailSent: true,
  requiresActivation: true
}, { status: 201 })
```

#### 2. Crear Endpoint de Activación
**Archivo:** `src/app/api/auth/activate/route.ts` (CREAR NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAndConsumeToken, activateUserAccount } from '@/lib/verification-tokens'
import { createAdminClient } from '@/lib/supabase-server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({
        error: 'Token y contraseña son requeridos'
      }, { status: 400 })
    }

    // Validar contraseña (mínimo 8 caracteres)
    if (password.length < 8) {
      return NextResponse.json({
        error: 'La contraseña debe tener al menos 8 caracteres'
      }, { status: 400 })
    }

    // Verificar y consumir token
    const verification = await verifyAndConsumeToken(token)

    if (!verification.success) {
      return NextResponse.json({
        error: verification.error
      }, { status: 400 })
    }

    const userId = verification.userId!

    // Hashear nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // Actualizar usuario
    const adminClient = await createAdminClient()
    const { error: updateError } = await adminClient
      .from('custom_users')
      .update({
        password_hash: passwordHash,
        email_verified: true,
        must_change_password: false,
        is_active: true
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[Activate] Error updating user:', updateError)
      return NextResponse.json({
        error: 'Error al activar la cuenta'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.'
    })

  } catch (error) {
    console.error('[Activate] Unexpected error:', error)
    return NextResponse.json({
      error: 'Error al procesar la activación'
    }, { status: 500 })
  }
}
```

#### 3. Crear Página de Activación
**Archivo:** `src/app/auth/activate/page.tsx` (CREAR NUEVO)

```typescript
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ActivateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de activación no válido')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push('/auth/login'), 2000)
      } else {
        setError(data.error || 'Error al activar la cuenta')
      }
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Token Inválido</h2>
          <p>El enlace de activación no es válido.</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Cuenta Activada!</h2>
            <p className="text-gray-600">Redirigiendo al inicio de sesión...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Activar tu Cuenta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Establece tu contraseña para activar tu cuenta
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                minLength={8}
              />
              <p className="mt-1 text-sm text-gray-500">Mínimo 8 caracteres</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Activando...' : 'Activar Cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ActivateContent />
    </Suspense>
  )
}
```

#### 4. Actualizar Login para Verificar Activación
**Archivo:** `src/app/api/auth/login/route.ts`

Agregar después de verificar password (línea ~18):

```typescript
// Después de verificar password:

// Verificar si el email está verificado
if (!userProfile.email_verified) {
  return NextResponse.json({
    error: 'Debes activar tu cuenta antes de iniciar sesión. Revisa tu email.',
    requiresActivation: true
  }, { status: 403 })
}

// Verificar si debe cambiar contraseña
if (userProfile.must_change_password) {
  // Generar token temporal para cambio de contraseña
  const token = customAuth.generateToken({
    userId: userProfile.id,
    email: userProfile.email,
    role: userProfile.role,
    tenantId: userProfile.tenant_id || undefined
  })

  return NextResponse.json({
    requiresPasswordChange: true,
    redirectPath: '/auth/change-password',
    tempToken: token
  })
}
```

#### 5. Crear Endpoint de Cambio de Contraseña
**Archivo:** `src/app/api/auth/change-password/route.ts` (CREAR NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'
import { createAdminClient } from '@/lib/supabase-server'
import { markPasswordChanged } from '@/lib/verification-tokens'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({
        error: 'Contraseñas requeridas'
      }, { status: 400 })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        error: 'La nueva contraseña debe tener al menos 8 caracteres'
      }, { status: 400 })
    }

    // Verificar contraseña actual
    const passwordMatch = await bcrypt.compare(currentPassword, user.profile.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({
        error: 'Contraseña actual incorrecta'
      }, { status: 401 })
    }

    // Hashear nueva contraseña
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Actualizar contraseña
    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('custom_users')
      .update({
        password_hash: newPasswordHash,
        must_change_password: false
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({
        error: 'Error al actualizar contraseña'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('[Change Password] Error:', error)
    return NextResponse.json({
      error: 'Error al procesar solicitud'
    }, { status: 500 })
  }
}
```

#### 6. Crear Página de Cambio de Contraseña
**Archivo:** `src/app/auth/change-password/page.tsx` (CREAR NUEVO)

Similar a activate/page.tsx pero con campos para current y new password.

#### 7. Crear Endpoint de Reenvío de Email
**Archivo:** `src/app/api/auth/resend-activation/route.ts` (CREAR NUEVO)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { createVerificationToken } from '@/lib/verification-tokens'
import { sendInvitationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const adminClient = await createAdminClient()

    // Buscar usuario
    const { data: user, error } = await adminClient
      .from('custom_users')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !user) {
      // No revelar si el usuario existe o no
      return NextResponse.json({
        message: 'Si el email existe, se ha enviado un nuevo enlace de activación.'
      })
    }

    // Solo reenviar si no está verificado
    if (user.email_verified) {
      return NextResponse.json({
        error: 'Esta cuenta ya está activada'
      }, { status: 400 })
    }

    // Generar nuevo token
    const { token } = await createVerificationToken(user.id)

    // Enviar email
    await sendInvitationEmail({
      recipientEmail: user.email,
      recipientName: `${user.first_name} ${user.last_name}`,
      activationToken: token,
      tenantName: 'VittaSami' // TODO: obtener nombre del tenant
    })

    return NextResponse.json({
      success: true,
      message: 'Email de activación reenviado'
    })

  } catch (error) {
    console.error('[Resend Activation] Error:', error)
    return NextResponse.json({
      error: 'Error al enviar email'
    }, { status: 500 })
  }
}
```

## Variables de Entorno

Agregar a `.env.local` y Vercel:

```bash
# Configuración de expiración de tokens (en horas)
EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS=1
```

## Testing

1. Crear usuario nuevo → debe recibir email con link de activación
2. Click en link → formulario de establecer contraseña
3. Establecer contraseña → cuenta activada
4. Login → debe funcionar
5. Login con cuenta no activada → debe rechazar
6. Token expirado → debe mostrar error y opción de reenviar
7. Cambio de contraseña obligatorio → debe redirigir a cambio

## Próximos Pasos

1. Implementar los 7 archivos listados arriba
2. Probar flujo completo en staging
3. Ajustar UI según necesidad
4. Deploy a producción

**Progreso:** 50% completado
**Tiempo estimado para completar:** 2-3 horas de desarrollo
