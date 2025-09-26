import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import type { ScheduledReminder } from '@/types/catalog'

// Get scheduled reminders with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    const appointment_id = searchParams.get('appointment_id')
    const status = searchParams.get('status')
    const channel = searchParams.get('channel')
    const due_within_hours = searchParams.get('due_within_hours')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

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

    // Build query with joins to get appointment and patient info
    let query = supabase
      .from('scheduled_reminders')
      .select(`
        *,
        appointment:appointments(
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          patient:patients(id, first_name, last_name, email, phone),
          service:services(id, name, duration_minutes),
          doctor:doctors(id, first_name, last_name),
          assigned_member:user_profiles!appointments_assigned_member_id_fkey(id, first_name, last_name)
        )
      `, { count: 'exact' })
      .eq('tenant_id', tenant_id)

    // Apply filters
    if (appointment_id) {
      query = query.eq('appointment_id', appointment_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (channel) {
      query = query.eq('channel', channel)
    }

    // Filter reminders due within specified hours
    if (due_within_hours) {
      const now = new Date()
      const cutoffTime = new Date(now.getTime() + parseInt(due_within_hours) * 60 * 60 * 1000)
      query = query
        .lte('scheduled_send_time', cutoffTime.toISOString())
        .gte('scheduled_send_time', now.toISOString())
    }

    // Apply pagination and ordering
    const { data: reminders, error: remindersError, count } = await query
      .order('scheduled_send_time', { ascending: true })
      .range(offset, offset + limit - 1)

    if (remindersError) {
      console.error('Error fetching scheduled reminders:', remindersError)
      return NextResponse.json(
        { error: 'Failed to fetch scheduled reminders' },
        { status: 500 }
      )
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    const response = {
      reminders: reminders || [],
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_items: count || 0,
        items_per_page: limit,
        has_next_page: hasNextPage,
        has_previous_page: hasPreviousPage
      },
      filters: {
        tenant_id,
        appointment_id,
        status,
        channel,
        due_within_hours
      },
      summary: {
        total_reminders: count || 0,
        status_distribution: reminders ?
          reminders.reduce((acc, reminder) => {
            acc[reminder.status] = (acc[reminder.status] || 0) + 1
            return acc
          }, {} as Record<string, number>) : {},
        channel_distribution: reminders ?
          reminders.reduce((acc, reminder) => {
            acc[reminder.channel] = (acc[reminder.channel] || 0) + 1
            return acc
          }, {} as Record<string, number>) : {}
      }
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Error in scheduled reminders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Manually schedule a reminder for an appointment
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      appointment_id,
      tenant_id,
      channel,
      recipient,
      scheduled_send_time,
      reminder_config_id
    } = body

    // Validate required fields
    if (!appointment_id || !tenant_id || !channel || !recipient || !scheduled_send_time) {
      return NextResponse.json(
        { error: 'appointment_id, tenant_id, channel, recipient, and scheduled_send_time are required' },
        { status: 400 }
      )
    }

    // Validate channel
    if (!['email', 'sms', 'whatsapp'].includes(channel)) {
      return NextResponse.json(
        { error: 'Invalid channel. Must be email, sms, or whatsapp' },
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

    // Only staff and admin_tenant can manually schedule reminders
    if (!['admin_tenant', 'staff'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to schedule reminders' },
        { status: 403 }
      )
    }

    // Verify appointment exists and belongs to tenant
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('id, status')
      .eq('id', appointment_id)
      .eq('tenant_id', tenant_id)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Don't schedule reminders for cancelled appointments
    if (appointment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Cannot schedule reminders for cancelled appointments' },
        { status: 400 }
      )
    }

    // Create scheduled reminder
    const reminderData = {
      appointment_id,
      tenant_id,
      reminder_config_id,
      channel,
      recipient,
      scheduled_send_time,
      status: 'scheduled',
      retry_count: 0,
      max_retries: 3
    }

    const { data: reminder, error: reminderError } = await supabase
      .from('scheduled_reminders')
      .insert(reminderData)
      .select(`
        *,
        appointment:appointments(
          id,
          appointment_date,
          start_time,
          patient:patients(first_name, last_name),
          service:services(name)
        )
      `)
      .single()

    if (reminderError) {
      console.error('Error creating scheduled reminder:', reminderError)
      return NextResponse.json(
        { error: 'Failed to schedule reminder' },
        { status: 500 }
      )
    }

    return NextResponse.json(reminder, { status: 201 })

  } catch (error) {
    console.error('Error scheduling reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update scheduled reminder status
export async function PUT(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      id,
      status,
      sent_at,
      error_message,
      notification_id
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
        { status: 400 }
      )
    }

    // Validate status
    if (status && !['scheduled', 'processing', 'sent', 'failed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get current user for authorization (system operations might bypass this)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get existing reminder for authorization check
    const { data: existingReminder, error: fetchError } = await supabase
      .from('scheduled_reminders')
      .select('*, tenant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingReminder) {
      return NextResponse.json(
        { error: 'Scheduled reminder not found' },
        { status: 404 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== existingReminder.tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (sent_at !== undefined) updateData.sent_at = sent_at
    if (error_message !== undefined) updateData.error_message = error_message
    if (notification_id !== undefined) updateData.notification_id = notification_id

    // Increment retry count if status is failed
    if (status === 'failed') {
      updateData.retry_count = existingReminder.retry_count + 1
    }

    const { data: updatedReminder, error: updateError } = await supabase
      .from('scheduled_reminders')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating scheduled reminder:', updateError)
      return NextResponse.json(
        { error: 'Failed to update reminder' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedReminder)

  } catch (error) {
    console.error('Error updating scheduled reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Cancel scheduled reminder
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Reminder ID is required' },
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

    // Get existing reminder for authorization check
    const { data: existingReminder, error: fetchError } = await supabase
      .from('scheduled_reminders')
      .select('*, tenant_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingReminder) {
      return NextResponse.json(
        { error: 'Scheduled reminder not found' },
        { status: 404 }
      )
    }

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!userProfile || userProfile.tenant_id !== existingReminder.tenant_id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Only cancel if not already sent
    if (existingReminder.status === 'sent') {
      return NextResponse.json(
        { error: 'Cannot cancel reminder that has already been sent' },
        { status: 400 }
      )
    }

    // Update status to cancelled instead of deleting
    const { data: cancelledReminder, error: updateError } = await supabase
      .from('scheduled_reminders')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error cancelling reminder:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel reminder' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Reminder cancelled successfully',
      reminder: cancelledReminder
    })

  } catch (error) {
    console.error('Error cancelling scheduled reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}