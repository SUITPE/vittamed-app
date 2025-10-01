import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role and tenant access
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    const isAuthorized = userRole === 'admin_tenant' ||
                        userRole === 'staff' ||
                        userRole === 'receptionist' ||
                        (userRole === 'doctor' && userTenantId === tenantId)

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, staff, receptionists and doctors can view availability'
      }, { status: 403 })
    }

    // First, get all doctor IDs for this tenant
    const { data: doctorTenants, error: doctorError } = await supabase
      .from('doctor_tenants')
      .select('doctor_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (doctorError) {
      console.error('Error fetching doctor tenants:', doctorError)
      return NextResponse.json({ error: 'Failed to fetch doctor tenants' }, { status: 500 })
    }

    const doctorIds = doctorTenants?.map(dt => dt.doctor_id) || []

    if (doctorIds.length === 0) {
      return NextResponse.json({ availability: [] })
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
      .in('doctor_id', doctorIds)

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