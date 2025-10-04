import { NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params
  try {
    // Use service role client to bypass RLS
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current user using custom JWT auth
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check user role and tenant access
    const userRole = user.profile?.role
    const userTenantId = user.profile?.tenant_id

    const isAuthorized = (userRole === 'admin_tenant' || userRole === 'staff' || userRole === 'receptionist')
                        && userTenantId === tenantId

    if (!isAuthorized) {
      return NextResponse.json({
        error: 'Only administrators, staff and receptionists can delete services for their tenant'
      }, { status: 403 })
    }

    // Soft delete - set is_active to false
    const { error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Service deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateService(
  tenantId: string,
  serviceId: string,
  request: Request
) {
  // Use service role client to bypass RLS
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Get current user using custom JWT auth
  const user = await customAuth.getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  // Check user role and tenant access
  const userRole = user.profile?.role
  const userTenantId = user.profile?.tenant_id

  const isAuthorized = (userRole === 'admin_tenant' || userRole === 'staff' || userRole === 'receptionist')
                      && userTenantId === tenantId

  if (!isAuthorized) {
    return NextResponse.json({
      error: 'Only administrators, staff and receptionists can update services for their tenant'
    }, { status: 403 })
  }

  const body = await request.json()
  const { name, description, duration_minutes, price, category, is_active } = body

  const updateData: any = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes
  if (price !== undefined) updateData.price = price
  if (category !== undefined) updateData.category = category
  if (is_active !== undefined) updateData.is_active = is_active

  const { data: service, error } = await supabase
    .from('services')
    .update(updateData)
    .eq('id', serviceId)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }

  return NextResponse.json({ service })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params
  try {
    return await updateService(tenantId, serviceId, request)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; serviceId: string }> }
) {
  const { tenantId, serviceId } = await params
  try {
    return await updateService(tenantId, serviceId, request)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
