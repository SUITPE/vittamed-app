import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateMemberServiceData } from '@/types/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params
    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('include_relations') === 'true'

    if (!id) {
      return NextResponse.json(
        { error: 'Member service ID is required' },
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

    // Get user's tenant
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

    // Build select query with relations
    let selectQuery = `
      *,
      services!inner(
        id,
        name,
        description,
        duration_minutes,
        price,
        is_active
      )
    `

    if (includeRelations) {
      selectQuery += `,
        custom_users!member_services_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `
    }

    const { data: memberService, error } = await supabase
      .from('member_services')
      .select(selectQuery)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Member service association not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching member service:', error)
      return NextResponse.json(
        { error: 'Failed to fetch member service association' },
        { status: 500 }
      )
    }

    return NextResponse.json(memberService)

  } catch (error) {
    console.error('Error in member service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Member service ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and permissions
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and tenant
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin_tenant', 'receptionist'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    if (!profile.tenant_id) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    const updates: Partial<UpdateMemberServiceData> = await request.json()

    // Remove fields that shouldn't be updated
    const { member_user_id: _, service_id: __, tenant_id: ___, ...allowedUpdates } = updates as any

    // Update member service association
    const { data: memberService, error } = await supabase
      .from('member_services')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select(`
        *,
        services!inner(
          id,
          name,
          description,
          duration_minutes,
          price
        ),
        custom_users!member_services_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Member service association not found' },
          { status: 404 }
        )
      }
      console.error('Error updating member service:', error)
      return NextResponse.json(
        { error: 'Failed to update member service association' },
        { status: 500 }
      )
    }

    return NextResponse.json(memberService)

  } catch (error) {
    console.error('Error in update member service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Member service ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and admin role
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and tenant
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      )
    }

    if (!profile.tenant_id) {
      return NextResponse.json(
        { error: 'User not associated with any tenant' },
        { status: 403 }
      )
    }

    // Check if there are any active appointments using this member-service association
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('assigned_member_id', id) // This would need to be implemented in booking logic
      .eq('status', 'confirmed')
      .limit(1)

    if (appointmentsError) {
      console.error('Error checking appointment usage:', appointmentsError)
      // Continue with deletion - this is just a warning check
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete member service association that has active appointments. Consider deactivating it instead.' },
        { status: 409 }
      )
    }

    // Delete member service association
    const { error } = await supabase
      .from('member_services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Member service association not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting member service:', error)
      return NextResponse.json(
        { error: 'Failed to delete member service association' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Member service association deleted successfully' })

  } catch (error) {
    console.error('Error in delete member service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}