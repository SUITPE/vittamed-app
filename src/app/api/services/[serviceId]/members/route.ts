import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

// Get all members assigned to a specific service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { serviceId } = await params
    const { searchParams } = new URL(request.url)
    const isActiveOnly = searchParams.get('active_only') === 'true'

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user tenant
    const userTenantId = user.profile?.tenant_id

    if (!userTenantId) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    // Verify the service exists and belongs to this tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes, price, is_active, tenant_id')
      .eq('id', serviceId)
      .eq('tenant_id', userTenantId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found or not accessible' },
        { status: 404 }
      )
    }

    // Build query to get service's assigned members
    let query = supabase
      .from('member_services')
      .select(`
        id,
        member_user_id,
        is_active,
        created_at,
        updated_at,
        custom_users!member_services_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .eq('service_id', serviceId)
      .eq('tenant_id', userTenantId)
      .order('created_at', { ascending: false })

    // Filter by active only if requested
    if (isActiveOnly) {
      query = query.eq('is_active', true)
    }

    const { data: serviceMemberships, error } = await query

    if (error) {
      console.error('Error fetching service members:', error)
      return NextResponse.json(
        { error: 'Failed to fetch service members' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        price: service.price,
        is_active: service.is_active
      },
      assigned_members: serviceMemberships?.map(sm => ({
        id: sm.id,
        member_user_id: sm.member_user_id,
        is_active: sm.is_active,
        member: sm.custom_users
      })) || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in service members API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Assign/unassign multiple members to a service in batch
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { serviceId } = await params

    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check user role and tenant
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    if (!userRole || !['admin_tenant', 'receptionist', 'staff'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!userTenantId) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    const { member_user_ids, action } = await request.json()

    if (!member_user_ids || !Array.isArray(member_user_ids)) {
      return NextResponse.json(
        { error: 'member_user_ids array is required' },
        { status: 400 }
      )
    }

    if (!action || !['assign', 'unassign'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be either "assign" or "unassign"' },
        { status: 400 }
      )
    }

    // Verify service exists and belongs to this tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, tenant_id')
      .eq('id', serviceId)
      .eq('tenant_id', userTenantId)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found or not accessible' },
        { status: 400 }
      )
    }

    if (action === 'assign') {
      // Verify all members exist and belong to this tenant
      const { data: members, error: membersError } = await supabase
        .from('custom_users')
        .select('id, role, tenant_id')
        .in('id', member_user_ids)
        .eq('role', 'member')
        .eq('tenant_id', userTenantId)

      if (membersError || !members || members.length !== member_user_ids.length) {
        return NextResponse.json(
          { error: 'One or more members not found or not accessible' },
          { status: 400 }
        )
      }

      // Create assignments (ignore duplicates)
      const assignments = member_user_ids.map(memberId => ({
        member_user_id: memberId,
        service_id: serviceId,
        tenant_id: userTenantId,
        is_active: true
      }))

      const { data: created, error: createError } = await supabase
        .from('member_services')
        .upsert(assignments, { onConflict: 'member_user_id, service_id, tenant_id' })
        .select(`
          *,
          custom_users!member_services_member_user_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)

      if (createError) {
        console.error('Error creating assignments:', createError)
        return NextResponse.json(
          { error: 'Failed to assign members to service' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: `Successfully assigned ${created?.length || 0} members to service`,
        assignments: created
      })

    } else { // unassign
      // Remove assignments
      const { error: deleteError } = await supabase
        .from('member_services')
        .delete()
        .eq('service_id', serviceId)
        .in('member_user_id', member_user_ids)
        .eq('tenant_id', userTenantId)

      if (deleteError) {
        console.error('Error removing assignments:', deleteError)
        return NextResponse.json(
          { error: 'Failed to unassign members from service' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: `Successfully unassigned members from service`
      })
    }

  } catch (error) {
    console.error('Error in batch assign/unassign API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}