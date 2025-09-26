import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    // Get current user and check permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has access to this tenant (admin or receptionist)
    const { data: userAccess, error: accessError } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (accessError || !userAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isAuthorized = userAccess.role === 'admin_tenant' ||
                        userAccess.role === 'receptionist' ||
                        (userAccess.role === 'doctor' && userAccess.tenant_id === tenantId)

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, receptionists and doctors can view availability'
      }, { status: 403 })
    }

    // Get availability for all doctors in this tenant
    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select(`
        id,
        doctor_id,
        day_of_week,
        start_time,
        end_time,
        lunch_start,
        lunch_end,
        doctors (
          id,
          first_name,
          last_name,
          specialty
        )
      `)
      .in('doctor_id', supabase
        .from('doctor_tenants')
        .select('doctor_id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
      )

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    // Transform the data to include doctor info
    const transformedAvailability = availability?.map((avail: any) => ({
      id: avail.id,
      doctor_id: avail.doctor_id,
      day_of_week: avail.day_of_week,
      start_time: avail.start_time,
      end_time: avail.end_time,
      lunch_start: avail.lunch_start,
      lunch_end: avail.lunch_end,
      doctor: avail.doctors
    })) || []

    return NextResponse.json({ availability: transformedAvailability })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}