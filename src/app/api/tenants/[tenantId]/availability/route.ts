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

    // First, get all doctor_tenant IDs for this tenant with doctor info
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
    const doctorIds = doctorTenants?.map(dt => dt.doctor_id) || []

    if (doctorTenantIds.length === 0) {
      return NextResponse.json({ availability: [], doctors: [] })
    }

    // Get doctor profiles to get their names
    const { data: doctorProfiles, error: profilesError } = await supabase
      .from('custom_users')
      .select('id, first_name, last_name')
      .in('id', doctorIds)

    if (profilesError) {
      console.error('Error fetching doctor profiles:', profilesError)
    }

    // Create a map of doctor_id -> doctor info
    const doctorMap = new Map()
    doctorProfiles?.forEach(doc => {
      doctorMap.set(doc.id, `Dr. ${doc.first_name} ${doc.last_name}`)
    })

    // Create a map of doctor_tenant_id -> doctor_id
    const doctorTenantMap = new Map()
    doctorTenants?.forEach(dt => {
      doctorTenantMap.set(dt.id, dt.doctor_id)
    })

    // Get availability for all doctors in this tenant
    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('id, doctor_tenant_id, day_of_week, start_time, end_time')
      .in('doctor_tenant_id', doctorTenantIds)

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    // Enrich availability with doctor names
    const enrichedAvailability = availability?.map(av => {
      const doctorId = doctorTenantMap.get(av.doctor_tenant_id)
      const doctorName = doctorMap.get(doctorId) || 'Doctor'
      return {
        ...av,
        doctor_id: doctorId,
        doctor_name: doctorName,
        is_active: true
      }
    }) || []

    // Also return doctor list for reference
    const doctors = doctorProfiles?.map(doc => ({
      id: doc.id,
      name: `Dr. ${doc.first_name} ${doc.last_name}`
    })) || []

    return NextResponse.json({
      availability: enrichedAvailability,
      doctors
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}