import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { CreateMemberServiceData, MemberServiceFilters } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: MemberServiceFilters = {
      member_user_id: searchParams.get('member_user_id') || undefined,
      service_id: searchParams.get('service_id') || undefined,
      tenant_id: searchParams.get('tenant_id') || undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      search: searchParams.get('search') || undefined
    }

    const includeRelations = searchParams.get('include_relations') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's tenant and role
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
      services!inner(
        id,
        name,
        description,
        duration_minutes,
        price,
        is_active
      )
    `

    if (includeRelations) {
      selectQuery += `,
        user_profiles!member_services_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `
    }

    // Build base query
    let query = supabase
      .from('member_services')
      .select(selectQuery, { count: 'exact' })
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.member_user_id) {
      query = query.eq('member_user_id', filters.member_user_id)
    }

    if (filters.service_id) {
      query = query.eq('service_id', filters.service_id)
    }

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    // Search in member name or service name
    if (filters.search) {
      query = query.or(`services.name.ilike.%${filters.search}%,user_profiles.first_name.ilike.%${filters.search}%,user_profiles.last_name.ilike.%${filters.search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: memberServices, error, count } = await query

    if (error) {
      console.error('Error fetching member services:', error)
      return NextResponse.json(
        { error: 'Failed to fetch member services' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      member_services: memberServices || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in member services API:', error)
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
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

    const data: CreateMemberServiceData = await request.json()

    // Validate required fields
    if (!data.member_user_id || !data.service_id) {
      return NextResponse.json(
        { error: 'Missing required fields: member_user_id, service_id' },
        { status: 400 }
      )
    }

    // Verify the member exists and has role 'member' in this tenant
    const { data: member, error: memberError } = await supabase
      .from('user_profiles')
      .select('id, role, tenant_id')
      .eq('id', data.member_user_id)
      .eq('role', 'member')
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { error: 'Invalid member or member not found in your tenant' },
        { status: 400 }
      )
    }

    // Verify the service exists and belongs to this tenant
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('id, tenant_id, is_active')
      .eq('id', data.service_id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Invalid service or service not found in your tenant' },
        { status: 400 }
      )
    }

    // Check if association already exists
    const { data: existing } = await supabase
      .from('member_services')
      .select('id')
      .eq('member_user_id', data.member_user_id)
      .eq('service_id', data.service_id)
      .eq('tenant_id', profile.tenant_id)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Member is already assigned to this service' },
        { status: 409 }
      )
    }

    // Create member-service association
    const { data: memberService, error } = await supabase
      .from('member_services')
      .insert({
        ...data,
        tenant_id: profile.tenant_id,
        is_active: data.is_active ?? true
      })
      .select(`
        *,
        services!inner(
          id,
          name,
          description,
          duration_minutes,
          price
        ),
        user_profiles!member_services_member_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error creating member service:', error)
      return NextResponse.json(
        { error: 'Failed to create member service association' },
        { status: 500 }
      )
    }

    return NextResponse.json(memberService, { status: 201 })

  } catch (error) {
    console.error('Error in create member service API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}