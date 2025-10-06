import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { customAuth } from '@/lib/custom-auth'

// GET /api/tenants/:tenantId/features - Get all features for a tenant
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current user
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user belongs to this tenant
    if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all feature flags
    const { data: allFeatures, error: featuresError } = await supabase
      .from('feature_flags')
      .select('*')
      .order('category', { ascending: true })
      .order('feature_name', { ascending: true })

    if (featuresError) {
      console.error('Error fetching feature flags:', featuresError)
      return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 })
    }

    // Get tenant's subscription plan
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('subscription_plan_key')
      .eq('id', tenantId)
      .single()

    if (tenantError) {
      console.error('Error fetching tenant:', tenantError)
      return NextResponse.json({ error: 'Failed to fetch tenant' }, { status: 500 })
    }

    // Get features included in the plan
    const { data: planFeatures, error: planError } = await supabase
      .from('plan_features')
      .select('feature_key, is_included')
      .eq('plan_key', tenant.subscription_plan_key || 'free')

    if (planError) {
      console.error('Error fetching plan features:', planError)
      return NextResponse.json({ error: 'Failed to fetch plan features' }, { status: 500 })
    }

    // Get tenant-specific feature overrides
    const { data: tenantFeatures, error: tenantFeaturesError } = await supabase
      .from('tenant_features')
      .select('feature_key, is_enabled')
      .eq('tenant_id', tenantId)

    if (tenantFeaturesError) {
      console.error('Error fetching tenant features:', tenantFeaturesError)
      return NextResponse.json({ error: 'Failed to fetch tenant features' }, { status: 500 })
    }

    // Build feature map
    const planFeaturesMap = new Map(planFeatures?.map(pf => [pf.feature_key, pf.is_included]) || [])
    const tenantFeaturesMap = new Map(tenantFeatures?.map(tf => [tf.feature_key, tf.is_enabled]) || [])

    // Combine all data
    const featuresWithStatus = allFeatures?.map(feature => {
      const isAvailableInPlan = planFeaturesMap.get(feature.feature_key) || false
      const tenantOverride = tenantFeaturesMap.get(feature.feature_key)
      const isEnabled = tenantOverride !== undefined ? tenantOverride : isAvailableInPlan

      return {
        ...feature,
        is_enabled: isEnabled,
        is_available_in_plan: isAvailableInPlan
      }
    })

    return NextResponse.json({
      features: featuresWithStatus,
      subscription_plan: tenant.subscription_plan_key
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tenants/:tenantId/features - Toggle a feature for a tenant
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get current user
    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admin_tenant or super_admin can toggle features
    if (user.profile?.role !== 'admin_tenant' && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Check if user belongs to this tenant (unless super admin)
    if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { feature_key, is_enabled, notes } = body

    if (!feature_key || typeof is_enabled !== 'boolean') {
      return NextResponse.json({
        error: 'Missing required fields: feature_key, is_enabled'
      }, { status: 400 })
    }

    // Use the set_tenant_feature function
    const { error: functionError } = await supabase.rpc('set_tenant_feature', {
      p_tenant_id: tenantId,
      p_feature_key: feature_key,
      p_is_enabled: is_enabled,
      p_notes: notes || null
    })

    if (functionError) {
      console.error('Error toggling feature:', functionError)
      return NextResponse.json({ error: 'Failed to toggle feature' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Feature ${feature_key} ${is_enabled ? 'enabled' : 'disabled'} successfully`
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
