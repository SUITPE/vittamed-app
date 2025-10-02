import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateBrandData } from '@/types/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Brand ID is required' },
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

    const { data: brand, error } = await supabase
      .from('product_brands')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching brand:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brand' },
        { status: 500 }
      )
    }

    return NextResponse.json(brand)

  } catch (error) {
    console.error('Error in brand API:', error)
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
        { error: 'Brand ID is required' },
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin_tenant', 'receptionist'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    const updates: Partial<UpdateBrandData> = await request.json()

    // Remove id from updates to prevent modification
    const { id: _, ...allowedUpdates } = updates

    // Check for duplicate name if being updated
    if (allowedUpdates.name) {
      const { data: existing } = await supabase
        .from('product_brands')
        .select('id')
        .eq('name', allowedUpdates.name)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Brand with this name already exists' },
          { status: 409 }
        )
      }
    }

    // Update brand
    const { data: brand, error } = await supabase
      .from('product_brands')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
      console.error('Error updating brand:', error)
      return NextResponse.json(
        { error: 'Failed to update brand' },
        { status: 500 }
      )
    }

    return NextResponse.json(brand)

  } catch (error) {
    console.error('Error in update brand API:', error)
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
        { error: 'Brand ID is required' },
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

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('custom_users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Forbidden - admin access required' },
        { status: 403 }
      )
    }

    // Check if brand is being used by products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('brand_id', id)
      .limit(1)

    if (productsError) {
      console.error('Error checking product usage:', productsError)
      return NextResponse.json(
        { error: 'Failed to check brand usage' },
        { status: 500 }
      )
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete brand that is being used by products. Consider deactivating it instead.' },
        { status: 409 }
      )
    }

    // Delete brand
    const { error } = await supabase
      .from('product_brands')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting brand:', error)
      return NextResponse.json(
        { error: 'Failed to delete brand' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Brand deleted successfully' })

  } catch (error) {
    console.error('Error in delete brand API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}