import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { CreateServiceData, ServiceFilters } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: ServiceFilters = {
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category_id') || undefined,
      service_type: searchParams.get('service_type') as any || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      is_featured: searchParams.get('is_featured') ? searchParams.get('is_featured') === 'true' : undefined,
      min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
      max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
      requires_appointment: searchParams.get('requires_appointment') ? searchParams.get('requires_appointment') === 'true' : undefined
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

    // Build select query with optional relations
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

    // Build base query
    let query = supabase
      .from('services')
      .select(selectQuery, { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .order('name', { ascending: true })

    // Apply filters
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,short_description.ilike.%${filters.search}%`)
    }

    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters.service_type) {
      query = query.eq('service_type', filters.service_type)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured)
    }

    if (filters.requires_appointment !== undefined) {
      query = query.eq('requires_appointment', filters.requires_appointment)
    }

    if (filters.min_price !== undefined) {
      query = query.gte('price', filters.min_price)
    }

    if (filters.max_price !== undefined) {
      query = query.lte('price', filters.max_price)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: services, error, count } = await query

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      services: services || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in services API:', error)
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

    const data: CreateServiceData = await request.json()

    // Validate required fields
    if (!data.name || !data.service_type || data.duration_minutes === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, service_type, duration_minutes' },
        { status: 400 }
      )
    }

    // Validate duration is positive
    if (data.duration_minutes <= 0) {
      return NextResponse.json(
        { error: 'Duration must be positive' },
        { status: 400 }
      )
    }

    // Validate price is non-negative if provided
    if (data.price !== undefined && data.price < 0) {
      return NextResponse.json(
        { error: 'Price must be non-negative' },
        { status: 400 }
      )
    }

    // Validate category if provided
    if (data.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('service_categories')
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

    // Validate service_type is valid
    const validServiceTypes = ['clinic', 'spa', 'consultorio', 'general']
    if (!validServiceTypes.includes(data.service_type)) {
      return NextResponse.json(
        { error: 'Invalid service type. Must be one of: clinic, spa, consultorio, general' },
        { status: 400 }
      )
    }

    // Create service
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        ...data,
        tenant_id: profile.tenant_id,
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
        requires_appointment: data.requires_appointment ?? true
      })
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
      console.error('Error creating service:', error)
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      )
    }

    return NextResponse.json(service, { status: 201 })

  } catch (error) {
    console.error('Error in create service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}