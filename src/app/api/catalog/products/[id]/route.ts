import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateProductData } from '@/types/catalog'

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
        { error: 'Product ID is required' },
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
      brand:brand_id (
        id,
        name,
        description,
        logo_url
      ),
      unit_measure:unit_measure_id (
        id,
        name,
        abbreviation,
        type
      ),
      category:category_id (
        id,
        name,
        description
      )
    `

    if (includeRelations) {
      selectQuery += `,
        images:product_images (
          id,
          image_url,
          alt_text,
          is_primary,
          sort_order
        )
      `
    }

    const { data: product, error } = await supabase
      .from('products')
      .select(selectQuery)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching product:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product' },
        { status: 500 }
      )
    }

    return NextResponse.json(product)

  } catch (error) {
    console.error('Error in product API:', error)
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
        { error: 'Product ID is required' },
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

    const updates: Partial<UpdateProductData> = await request.json()

    // Remove id and tenant_id from updates to prevent modification
    const { id: _, tenant_id: __, ...allowedUpdates } = updates as any

    // Validate numeric fields if being updated
    if (allowedUpdates.price !== undefined && allowedUpdates.price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      )
    }

    if (allowedUpdates.quantity_per_unit !== undefined && allowedUpdates.quantity_per_unit <= 0) {
      return NextResponse.json(
        { error: 'Quantity per unit must be positive' },
        { status: 400 }
      )
    }

    // Validate unit measure if being updated
    if (allowedUpdates.unit_measure_id) {
      const { data: unitMeasure, error: unitError } = await supabase
        .from('unit_measures')
        .select('id')
        .eq('id', allowedUpdates.unit_measure_id)
        .single()

      if (unitError || !unitMeasure) {
        return NextResponse.json(
          { error: 'Invalid unit measure' },
          { status: 400 }
        )
      }
    }

    // Validate brand if being updated
    if (allowedUpdates.brand_id) {
      const { data: brand, error: brandError } = await supabase
        .from('product_brands')
        .select('id')
        .eq('id', allowedUpdates.brand_id)
        .eq('is_active', true)
        .single()

      if (brandError || !brand) {
        return NextResponse.json(
          { error: 'Invalid or inactive brand' },
          { status: 400 }
        )
      }
    }

    // Validate category if being updated
    if (allowedUpdates.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('product_categories')
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

    // Check for duplicate SKU if being updated
    if (allowedUpdates.sku) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('sku', allowedUpdates.sku)
        .neq('id', id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists in your tenant' },
          { status: 409 }
        )
      }
    }

    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update(allowedUpdates)
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)
      .select(`
        *,
        brand:brand_id (
          id,
          name
        ),
        unit_measure:unit_measure_id (
          id,
          name,
          abbreviation
        ),
        category:category_id (
          id,
          name
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json(product)

  } catch (error) {
    console.error('Error in update product API:', error)
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
        { error: 'Product ID is required' },
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

    // In a real-world scenario, we might want to check if the product
    // is being used in any orders or inventory transactions before deletion
    // For now, we'll allow deletion but recommend deactivating instead

    // Delete associated images first
    const { error: imagesError } = await supabase
      .from('product_images')
      .delete()
      .eq('product_id', id)

    if (imagesError) {
      console.error('Error deleting product images:', imagesError)
      // Continue with product deletion even if image deletion fails
    }

    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('tenant_id', profile.tenant_id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Product deleted successfully' })

  } catch (error) {
    console.error('Error in delete product API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}