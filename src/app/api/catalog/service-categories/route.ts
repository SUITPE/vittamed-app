import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin_tenant', 'receptionist'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    const data: CreateCategoryData = await request.json()

    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    // If parent_id is provided, validate it exists
    if (data.parent_id) {
      const { data: parentCategory, error: parentError } = await supabase
        .from('service_categories')
        .select('id, name')
        .eq('id', data.parent_id)
        .eq('is_active', true)
        .single()

      if (parentError || !parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found or inactive' },
          { status: 400 }
        )
      }
    }

    // Check for duplicate name within the same parent
    let duplicateQuery = supabase
      .from('service_categories')
      .select('id')
      .eq('name', data.name)

    if (data.parent_id) {
      duplicateQuery = duplicateQuery.eq('parent_id', data.parent_id)
    } else {
      duplicateQuery = duplicateQuery.is('parent_id', null)
    }

    const { data: existing } = await duplicateQuery.single()

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists in the same parent category' },
        { status: 409 }
      )
    }

    // Create category
    const { data: category, error } = await supabase
      .from('service_categories')
      .insert({
        ...data,
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