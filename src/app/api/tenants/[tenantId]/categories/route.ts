import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { executeCategoryFlow } from '@/flows/CategoryManagementFlow'

/**
 * GET /api/tenants/[tenantId]/categories
 * Get all categories for a specific tenant (with optional global categories)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    console.log('[Tenant Categories API GET] Fetching categories for tenant:', tenantId)

    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const includeGlobal = searchParams.get('include_global') !== 'false' // Default true

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verify user belongs to this tenant
    if (user.profile?.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'No autorizado para acceder a este negocio' },
        { status: 403 }
      )
    }

    // Build query for tenant-specific categories
    let query = supabase
      .from('service_categories')
      .select('*')
      .order('name', { ascending: true })

    // Filter by tenant_id OR global categories (tenant_id IS NULL)
    if (includeGlobal) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    } else {
      query = query.eq('tenant_id', tenantId)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply active filter
    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('[Tenant Categories API GET] Supabase error:', error)
      return NextResponse.json(
        { error: 'Error al obtener categorías' },
        { status: 500 }
      )
    }

    console.log(`[Tenant Categories API GET] Found ${categories?.length || 0} categories`)
    return NextResponse.json(categories || [])

  } catch (error) {
    console.error('[Tenant Categories API GET] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/tenants/[tenantId]/categories
 * Create a new category for a specific tenant using Context7 flow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
    console.log('[Tenant Categories API POST] Creating category for tenant:', tenantId)

    // Verify user authentication
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Verify user belongs to this tenant
    if (user.profile?.tenant_id !== tenantId) {
      return NextResponse.json(
        { error: 'No autorizado para crear categorías en este negocio' },
        { status: 403 }
      )
    }

    // Check role permissions
    if (!['admin_tenant', 'staff'].includes(user.profile?.role || '')) {
      return NextResponse.json(
        { error: 'Permisos insuficientes para crear categorías' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'El nombre de la categoría es requerido' },
        { status: 400 }
      )
    }

    // Validate name length
    if (name.length > 255) {
      return NextResponse.json(
        { error: 'El nombre debe tener menos de 255 caracteres' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseServerClient()

    // Check for duplicate name within tenant
    const { data: existingCategories } = await supabase
      .from('service_categories')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('name', name.trim())
      .limit(1)

    if (existingCategories && existingCategories.length > 0) {
      return NextResponse.json(
        { error: `Una categoría con el nombre "${name}" ya existe en tu negocio` },
        { status: 409 }
      )
    }

    // Use admin client to bypass RLS for INSERT
    console.log('[Tenant Categories API POST] Creating category with admin client')
    const adminClient = await createAdminClient()

    // Insert the category
    const { data: category, error } = await adminClient
      .from('service_categories')
      .insert({
        tenant_id: tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        is_active: true,
        parent_id: null
      })
      .select()
      .single()

    if (error) {
      console.error('[Tenant Categories API POST] Supabase error:', error)
      return NextResponse.json(
        { error: 'Error al crear categoría' },
        { status: 500 }
      )
    }

    console.log('[Tenant Categories API POST] Category created successfully:', category.id)
    return NextResponse.json(category, { status: 201 })

  } catch (error: any) {
    console.error('[Tenant Categories API POST] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
