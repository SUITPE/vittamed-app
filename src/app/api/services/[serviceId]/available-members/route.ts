import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

// Get all members available to provide a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { serviceId } = await params
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify service exists and belongs to the tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, is_active')
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found or not available' },
        { status: 404 }
      )
    }

    // Get all active doctors/professionals for this service in this tenant
    // Note: Using doctors table as the main provider model
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        first_name,
        last_name,
        email,
        specialty,
        doctor_tenants!inner(
          tenant_id,
          is_active
        )
      `)
      .eq('doctor_tenants.tenant_id', tenantId)
      .eq('doctor_tenants.is_active', true)

    if (error) {
      console.error('Error fetching available doctors:', error)
      return NextResponse.json(
        { error: 'Failed to fetch available doctors' },
        { status: 500 }
      )
    }

    // Format the response for easier frontend consumption
    const availableMembers = doctors?.map(doctor => ({
      member_service_id: doctor.id, // Using doctor id as member_service_id for compatibility
      member_id: doctor.id,
      first_name: doctor.first_name || '',
      last_name: doctor.last_name || '',
      email: doctor.email || '',
      specialty: doctor.specialty || '',
      full_name: `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || doctor.email || 'Unknown Doctor',
      allow_bookings: true // Doctors can accept bookings
    }))?.sort((a, b) => a.first_name.localeCompare(b.first_name)) || []

    return NextResponse.json({
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price
      },
      available_members: availableMembers,
      total_members: availableMembers.length
    })

  } catch (error) {
    console.error('Error in available members API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}