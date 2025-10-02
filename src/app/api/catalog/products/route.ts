import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { CreateProductData, ProductFilters } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: ProductFilters = {
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      brand_id: searchParams.get('brand_id') || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      low_stock: searchParams.get('low_stock') === 'true'
    }

    const includeRelations = searchParams.get('include_relations') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

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

    // Build select query with optional relations
    let selectQuery = `
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

    // Build base query
    let query = supabase
      .from('products')
      .select(selectQuery, { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .order('name', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.brand_id) {
      query = query.eq('brand_id', filters.brand_id)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    if (filters.low_stock) {
      // Low stock: stock_quantity <= min_stock_level
      query = query.lte('stock_quantity', 'min_stock_level')
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in products API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

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

    const data: CreateProductData = await request.json()

    // Validate required fields
    if (!data.name || !data.unit_measure_id || data.price === undefined || data.quantity_per_unit === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, unit_measure_id, price, quantity_per_unit' },
        { status: 400 }
      )
    }

    // Validate price and quantities are positive
    if (data.price < 0 || data.quantity_per_unit <= 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative and quantity_per_unit must be positive' },
        { status: 400 }
      )
    }

    // Validate unit measure exists
    const { data: unitMeasure, error: unitError } = await supabase
      .from('unit_measures')
      .select('id')
      .eq('id', data.unit_measure_id)
      .single()

    if (unitError || !unitMeasure) {
      return NextResponse.json(
        { error: 'Invalid unit measure' },
        { status: 400 }
      )
    }

    // Validate brand if provided
    if (data.brand_id) {
      const { data: brand, error: brandError } = await supabase
        .from('product_brands')
        .select('id')
        .eq('id', data.brand_id)
        .eq('is_active', true)
        .single()

      if (brandError || !brand) {
        return NextResponse.json(
          { error: 'Invalid or inactive brand' },
          { status: 400 }
        )
      }
    }

    // Validate category if provided
    if (data.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('product_categories')
        .select('id')
        .eq('id', data.category_id)
        .eq('is_active', true)
        .single()

      if (categoryError || !category) {
        return NextResponse.json(
          { error: 'Invalid or inactive category' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate SKU within the tenant if provided
    if (data.sku) {
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('tenant_id', profile.tenant_id)
        .eq('sku', data.sku)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists in your tenant' },
          { status: 409 }
        )
      }
    }

    // Generate SKU if not provided
    let sku = data.sku
    if (!sku) {
      // Generate SKU from name and timestamp
      const namePrefix = data.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
      const timestamp = Date.now().toString().slice(-6)
      sku = `${namePrefix}${timestamp}`
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...data,
        tenant_id: profile.tenant_id,
        sku,
        is_active: data.is_active ?? true,
        stock_quantity: data.stock_quantity ?? 0,
        min_stock_level: data.min_stock_level ?? 0
      })
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
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json(product, { status: 201 })

  } catch (error) {
    console.error('Error in create product API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}