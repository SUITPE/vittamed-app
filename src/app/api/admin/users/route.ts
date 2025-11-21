import { NextRequest, NextResponse } from 'next/server'
import { customAuth } from '@/lib/custom-auth'
import { createAdminClient } from '@/lib/supabase-admin'

// GET /api/admin/users - Get all users (super_admin only)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      )
    }

    // Only super_admin can access this endpoint
    const role = user.profile?.role
    if (role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super_admin can view all users' },
        { status: 403 }
      )
    }

    // Create admin client to bypass RLS
    const supabase = createAdminClient()

    // Query to get all users with their profiles
    const { data: users, error } = await supabase
      .from('user_role_view')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all users:', error)
      return NextResponse.json(
        { error: 'Failed to fetch users', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      users: users || [],
      total: users?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/admin/users:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
