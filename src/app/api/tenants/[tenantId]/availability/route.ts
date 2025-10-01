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

    // First, get all doctor_tenant IDs for this tenant
    const { data: doctorTenants, error: doctorError } = await supabase
      .from('doctor_tenants')
      .select('id, doctor_id')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (doctorError) {
      console.error('Error fetching doctor tenants:', doctorError)
      return NextResponse.json({ error: 'Failed to fetch doctor tenants' }, { status: 500 })
    }

    const doctorTenantIds = doctorTenants?.map(dt => dt.id) || []

    if (doctorTenantIds.length === 0) {
      return NextResponse.json({ availability: [] })
    }

    // Get availability for all doctors in this tenant
    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('id, doctor_tenant_id, day_of_week, start_time, end_time')
      .in('doctor_tenant_id', doctorTenantIds)

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json({ availability: availability || [] })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}