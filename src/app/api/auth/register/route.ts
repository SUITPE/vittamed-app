import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { customAuth } from '@/lib/custom-auth'

// Validation schema
const registerSchema = z.object({
  first_name: z.string().min(1, 'Nombre es requerido'),
  last_name: z.string().min(1, 'Apellido es requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['admin_tenant', 'doctor', 'patient']).default('patient'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = registerSchema.parse(body)

    console.log('📝 Registration request:', {
      email: validatedData.email,
      role: validatedData.role,
      name: `${validatedData.first_name} ${validatedData.last_name}`
    })

    // Create user using custom auth service
    const { user, error } = await customAuth.createUser({
      email: validatedData.email,
      password: validatedData.password,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      role: validatedData.role,
    })

    if (error || !user) {
      console.error('❌ Error creating user:', error)
      return NextResponse.json(
        { error: error || 'Error al crear el usuario' },
        { status: 400 }
      )
    }

    console.log('✅ User created successfully:', {
      id: user.id,
      email: user.email,
      role: user.role
    })

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Registration error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar el registro' },
      { status: 500 }
    )
  }
}
