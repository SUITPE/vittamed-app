import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateUnitMeasureData } from '@/types/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Unit measure ID is required' },
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

    const { data: unitMeasure, error } = await supabase
      .from('unit_measures')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Unit measure not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching unit measure:', error)
      return NextResponse.json(
        { error: 'Failed to fetch unit measure' },
        { status: 500 }
      )
    }

    return NextResponse.json(unitMeasure)

  } catch (error) {
    console.error('Error in unit measure API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Unit measure ID is required' },
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

    const updates: Partial<UpdateUnitMeasureData> = await request.json()

    // Remove id from updates to prevent modification
    const { id: _, ...allowedUpdates } = updates

    // Check for duplicate name or abbreviation if being updated
    if (allowedUpdates.name || allowedUpdates.abbreviation) {
      const conditions = []
      if (allowedUpdates.name) conditions.push(`name.eq.${allowedUpdates.name}`)
      if (allowedUpdates.abbreviation) conditions.push(`abbreviation.eq.${allowedUpdates.abbreviation}`)

      const { data: existing } = await supabase
        .from('unit_measures')
        .select('id')
        .or(conditions.join(','))
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Unit measure with this name or abbreviation already exists' },
          { status: 409 }
        )
      }
    }

    // Update unit measure
    const { data: unitMeasure, error } = await supabase
      .from('unit_measures')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Unit measure not found' },
          { status: 404 }
        )
      }
      console.error('Error updating unit measure:', error)
      return NextResponse.json(
        { error: 'Failed to update unit measure' },
        { status: 500 }
      )
    }

    return NextResponse.json(unitMeasure)

  } catch (error) {
    console.error('Error in update unit measure API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Unit measure ID is required' },
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

    // Check if unit measure is being used by products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .eq('unit_measure_id', id)
      .limit(1)

    if (productsError) {
      console.error('Error checking product usage:', productsError)
      return NextResponse.json(
        { error: 'Failed to check unit measure usage' },
        { status: 500 }
      )
    }

    if (products && products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete unit measure that is being used by products' },
        { status: 409 }
      )
    }

    // Delete unit measure
    const { error } = await supabase
      .from('unit_measures')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Unit measure not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting unit measure:', error)
      return NextResponse.json(
        { error: 'Failed to delete unit measure' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Unit measure deleted successfully' })

  } catch (error) {
    console.error('Error in delete unit measure API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}