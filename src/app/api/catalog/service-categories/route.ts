import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { CreateCategoryData } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const parentId = searchParams.get('parent_id')
    const includeHierarchy = searchParams.get('include_hierarchy') === 'true'

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let selectQuery = '*'
    if (includeHierarchy) {
      selectQuery = `
        *,
        parent:parent_id (
          id,
          name,
          description
        ),
        children:service_categories!parent_id (
          id,
          name,
          description,
          is_active
        )
      `
    }

    // Build query for service categories
    let query = supabase
      .from('service_categories')
      .select(selectQuery)
      .order('name', { ascending: true })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply active filter
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Apply parent filter (null for root categories)
    if (parentId === 'null' || parentId === '') {
      query = query.is('parent_id', null)
    } else if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching service categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch service categories' },
        { status: 500 }
      )
    }

    return NextResponse.json(categories)

  } catch (error) {
    console.error('Error in service categories API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

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

    if (!profile || !['admin_tenant', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    const data: CreateCategoryData & { tenant_id?: string } = await request.json()

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    // Auto-assign tenant_id from user profile if not provided
    const tenantId = data.tenant_id || profile.tenant_id

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this tenant
    if (profile.tenant_id && profile.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'Forbidden - cannot create categories for other tenants' },
        { status: 403 }
      )
    }

    // If parent_id is provided, validate it exists
    if (data.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('service_categories')
        .select('id, name, tenant_id')
        .eq('id', data.parent_id)
        .eq('is_active', true)
        .single()

      if (parentError || !parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found or inactive' },
          { status: 400 }
        )
      }

      // Verify parent belongs to same tenant or is global
      if (parentCategory.tenant_id && parentCategory.tenant_id !== tenantId) {
        return NextResponse.json(
          { error: 'Parent category must belong to the same tenant' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate name within the same tenant
    let duplicateQuery = supabase
      .from('service_categories')
      .select('id')
      .eq('name', data.name)
      .eq('tenant_id', tenantId)

    if (data.parent_id) {
      duplicateQuery = duplicateQuery.eq('parent_id', data.parent_id)
    } else {
      duplicateQuery = duplicateQuery.is('parent_id', null)
    }

    const { data: existing } = await duplicateQuery.single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists in your business' },
        { status: 409 }
      )
    }

    // Create category with tenant_id
    const { data: category, error } = await supabase
      .from('service_categories')
      .insert({
        name: data.name,
        description: data.description || null,
        parent_id: data.parent_id || null,
        tenant_id: tenantId,
        is_active: data.is_active ?? true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service category:', error)
      return NextResponse.json(
        { error: 'Failed to create service category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category, { status: 201 })

  } catch (error) {
    console.error('Error in create service category API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}