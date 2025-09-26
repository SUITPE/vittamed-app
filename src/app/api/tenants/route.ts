import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { BusinessType, getBusinessTypeConfig, BUSINESS_TYPE_CONFIGS } from '@/types/business'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching tenants:', error)
      return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })
    }

    return NextResponse.json(tenants)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // TEMPORARY: Skip auth check for testing
    const isTestMode = true

    if (!isTestMode) {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Check if user is admin (simplified check - in production you'd verify admin role)
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userProfile || userProfile.role !== 'admin_tenant') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { name, tenant_type, address, phone, email } = body

    // Validate required fields
    if (!name || !tenant_type) {
      return NextResponse.json({
        error: 'Name and tenant_type are required'
      }, { status: 400 })
    }

    // Validate tenant_type - only use existing DB types until migration is applied
    const validTypes = ['clinic', 'spa', 'consultorio'] // Legacy types that exist in current DB
    const allValidTypes = Object.keys(BUSINESS_TYPE_CONFIGS) as BusinessType[]

    if (!validTypes.includes(tenant_type) && !allValidTypes.includes(tenant_type as BusinessType)) {
      return NextResponse.json({
        error: `Invalid tenant_type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 })
    }

    // If using new business type, map to legacy type for now
    let dbTenantType = tenant_type
    if (!validTypes.includes(tenant_type)) {
      const businessConfig = getBusinessTypeConfig(tenant_type as BusinessType)
      // Map new types to legacy types based on category
      dbTenantType = businessConfig.category === 'medical' ? 'clinic' :
                    businessConfig.category === 'wellness' ? 'spa' :
                    'consultorio'
    }

    // Get business configuration for the selected type
    const businessConfig = getBusinessTypeConfig(tenant_type as BusinessType)

    // Create tenant (use mapped type for DB until migration is applied)
    const { data: tenant, error: createError } = await supabase
      .from('tenants')
      .insert({
        name,
        tenant_type: dbTenantType,
        address,
        phone,
        email
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating tenant:', createError)
      return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
    }

    // TEMPORARY: Skip admin assignment in test mode
    if (!isTestMode) {
      // Update user profile to assign as admin of new tenant
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ tenant_id: tenant.id })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        // Note: Tenant created but admin assignment failed
      }
    }

    return NextResponse.json({
      success: true,
      tenant: {
        ...tenant,
        tenant_type: tenant_type, // Return original selected type, not mapped DB type
        business_config: businessConfig
      },
      message: `${businessConfig.label} creado exitosamente${!isTestMode ? ' y admin asignado' : ''}`
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}