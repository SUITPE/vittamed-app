import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { executeServiceFlow } from '@/flows/ServiceManagementFlow'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    const { data: services, error } = await supabase
      .from('services')
      .select(`
        *,
        category:service_categories(id, name)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name')

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
    }

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
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
        error: 'Only administrators, staff and receptionists can create services for their tenant'
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, duration_minutes, price, category_id, is_active } = body

    // Validate required fields
    if (!name || !duration_minutes || price === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: name, duration_minutes, price'
      }, { status: 400 })
    }

    // Use Context7 flow for service creation
    const serviceData = {
      name,
      description: description || '',
      duration_minutes,
      price,
      category_id: category_id || null,
      is_active: is_active !== undefined ? is_active : true
    }

    // Execute the service creation flow
    const result = await executeServiceFlow('create', serviceData, tenantId)

    if (!result.service) {
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
    }

    return NextResponse.json({ service: result.service }, { status: 201 })
  } catch (error: any) {
    console.error('Service creation error:', error)
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}