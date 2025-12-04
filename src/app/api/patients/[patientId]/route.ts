import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { customAuth } from '@/lib/custom-auth'
import { z } from 'zod'

// Validation schema for updating a patient
const UpdatePatientSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  document: z.string().optional(),
  phone: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  medical_history: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
})

// GET /api/patients/:patientId - Get single patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify tenant access
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/patients/:patientId - Update patient
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params
  console.log('[PUT /api/patients/:patientId] START:', patientId)

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Authenticate
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Check role - only admin, staff, receptionist can update patients
    const allowedRoles = ['admin_tenant', 'staff', 'receptionist', 'super_admin', 'doctor']
    if (!user.profile?.role || !allowedRoles.includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // 3. Get current patient to verify tenant access
    const { data: currentPatient, error: fetchError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (fetchError || !currentPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // 4. Verify tenant access
    if (user.profile?.tenant_id !== currentPatient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 5. Parse and validate request body
    const body = await request.json()
    const parseResult = UpdatePatientSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const updateData = parseResult.data

    // 6. If email is being changed, check for duplicates
    if (updateData.email && updateData.email !== currentPatient.email) {
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('email', updateData.email)
        .eq('tenant_id', currentPatient.tenant_id)
        .neq('id', patientId)
        .single()

      if (existingPatient) {
        return NextResponse.json(
          { error: 'Another patient with this email already exists' },
          { status: 400 }
        )
      }
    }

    // 7. Update patient
    const { data: updatedPatient, error: updateError } = await supabase
      .from('patients')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)
      .select()
      .single()

    if (updateError) {
      console.error('[PUT /api/patients/:patientId] Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    console.log('[PUT /api/patients/:patientId] SUCCESS')
    return NextResponse.json(updatedPatient)

  } catch (error) {
    console.error('[PUT /api/patients/:patientId] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
