import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import type { TenantBranding } from '@/types/catalog'

// Get tenant branding configuration
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')

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

    const { data: branding, error: brandingError } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .single()

    if (brandingError && brandingError.code !== 'PGRST116') {
      console.error('Error fetching tenant branding:', brandingError)
      return NextResponse.json(
        { error: 'Failed to fetch branding configuration' },
        { status: 500 }
      )
    }

    // If no branding exists, return default values
    if (!branding) {
      return NextResponse.json({
        tenant_id,
        logo_url: null,
        primary_color: '#2563eb',
        secondary_color: '#f3f4f6',
        email_from_name: null,
        email_signature: null,
        custom_footer: null,
        sms_sender_name: null,
        is_active: true,
        exists: false
      })
    }

    return NextResponse.json({
      ...branding,
      exists: true
    })

  } catch (error) {
    console.error('Error in tenant branding API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Create or update tenant branding
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      tenant_id,
      logo_url,
      primary_color,
      secondary_color,
      email_from_name,
      email_signature,
      custom_footer,
      sms_sender_name
    } = body

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

    // Only admin_tenant can manage branding
    if (userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant administrators can manage branding' },
        { status: 403 }
      )
    }

    // Prepare branding data
    const brandingData = {
      tenant_id,
      logo_url,
      primary_color: primary_color || '#2563eb',
      secondary_color: secondary_color || '#f3f4f6',
      email_from_name,
      email_signature,
      custom_footer,
      sms_sender_name,
      is_active: true
    }

    // Use upsert to handle both create and update
    const { data: branding, error: brandingError } = await supabase
      .from('tenant_branding')
      .upsert(brandingData, {
        onConflict: 'tenant_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single()

    if (brandingError) {
      console.error('Error creating/updating branding:', brandingError)
      return NextResponse.json(
        { error: 'Failed to save branding configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(branding, { status: 201 })

  } catch (error) {
    console.error('Error in tenant branding creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update existing tenant branding
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      tenant_id,
      logo_url,
      primary_color,
      secondary_color,
      email_from_name,
      email_signature,
      custom_footer,
      sms_sender_name,
      is_active
    } = body

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

    // Only admin_tenant can manage branding
    if (userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant administrators can manage branding' },
        { status: 403 }
      )
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {}
    if (logo_url !== undefined) updateData.logo_url = logo_url
    if (primary_color !== undefined) updateData.primary_color = primary_color
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color
    if (email_from_name !== undefined) updateData.email_from_name = email_from_name
    if (email_signature !== undefined) updateData.email_signature = email_signature
    if (custom_footer !== undefined) updateData.custom_footer = custom_footer
    if (sms_sender_name !== undefined) updateData.sms_sender_name = sms_sender_name
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedBranding, error: updateError } = await supabase
      .from('tenant_branding')
      .update(updateData)
      .eq('tenant_id', tenant_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating branding:', updateError)
      return NextResponse.json(
        { error: 'Failed to update branding configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedBranding)

  } catch (error) {
    console.error('Error updating tenant branding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete tenant branding (reset to defaults)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')

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

    // Only admin_tenant can manage branding
    if (userProfile.role !== 'admin_tenant') {
      return NextResponse.json(
        { error: 'Only tenant administrators can manage branding' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from('tenant_branding')
      .delete()
      .eq('tenant_id', tenant_id)

    if (deleteError) {
      console.error('Error deleting branding:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete branding configuration' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Branding configuration reset to defaults' })

  } catch (error) {
    console.error('Error deleting tenant branding:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}