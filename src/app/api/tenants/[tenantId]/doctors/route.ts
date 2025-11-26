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
        error: 'Only administrators, staff, receptionists and doctors can view doctors'
      }, { status: 403 })
    }

    // Get all schedulable users (not just doctors from doctor_tenants table)
    const { data: schedulableUsers, error } = await supabase
      .from('custom_users')
      .select(`
        id,
        first_name,
        last_name,
        role
      `)
      .eq('tenant_id', tenantId)
      .eq('schedulable', true)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching schedulable users:', error)
      return NextResponse.json({ error: 'Failed to fetch schedulable users' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const doctors = schedulableUsers?.map((user: any) => ({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      specialty: undefined // No specialty field in custom_users
    })) || []

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}