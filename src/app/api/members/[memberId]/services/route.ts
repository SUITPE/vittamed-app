import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

// Get all services assigned to a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { memberId } = params
    const { searchParams } = new URL(request.url)
    const isActiveOnly = searchParams.get('active_only') === 'true'

    if (!memberId) {
      return NextResponse.json(
        { error: 'Member ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's tenant and role
    const { data: profile } = await supabase
      .from('custom_users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    // Verify the member exists and belongs to this tenant
    const { data: member, error: memberError } = await supabase
      .from('custom_users')
      .select('id, first_name, last_name, email, role, tenant_id')
      .eq('id', memberId)
      .eq('role', 'member')
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Member not found or not accessible' },
        { status: 404 }
      )
    }

    // Check permissions - members can only view their own services
    // Other roles can view if they're in the same tenant
    const canAccess =
      user.id === memberId || // Own data
      ['admin_tenant', 'receptionist', 'doctor'].includes(profile.role) // Admin access

    if (!canAccess) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Build query to get member's services
    let query = supabase
      .from('member_services')
      .select(`
        id,
        service_id,
        is_active,
        created_at,
        updated_at,
        services!inner(
          id,
          name,
          description,
          duration_minutes,
          price,
          is_active,
          service_type,
          category:category_id(
            id,
            name,
            description
          )
        )
      `)
      .eq('member_user_id', memberId)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    // Filter by active only if requested
    if (isActiveOnly) {
      query = query.eq('is_active', true)
      query = query.eq('services.is_active', true)
    }

    const { data: memberServices, error } = await query

    if (error) {
      console.error('Error fetching member services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch member services' },
        { status: 500 }
      )
    }

    // Format response
    const response = {
      member: {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        role: member.role
      },
      assigned_services: memberServices?.map(ms => ({
        id: ms.id,
        service_id: ms.service_id,
        is_active: ms.is_active,
        service: ms.services
      })) || []
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in member services API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}