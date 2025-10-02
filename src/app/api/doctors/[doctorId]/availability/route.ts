import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('🔍 Fetching doctor availability for:', { doctorId })

    // Get doctor's tenant_id from custom_users
    const { data: doctorProfile, error: profileError } = await supabase
      .from('custom_users')
      .select('id, email, tenant_id, role')
      .eq('id', doctorId)
      .single()

    console.log('🔍 Doctor profile query result:', {
      data: doctorProfile,
      error: profileError,
      doctorId,
      hasTenantId: !!doctorProfile?.tenant_id,
      tenantIdValue: doctorProfile?.tenant_id
    })

    if (profileError) {
      console.error('❌ Error fetching doctor profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch doctor profile', details: profileError.message }, { status: 500 })
    }

    if (!doctorProfile?.tenant_id) {
      console.log('⚠️ Doctor not assigned to any tenant', { doctorProfile })
      return NextResponse.json([])
    }

    const tenantId = doctorProfile.tenant_id

    // Get doctor_tenant entry
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    console.log('🔍 Doctor tenant query result:', {
      data: doctorTenant,
      error: dtError,
      doctorId,
      tenantId
    })

    if (dtError || !doctorTenant) {
      console.log('⚠️ Doctor tenant relationship not found')
      return NextResponse.json([])
    }

    // Fetch doctor_availability using doctor_tenant_id
    const { data: availability, error } = await supabase
      .from('doctor_availability')
      .select('*')
      .eq('doctor_tenant_id', doctorTenant.id)
      .order('day_of_week', { ascending: true })

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 })
    }

    return NextResponse.json(availability || [])

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { blocks } = await request.json()

    if (!Array.isArray(blocks)) {
      return NextResponse.json(
        { error: 'blocks array is required' },
        { status: 400 }
      )
    }

    // Get doctor's tenant_id
    const { data: doctorProfile, error: profileError } = await supabase
      .from('custom_users')
      .select('id, email, tenant_id, role')
      .eq('id', doctorId)
      .single()

    if (profileError || !doctorProfile?.tenant_id) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const tenantId = doctorProfile.tenant_id

    // Get doctor_tenant entry
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (dtError || !doctorTenant) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    // Delete all existing availability for this doctor
    await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_tenant_id', doctorTenant.id)

    // Insert new blocks
    if (blocks.length > 0) {
      const insertBlocks = blocks.map((block: any) => ({
        doctor_tenant_id: doctorTenant.id,
        day_of_week: block.day,
        start_time: block.startTime,
        end_time: block.endTime,
        created_at: new Date().toISOString()
      }))

      const { error: insertError } = await supabase
        .from('doctor_availability')
        .insert(insertBlocks)

      if (insertError) {
        console.error('Error inserting availability blocks:', insertError)
        return NextResponse.json({ error: 'Failed to save availability' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, blocksCreated: blocks.length })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { day_of_week, start_time, end_time, lunch_start, lunch_end } = await request.json()

    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'day_of_week, start_time, and end_time are required' },
        { status: 400 }
      )
    }

    // Get doctor's tenant_id
    const { data: doctorProfile, error: profileError } = await supabase
      .from('custom_users')
      .select('id, email, tenant_id, role')
      .eq('id', doctorId)
      .single()

    console.log('🔍 PUT - Doctor profile query result:', {
      data: doctorProfile,
      error: profileError,
      doctorId,
      hasTenantId: !!doctorProfile?.tenant_id,
      tenantIdValue: doctorProfile?.tenant_id
    })

    if (profileError) {
      console.error('❌ Error fetching doctor profile:', profileError)
      return NextResponse.json({ error: 'Failed to fetch doctor profile', details: profileError.message }, { status: 500 })
    }

    if (!doctorProfile?.tenant_id) {
      console.log('⚠️ PUT - Doctor not assigned to any tenant', { doctorProfile })
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const tenantId = doctorProfile.tenant_id

    // Get doctor_tenant entry
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (dtError || !doctorTenant) {
      console.log('⚠️ PUT - Doctor tenant relationship not found')
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const { data: existing } = await supabase
      .from('doctor_availability')
      .select('id')
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('day_of_week', day_of_week)
      .single()

    let result

    if (existing) {
      result = await supabase
        .from('doctor_availability')
        .update({
          start_time,
          end_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('doctor_availability')
        .insert({
          doctor_tenant_id: doctorTenant.id,
          day_of_week,
          start_time,
          end_time,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Error updating availability:', result.error)
      return NextResponse.json({ error: 'Failed to update availability' }, { status: 500 })
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  const { doctorId } = await params
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.id !== doctorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dayOfWeek = searchParams.get('day_of_week') || searchParams.get('day')

    if (!dayOfWeek) {
      return NextResponse.json(
        { error: 'day_of_week or day parameter is required' },
        { status: 400 }
      )
    }

    // Get doctor's tenant_id
    const { data: doctorProfile, error: profileError } = await supabase
      .from('custom_users')
      .select('id, email, tenant_id, role')
      .eq('id', doctorId)
      .single()

    if (profileError || !doctorProfile?.tenant_id) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    // Get doctor_tenant entry
    const { data: doctorTenant, error: dtError } = await supabase
      .from('doctor_tenants')
      .select('id')
      .eq('doctor_id', doctorId)
      .eq('tenant_id', doctorProfile.tenant_id)
      .eq('is_active', true)
      .single()

    if (dtError || !doctorTenant) {
      return NextResponse.json({ error: 'Doctor not assigned to any tenant' }, { status: 404 })
    }

    const { error } = await supabase
      .from('doctor_availability')
      .delete()
      .eq('doctor_tenant_id', doctorTenant.id)
      .eq('day_of_week', parseInt(dayOfWeek))

    if (error) {
      console.error('Error deleting availability:', error)
      return NextResponse.json({ error: 'Failed to delete availability' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}