import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🔍 Fetching doctor availability for:', { doctorId })

    // First, try to get the doctor_tenant_id for this doctor
    const { data: doctorTenants, error: doctorTenantError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)

    if (doctorTenantError) {
      console.error('Error fetching doctor tenants:', doctorTenantError)
      // Return empty availability array instead of error for development
      console.log('⚠️ Returning empty availability due to doctor_tenants error')
      return NextResponse.json([])
    }

    if (!doctorTenants || doctorTenants.length === 0) {
      console.log('⚠️ Doctor not assigned to any tenant, returning empty availability')
      // Return empty availability array instead of 404 for development
      return NextResponse.json([])
    }

    // Use the first active doctor_tenant_id (for simplicity, assume one tenant per doctor)
    const doctorTenantId = doctorTenants[0].id
    console.log('✅ Found doctor_tenant_id:', doctorTenantId)

    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_tenant_id', doctorTenantId)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json(availability || [])

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { day_of_week, start_time, end_time, lunch_start, lunch_end } = await request.json()

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // First, get the doctor_tenant_id for this doctor
    const { data: doctorTenants, error: doctorTenantError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)

    if (doctorTenantError || !doctorTenants || doctorTenants.length === 0) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const doctorTenantId = doctorTenants[0].id

    const { data: existing } = await supabase
      .from('doctor_availability')
      .select('id')
      .eq('doctor_tenant_id', doctorTenantId)
      .eq('day_of_week', day_of_week)
      .single()

    let result

    if (existing) {
      result = await supabase
        .from('doctor_availability')
        .update({
          start_time,
          end_time,
          lunch_start,
          lunch_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('doctor_availability')
        .insert({
          doctor_tenant_id: doctorTenantId,
          day_of_week,
          start_time,
          end_time,
          lunch_start,
          lunch_end,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating availability:', result.error)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('day_of_week')

    if (!dayOfWeek) {
      return NextResponse.json(
        { error: 'day_of_week parameter is required' },
        { status: 400 }
      )
    }

    // First, get the doctor_tenant_id for this doctor
    const { data: doctorTenants, error: doctorTenantError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('is_active', true)

    if (doctorTenantError || !doctorTenants || doctorTenants.length === 0) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const doctorTenantId = doctorTenants[0].id

    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_tenant_id', doctorTenantId)
      .eq('day_of_week', parseInt(dayOfWeek))

    if (error) {
      console.error('Error deleting availability:', error)
      return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}