import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { UpdateServiceData } from '@/types/catalog'

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
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from('user_profiles')
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
      category:category_id (
        id,
        name,
        description
      )
    `

    if (includeRelations) {
      selectQuery += `,
        images:service_images (
          id,
          image_url,
          alt_text,
          is_primary,
          sort_order
        )
      `
    }

    const { data: service, error } = await supabase
      .from('services')
      .select(selectQuery)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching service:', error)
      return NextResponse.json(
        { error: 'Failed to fetch service' },
        { status: 500 }
      )
    }

    return NextResponse.json(service)

  } catch (error) {
    console.error('Error in service API:', error)
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
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and tenant
    const { data: profile } = await supabase
      .from('user_profiles')
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

    const updates: Partial<UpdateServiceData> = await request.json()

    // Remove id and tenant_id from updates to prevent modification
    const { id: _, tenant_id: __, ...allowedUpdates } = updates as any

    // Validate duration is positive if being updated
    if (allowedUpdates.duration_minutes !== undefined && allowedUpdates.duration_minutes <= 0) {
      return NextResponse.json(
        { error: 'Duration must be positive' },
        { status: 400 }
      )
    }

    // Validate price is non-negative if being updated
    if (allowedUpdates.price !== undefined && allowedUpdates.price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      )
    }

    // Validate category if being updated
    if (allowedUpdates.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('service_categories')
        .select('id')
        .eq('id', allowedUpdates.category_id)
        .eq('is_active', true)
        .single()

      if (categoryError || !category) {
        return NextResponse.json(
          { error: 'Invalid or inactive category' },
          { status: 400 }
        )
      }
    }

    // Validate service_type if being updated
    if (allowedUpdates.service_type) {
      const validServiceTypes = ['clinic', 'spa', 'consultorio', 'general']
      if (!validServiceTypes.includes(allowedUpdates.service_type)) {
        return NextResponse.json(
          { error: 'Invalid service type. Must be one of: clinic, spa, consultorio, general' },
          { status: 400 }
        )
      }
    }

    // Update service
    const { data: service, error } = await supabase
      .from('services')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select(`
        *,
        category:category_id (
          id,
          name,
          description
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }
      console.error('Error updating service:', error)
      return NextResponse.json(
        { error: 'Failed to update service' },
        { status: 500 }
      )
    }

    return NextResponse.json(service)

  } catch (error) {
    console.error('Error in update service API:', error)
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
        { error: 'Service ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication and admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and tenant
    const { data: profile } = await supabase
      .from('user_profiles')
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

    // Check if service is being used in appointments
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id')
      .eq('service_id', id)
      .limit(1)

    if (appointmentsError) {
      console.error('Error checking appointment usage:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to check service usage' },
        { status: 500 }
      )
    }

    if (appointments && appointments.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service that is being used in appointments. Consider deactivating it instead.' },
        { status: 409 }
      )
    }

    // Delete associated images first
    const { error: imagesError } = await supabase
      .from('service_images')
      .delete()
      .eq('service_id', id)

    if (imagesError) {
      console.error('Error deleting service images:', imagesError)
      // Continue with service deletion even if image deletion fails
    }

    // Delete service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting service:', error)
      return NextResponse.json(
        { error: 'Failed to delete service' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Service deleted successfully' })

  } catch (error) {
    console.error('Error in delete service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}