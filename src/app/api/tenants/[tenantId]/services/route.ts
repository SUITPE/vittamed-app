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
    // Use service role client to bypass RLS (we handle auth manually with customAuth)
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
        error: 'Only administrators, staff and receptionists can create services for their tenant'
      }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, duration_minutes, price, category } = body

    // Validate required fields
    if (!name || !duration_minutes || price === undefined) {
      return NextResponse.json({
        error: 'Missing required fields: name, duration_minutes, price'
      }, { status: 400 })
    }

    const { data: service, error } = await supabase
      .from('services')
      .insert({
        tenant_id: tenantId,
        name,
        description,
        duration_minutes,
        price,
        category,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
    }

    return NextResponse.json({ service }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}