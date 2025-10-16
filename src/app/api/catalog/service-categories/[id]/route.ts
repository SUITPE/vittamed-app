import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'
import { UpdateCategoryData } from '@/types/catalog'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeHierarchy = searchParams.get('include_hierarchy') === 'true'

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
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

    const { data: category, error } = await supabase
      .from('service_categories')
      .select(selectQuery)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching service category:', error)
      return NextResponse.json(
        { error: 'Failed to fetch service category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)

  } catch (error) {
    console.error('Error in service category API:', error)
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
        { error: 'Category ID is required' },
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

    const updates: Partial<UpdateCategoryData> = await request.json()

    // Remove id from updates to prevent modification
    const { id: _, ...allowedUpdates } = updates

    // If parent_id is being updated, validate it exists and prevent circular reference
    if (allowedUpdates.parent_id !== undefined) {
      if (allowedUpdates.parent_id) {
        // Check if parent exists and is active
        const { data: parentCategory, error: parentError } = await supabase
          .from('service_categories')
          .select('id, name')
          .eq('id', allowedUpdates.parent_id)
          .eq('is_active', true)
          .single()

        if (parentError || !parentCategory) {
          return NextResponse.json(
            { error: 'Parent category not found or inactive' },
            { status: 400 }
          )
        }

        // Prevent setting parent to self or descendant (circular reference)
        if (allowedUpdates.parent_id === id) {
          return NextResponse.json(
            { error: 'Category cannot be its own parent' },
            { status: 400 }
          )
        }

        // Check for circular reference by getting all descendants
        const checkCircular = async (categoryId: string, targetParentId: string): Promise<boolean> => {
          const { data: children } = await supabase
            .from('service_categories')
            .select('id')
            .eq('parent_id', categoryId)

          if (!children) return false

          for (const child of children) {
            if (child.id === targetParentId) return true
            if (await checkCircular(child.id, targetParentId)) return true
          }
          return false
        }

        const hasCircular = await checkCircular(id, allowedUpdates.parent_id)
        if (hasCircular) {
          return NextResponse.json(
            { error: 'Cannot create circular reference in category hierarchy' },
            { status: 400 }
          )
        }
      }
    }

    // Check for duplicate name if being updated
    if (allowedUpdates.name) {
      const currentCategory = await supabase
        .from('service_categories')
        .select('parent_id')
        .eq('id', id)
        .single()

      if (!currentCategory.data) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }

      const parentId = allowedUpdates.parent_id !== undefined
        ? allowedUpdates.parent_id
        : currentCategory.data.parent_id

      let duplicateQuery = supabase
        .from('service_categories')
        .select('id')
        .eq('name', allowedUpdates.name)
        .neq('id', id)

      if (parentId) {
        duplicateQuery = duplicateQuery.eq('parent_id', parentId)
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
    }

    // Update category
    const { data: category, error } = await supabase
      .from('service_categories')
      .update(allowedUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('Error updating service category:', error)
      return NextResponse.json(
        { error: 'Failed to update service category' },
        { status: 500 }
      )
    }

    return NextResponse.json(category)

  } catch (error) {
    console.error('Error in update service category API:', error)
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
        { error: 'Category ID is required' },
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
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin_tenant', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - admin or staff access required' },
        { status: 403 }
      )
    }

    // Check if category is being used by services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (servicesError) {
      console.error('Error checking service usage:', servicesError)
      return NextResponse.json(
        { error: 'Failed to check category usage' },
        { status: 500 }
      )
    }

    if (services && services.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that is being used by services. Consider deactivating it instead.' },
        { status: 409 }
      )
    }

    // Check if category has child categories
    const { data: children, error: childrenError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('parent_id', id)
      .limit(1)

    if (childrenError) {
      console.error('Error checking child categories:', childrenError)
      return NextResponse.json(
        { error: 'Failed to check child categories' },
        { status: 500 }
      )
    }

    if (children && children.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has child categories. Delete or move child categories first.' },
        { status: 409 }
      )
    }

    // Get the category first to verify tenant ownership
    const { data: categoryToDelete } = await supabase
      .from('service_categories')
      .select('id, name, tenant_id')
      .eq('id', id)
      .single()

    if (!categoryToDelete) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Verify user can delete this category (must own the tenant)
    if (categoryToDelete.tenant_id && categoryToDelete.tenant_id !== profile.tenant_id) {
      return NextResponse.json(
        { error: 'Forbidden - you can only delete categories from your own tenant' },
        { status: 403 }
      )
    }

    // Use admin client to bypass RLS for deletion
    console.log('[DELETE Category] Attempting to delete category:', id)
    const adminClient = await createAdminClient()

    const { data: deletedData, error } = await adminClient
      .from('service_categories')
      .delete()
      .eq('id', id)
      .select()

    console.log('[DELETE Category] Delete result:', { deletedData, error })

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        )
      }
      console.error('[DELETE Category] Error deleting service category:', error)
      return NextResponse.json(
        { error: 'Failed to delete service category: ' + error.message },
        { status: 500 }
      )
    }

    if (!deletedData || deletedData.length === 0) {
      console.warn('[DELETE Category] No rows deleted for id:', id)
      return NextResponse.json(
        { error: 'Category not found or could not be deleted' },
        { status: 404 }
      )
    }

    console.log('[DELETE Category] Successfully deleted category:', id)
    return NextResponse.json({
      message: 'Service category deleted successfully',
      deleted: deletedData[0]
    })

  } catch (error) {
    console.error('Error in delete service category API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}