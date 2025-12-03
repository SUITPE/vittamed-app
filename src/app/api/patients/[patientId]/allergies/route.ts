import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

// GET /api/patients/:patientId/allergies - Get all allergies for a patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params

  try {
    const supabase = await createAdminClient()

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get patient to verify tenant access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check if user has access to this patient's tenant
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch allergies
    const { data: allergies, error: allergiesError } = await supabase
      .from('patient_allergies')
      .select('*')
      .eq('patient_id', patientId)
      .order('is_active', { ascending: false })
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false })

    if (allergiesError) {
      console.error('Error fetching allergies:', allergiesError)
      return NextResponse.json({ error: 'Failed to fetch allergies' }, { status: 500 })
    }

    return NextResponse.json({ allergies: allergies || [] })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/patients/:patientId/allergies - Create a new allergy record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params

  try {
    const supabase = await createAdminClient()

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only doctors and admins can create allergy records
    if (!['doctor', 'admin_tenant', 'super_admin', 'receptionist'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only authorized staff can create allergy records'
      }, { status: 403 })
    }

    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify tenant access
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      allergen,
      allergy_type,
      reaction,
      severity,
      notes,
      first_observed
    } = body

    // Validate required fields
    if (!allergen || !allergy_type) {
      return NextResponse.json({
        error: 'Missing required fields: allergen, allergy_type'
      }, { status: 400 })
    }

    // Create allergy record
    const { data: allergy, error: allergyError } = await supabase
      .from('patient_allergies')
      .insert({
        patient_id: patientId,
        tenant_id: patient.tenant_id,
        allergen,
        allergy_type,
        reaction: reaction || null,
        severity: severity || null,
        notes: notes || null,
        first_observed: first_observed || null,
        is_active: true
      })
      .select()
      .single()

    if (allergyError) {
      // Check for unique constraint violation
      if (allergyError.code === '23505') {
        return NextResponse.json({
          error: 'This allergy is already registered for the patient'
        }, { status: 409 })
      }
      console.error('Error creating allergy:', allergyError)
      return NextResponse.json({ error: 'Failed to create allergy record' }, { status: 500 })
    }

    return NextResponse.json({ allergy }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
