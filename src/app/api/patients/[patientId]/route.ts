import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

async function getUserProfile(supabase: any, userId: string) {
  const { data: profile, error } = await supabase
    .from('custom_users')
    .select('role, tenant_id')
    .eq('id', userId)
    .single()

  if (error) {
    console.warn('Could not fetch user profile:', error)
    return null
  }

  return profile
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
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

    // Get user profile to check permissions
    const userProfile = await getUserProfile(supabase, session.user.id)

    if (userProfile?.role === 'doctor' && userProfile.tenant_id !== patient.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (userProfile?.role === 'admin_tenant' && userProfile.tenant_id !== patient.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Get user profile to check permissions
    const userProfile = await getUserProfile(supabase, session.user.id)

    if (userProfile?.role === 'doctor' && userProfile.tenant_id !== existingPatient.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (userProfile?.role === 'admin_tenant' && userProfile.tenant_id !== existingPatient.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData = await request.json()

    const allowedFields = [
      'first_name',
      'last_name',
      'email',
      'phone',
      'date_of_birth',
      'address',
      'medical_history',
      'is_active'
    ]

    const filteredData = Object.keys(updateData)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {} as any)

    if (Object.keys(filteredData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    filteredData.updated_at = new Date().toISOString()

    const { data: patient, error } = await supabase
      .from('patients')
      .update(filteredData)
      .eq('id', patientId)
      .select()
      .single()

    if (error) {
      console.error('Error updating patient:', error)
      return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check permissions
    const userProfile = await getUserProfile(supabase, session.user.id)

    if (userProfile?.role !== 'admin_tenant') {
      return NextResponse.json({ error: 'Only admin_tenant can delete patients' }, { status: 403 })
    }

    const { data: existingPatient, error: fetchError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (fetchError || !existingPatient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    if (userProfile?.tenant_id !== existingPatient.tenant_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: activeAppointments } = await supabase
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)
      .in('status', ['pending', 'confirmed'])

    if (activeAppointments && activeAppointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete patient with active appointments' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('patients')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', patientId)

    if (error) {
      console.error('Error deactivating patient:', error)
      return NextResponse.json({ error: 'Failed to deactivate patient' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}