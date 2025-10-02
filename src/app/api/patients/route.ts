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

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  try {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
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

    // Get user profile to check role and tenant access
    const userProfile = await getUserProfile(supabase, session.user.id)

    if (userProfile?.role === 'doctor') {
      if (!userProfile.tenant_id) {
        return NextResponse.json({ error: 'Doctor tenant not found' }, { status: 403 })
      }
      query = query.eq('tenant_id', userProfile.tenant_id)
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
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      address,
      medical_history,
      tenant_id
    } = await request.json()

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'first_name, last_name, and email are required' },
        { status: 400 }
      )
    }

    let finalTenantId = tenant_id

    // Get user profile to determine tenant access
    const userProfile = await getUserProfile(supabase, session.user.id)

    if (userProfile?.role === 'doctor' && userProfile.tenant_id) {
      finalTenantId = userProfile.tenant_id
    } else if (userProfile?.role === 'admin_tenant' && userProfile.tenant_id) {
      finalTenantId = userProfile.tenant_id
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