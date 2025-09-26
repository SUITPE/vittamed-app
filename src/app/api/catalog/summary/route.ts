import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/auth'
import { CatalogSummary } from '@/types/catalog'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
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

    // Get products statistics
    const { data: productsStats, error: productsError } = await supabase
      .from('products')
      .select('id, is_active, stock_quantity, min_stock_level')
      .eq('tenant_id', profile.tenant_id)

    if (productsError) {
      console.error('Error fetching products stats:', productsError)
      return NextResponse.json(
        { error: 'Failed to fetch products statistics' },
        { status: 500 }
      )
    }

    // Get services statistics
    const { data: servicesStats, error: servicesError } = await supabase
      .from('services')
      .select('id, is_active, is_featured')
      .eq('tenant_id', profile.tenant_id)

    if (servicesError) {
      console.error('Error fetching services stats:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch services statistics' },
        { status: 500 }
      )
    }

    // Get product categories count
    const { count: productCategoriesCount, error: productCategoriesError } = await supabase
      .from('product_categories')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (productCategoriesError) {
      console.error('Error fetching product categories count:', productCategoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch categories statistics' },
        { status: 500 }
      )
    }

    // Get service categories count
    const { count: serviceCategoriesCount, error: serviceCategoriesError } = await supabase
      .from('service_categories')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (serviceCategoriesError) {
      console.error('Error fetching service categories count:', serviceCategoriesError)
      return NextResponse.json(
        { error: 'Failed to fetch service categories statistics' },
        { status: 500 }
      )
    }

    // Get brands count
    const { count: brandsCount, error: brandsError } = await supabase
      .from('product_brands')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)

    if (brandsError) {
      console.error('Error fetching brands count:', brandsError)
      return NextResponse.json(
        { error: 'Failed to fetch brands statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalProducts = productsStats?.length || 0
    const activeProducts = productsStats?.filter(p => p.is_active).length || 0
    const lowStockProducts = productsStats?.filter(p =>
      p.is_active && p.stock_quantity <= p.min_stock_level
    ).length || 0

    const totalServices = servicesStats?.length || 0
    const activeServices = servicesStats?.filter(s => s.is_active).length || 0
    const featuredServices = servicesStats?.filter(s => s.is_featured && s.is_active).length || 0

    const totalCategories = (productCategoriesCount || 0) + (serviceCategoriesCount || 0)

    const summary: CatalogSummary = {
      total_products: totalProducts,
      total_services: totalServices,
      active_products: activeProducts,
      active_services: activeServices,
      low_stock_products: lowStockProducts,
      featured_services: featuredServices,
      total_categories: totalCategories,
      total_brands: brandsCount || 0
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Error in catalog summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}