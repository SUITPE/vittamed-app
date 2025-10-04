import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Use custom JWT auth instead of Supabase Auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    let query = supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    // Filter by user's tenant if doctor or admin_tenant
    if (user.profile?.role === 'doctor' || user.profile?.role === 'admin_tenant' || user.profile?.role === 'staff' || user.profile?.role === 'receptionist') {
      if (!user.profile.tenant_id) {
        return NextResponse.json({ error: 'Tenant not found' }, { status: 403 })
      }
      query = query.eq('tenant_id', user.profile.tenant_id)
    }

    const { data: patients, error } = await query

    if (error) {
      console.error('Error fetching patients:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    return NextResponse.json(patients || [])

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    // Use custom JWT auth instead of Supabase Auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      first_name,
      last_name,
      email,
      document,
      phone,
      date_of_birth,
      address,
      medical_history,
      tenant_id
    } = await request.json()

    if (!first_name || !last_name || !email || !document) {
      return NextResponse.json(
        { error: 'first_name, last_name, email, and document are required' },
        { status: 400 }
      )
    }

    let finalTenantId = tenant_id

    // Use user's tenant if they have one
    if (user.profile?.role === 'doctor' || user.profile?.role === 'admin_tenant' || user.profile?.role === 'staff' || user.profile?.role === 'receptionist') {
      if (user.profile.tenant_id) {
        finalTenantId = user.profile.tenant_id
      }
    }

    if (!finalTenantId) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 })
    }

    const { data: existingPatient } = await supabase
      .from('patients')
      .select('id')
      .eq('email', email)
      .eq('tenant_id', finalTenantId)
      .single()

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Patient with this email already exists in this tenant' },
        { status: 400 }
      )
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .insert({
        first_name,
        last_name,
        email,
        document,
        phone,
        date_of_birth,
        address,
        medical_history,
        tenant_id: finalTenantId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating patient:', error)
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    }

    return NextResponse.json(patient)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}