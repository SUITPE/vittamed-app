import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

interface TimeBlock {
  day: number
  startTime: string
  endTime: string
}

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

// PUT - Update availability for a specific doctor (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Only admin_tenant and staff can update other doctors' availability
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    if (userTenantId !== tenantId) {
      return NextResponse.json({ error: 'Cannot modify availability for another tenant' }, { status: 403 })
    }

    const isAdmin = userRole === 'admin_tenant' || userRole === 'staff'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only administrators can update availability' }, { status: 403 })
    }

    const body = await request.json()
    const { doctorId, blocks } = body as { doctorId: string; blocks: TimeBlock[] }

    if (!doctorId || !Array.isArray(blocks)) {
      return NextResponse.json({ error: 'doctorId and blocks array are required' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get doctor_tenant_id
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .single()

    if (dtError || !doctorTenant) {
      console.error('Error finding doctor_tenant:', dtError)
      return NextResponse.json({ error: 'Doctor not found for this tenant' }, { status: 404 })
    }

    const doctorTenantId = doctorTenant.id

    // Delete existing availability for this doctor
    const { error: deleteError } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_tenant_id', doctorTenantId)

    if (deleteError) {
      console.error('Error deleting existing availability:', deleteError)
      return NextResponse.json({ error: 'Failed to clear existing availability' }, { status: 500 })
    }

    // Insert new availability blocks
    if (blocks.length > 0) {
      const availabilityRecords = blocks.map(block => ({
        doctor_tenant_id: doctorTenantId,
        day_of_week: block.day,
        start_time: block.startTime,
        end_time: block.endTime,
        is_active: true
      }))

      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(availabilityRecords)

      if (insertError) {
        console.error('Error inserting availability:', insertError)
        return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
      }
    }

    console.log(`[Availability] Updated ${blocks.length} blocks for doctor ${doctorId}`)

    return NextResponse.json({
      success: true,
      message: `Availability updated: ${blocks.length} blocks saved`,
      blocksCount: blocks.length
    })
  } catch (error) {
    console.error('Unexpected error updating availability:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}