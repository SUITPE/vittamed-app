import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import type { ReminderConfiguration } from '@/types/catalog'

// Get effective reminder configuration for a user or tenant defaults
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    const user_id = searchParams.get('user_id')
    const config_type = searchParams.get('type') as 'user' | 'tenant' | 'effective'

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (config_type === 'effective' && user_id) {
      // Get effective configuration using the database function
      const { data: effectiveConfig, error: effectiveError } = await supabase
        .rpc('get_effective_reminder_config', {
          user_id_param: user_id,
          tenant_id_param: tenant_id
        })
        .single()

      if (effectiveError) {
        console.error('Error fetching effective config:', effectiveError)
        return NextResponse.json(
          { error: 'Failed to fetch effective configuration' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        effective_config: effectiveConfig,
        tenant_id,
        user_id
      })
    }

    // Build query based on config type
    let query = supabase
      .from('reminder_configurations')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)

    if (config_type === 'user' && user_id) {
      query = query
        .eq('applies_to', 'user_preference')
        .eq('user_id', user_id)
    } else if (config_type === 'tenant') {
      query = query
        .eq('applies_to', 'tenant_default')
        .is('user_id', null)
    }

    const { data: configurations, error: configError } = await query
      .order('created_at', { ascending: false })

    if (configError) {
      console.error('Error fetching configurations:', configError)
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      configurations: configurations || [],
      tenant_id,
      config_type: config_type || 'all'
    })

  } catch (error) {
    console.error('Error in reminder configurations API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create or update reminder configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      tenant_id,
      applies_to,
      user_id,
      email_enabled,
      sms_enabled,
      whatsapp_enabled,
      email_hours_before,
      sms_hours_before,
      whatsapp_hours_before,
      send_multiple_reminders,
      max_reminders
    } = body

    // Validate required fields
    if (!tenant_id || !applies_to) {
      return NextResponse.json(
        { error: 'tenant_id and applies_to are required' },
        { status: 400 }
      )
    }

    // Validate applies_to constraints
    if (applies_to === 'tenant_default' && user_id) {
      return NextResponse.json(
        { error: 'user_id must be null for tenant_default configurations' },
        { status: 400 }
      )
    }

    if (applies_to === 'user_preference' && !user_id) {
      return NextResponse.json(
        { error: 'user_id is required for user_preference configurations' },
        { status: 400 }
      )
    }

    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Authorization checks
    if (applies_to === 'tenant_default' && userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant admins can manage default configurations' },
        { status: 403 }
      )
    }

    if (applies_to === 'user_preference' && user_id !== user.id && userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Users can only manage their own preferences' },
        { status: 403 }
      )
    }

    // Prepare configuration data
    const configData = {
      tenant_id,
      applies_to,
      user_id: applies_to === 'user_preference' ? user_id : null,
      email_enabled: email_enabled ?? true,
      sms_enabled: sms_enabled ?? false,
      whatsapp_enabled: whatsapp_enabled ?? false,
      email_hours_before: email_hours_before ?? 24,
      sms_hours_before: sms_hours_before ?? 2,
      whatsapp_hours_before: whatsapp_hours_before ?? 4,
      send_multiple_reminders: send_multiple_reminders ?? false,
      max_reminders: max_reminders ?? 1,
      is_active: true
    }

    // Use upsert to handle both create and update
    const { data: configuration, error: configError } = await supabase
      .from('reminder_configurations')
      .upsert(configData, {
        onConflict: 'tenant_id,user_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (configError) {
      console.error('Error creating/updating configuration:', configError)
      return NextResponse.json(
        { error: 'Failed to save configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(configuration, { status: 201 })

  } catch (error) {
    console.error('Error in reminder configuration creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update existing reminder configuration
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      id,
      email_enabled,
      sms_enabled,
      whatsapp_enabled,
      email_hours_before,
      sms_hours_before,
      whatsapp_hours_before,
      send_multiple_reminders,
      max_reminders,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get existing configuration for authorization check
    const { data: existingConfig, error: fetchError } = await supabase
      .from('reminder_configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== existingConfig.tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Authorization checks
    if (existingConfig.applies_to === 'tenant_default' && userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant admins can update default configurations' },
        { status: 403 }
      )
    }

    if (existingConfig.applies_to === 'user_preference' &&
        existingConfig.user_id !== user.id &&
        userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Users can only update their own preferences' },
        { status: 403 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {}
    if (email_enabled !== undefined) updateData.email_enabled = email_enabled
    if (sms_enabled !== undefined) updateData.sms_enabled = sms_enabled
    if (whatsapp_enabled !== undefined) updateData.whatsapp_enabled = whatsapp_enabled
    if (email_hours_before !== undefined) updateData.email_hours_before = email_hours_before
    if (sms_hours_before !== undefined) updateData.sms_hours_before = sms_hours_before
    if (whatsapp_hours_before !== undefined) updateData.whatsapp_hours_before = whatsapp_hours_before
    if (send_multiple_reminders !== undefined) updateData.send_multiple_reminders = send_multiple_reminders
    if (max_reminders !== undefined) updateData.max_reminders = max_reminders
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedConfig, error: updateError } = await supabase
      .from('reminder_configurations')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating configuration:', updateError)
      return NextResponse.json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedConfig)

  } catch (error) {
    console.error('Error updating reminder configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete reminder configuration
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Configuration ID is required' },
        { status: 400 }
      )
    }

    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get existing configuration for authorization check
    const { data: existingConfig, error: fetchError } = await supabase
      .from('reminder_configurations')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingConfig) {
      return NextResponse.json(
        { error: 'Configuration not found' },
        { status: 404 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== existingConfig.tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Authorization checks
    if (existingConfig.applies_to === 'tenant_default' && userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant admins can delete default configurations' },
        { status: 403 }
      )
    }

    if (existingConfig.applies_to === 'user_preference' &&
        existingConfig.user_id !== user.id &&
        userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Users can only delete their own preferences' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('reminder_configurations')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting configuration:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Configuration deleted successfully' })

  } catch (error) {
    console.error('Error deleting reminder configuration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}