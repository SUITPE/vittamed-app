import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'
import { customAuth } from '@/lib/custom-auth'
import { sendReminderNotification } from '@/lib/notifications'
import type {
  ScheduledReminder,
  EmailReminderTemplateData,
  SMSReminderTemplateData,
  ReminderNotificationData
} from '@/types/catalog'

// Process scheduled reminders that are due
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()
    const {
      tenant_id,
      limit = 50,
      test_mode = false,
      dry_run = false
    } = body

    // For security, this endpoint should be called by a scheduled job or admin
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, verify authorization
    if (!test_mode && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`Processing reminders${dry_run ? ' (DRY RUN)' : ''}...`)

    // Get reminders that are due for processing
    const now = new Date()
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
          total_amount,
          tenant:tenants(id, name, address, phone),
          patient:patients(id, first_name, last_name, email, phone),
          service:services(id, name, description, duration_minutes, price),
          doctor:doctors(id, first_name, last_name, email, phone),
          assigned_member:custom_users!appointments_assigned_member_id_fkey(id, first_name, last_name, email)
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_send_time', now.toISOString())
      .lt('retry_count', 3) // Don't process reminders that have failed too many times

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id)
    }

    const { data: reminders, error: remindersError } = await query
      .limit(limit)
      .order('scheduled_send_time', { ascending: true })

    if (remindersError) {
      console.error('Error fetching due reminders:', remindersError)
      return NextResponse.json(
        { error: 'Failed to fetch due reminders' },
        { status: 500 }
      )
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({
        message: 'No reminders due for processing',
        processed_count: 0,
        failed_count: 0,
        skipped_count: 0
      })
    }

    console.log(`Found ${reminders.length} reminders to process`)

    const results = {
      processed_count: 0,
      failed_count: 0,
      skipped_count: 0,
      results: [] as any[]
    }

    // Process each reminder
    for (const reminder of reminders) {
      try {
        const result = await processReminder(supabase, reminder, dry_run)
        results.results.push(result)

        if (result.status === 'processed') {
          results.processed_count++
        } else if (result.status === 'failed') {
          results.failed_count++
        } else {
          results.skipped_count++
        }
      } catch (error) {
        console.error(`Error processing reminder ${reminder.id}:`, error)
        results.failed_count++
        results.results.push({
          reminder_id: reminder.id,
          status: 'failed',
          error: 'Processing exception',
          details: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`Reminder processing complete:`, results)

    return NextResponse.json({
      message: `Processed ${results.processed_count} reminders successfully`,
      ...results
    }, { status: 200 })

  } catch (error) {
    console.error('Error in process reminders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Process a single reminder
async function processReminder(
  supabase: any,
  reminder: any,
  dry_run: boolean = false
): Promise<any> {
  const reminderResult = {
    reminder_id: reminder.id,
    appointment_id: reminder.appointment_id,
    channel: reminder.channel,
    recipient: reminder.recipient,
    status: 'skipped' as 'processed' | 'failed' | 'skipped',
    error: null as string | null,
    details: null as any
  }

  try {
    // Validate appointment status
    if (!reminder.appointment || reminder.appointment.status === 'cancelled') {
      reminderResult.status = 'skipped'
      reminderResult.error = 'Appointment cancelled'

      if (!dry_run) {
        // Cancel the reminder
        await supabase
          .from('scheduled_reminders')
          .update({ status: 'cancelled' })
          .eq('id', reminder.id)
      }

      return reminderResult
    }

    // Check if appointment is in the past
    const appointmentDateTime = new Date(`${reminder.appointment.appointment_date}T${reminder.appointment.start_time}`)
    const now = new Date()

    if (appointmentDateTime <= now) {
      reminderResult.status = 'skipped'
      reminderResult.error = 'Appointment in the past'

      if (!dry_run) {
        await supabase
          .from('scheduled_reminders')
          .update({ status: 'cancelled' })
          .eq('id', reminder.id)
      }

      return reminderResult
    }

    // Mark reminder as processing
    if (!dry_run) {
      await supabase
        .from('scheduled_reminders')
        .update({ status: 'processing' })
        .eq('id', reminder.id)
    }

    // Prepare notification data
    const notificationData = await buildNotificationData(reminder)

    if (!notificationData) {
      reminderResult.status = 'failed'
      reminderResult.error = 'Failed to build notification data'

      if (!dry_run) {
        await updateReminderStatus(supabase, reminder.id, 'failed', 'Failed to build notification data')
      }

      return reminderResult
    }

    // Send the reminder
    if (dry_run) {
      reminderResult.status = 'processed'
      reminderResult.details = { dry_run: true, notification_prepared: true }
      console.log(`DRY RUN: Would send ${reminder.channel} reminder to ${reminder.recipient}`)
    } else {
      const sent = await sendReminderNotification(notificationData)

      if (sent) {
        // Create notification record
        const { data: notification } = await supabase
          .from('notifications')
          .insert({
            tenant_id: reminder.tenant_id,
            user_id: reminder.appointment.patient?.user_id,
            type: 'appointment_reminder',
            title: `Recordatorio de cita - ${notificationData.templateData.service_name}`,
            message: reminder.channel === 'email'
              ? `Te recordamos tu cita ${notificationData.templateData.tenant_name}`
              : notificationData.templateData.tenant_name,
            recipient_email: reminder.channel === 'email' ? reminder.recipient : null,
            recipient_phone: reminder.channel !== 'email' ? reminder.recipient : null,
            is_read: false,
            delivery_status: 'sent',
            sent_at: new Date().toISOString()
          })
          .select('id')
          .single()

        // Update reminder status
        await updateReminderStatus(
          supabase,
          reminder.id,
          'sent',
          null,
          new Date().toISOString(),
          notification?.id
        )

        reminderResult.status = 'processed'
        reminderResult.details = { notification_id: notification?.id }
        console.log(`Successfully sent ${reminder.channel} reminder to ${reminder.recipient}`)
      } else {
        await updateReminderStatus(supabase, reminder.id, 'failed', 'Failed to send notification')
        reminderResult.status = 'failed'
        reminderResult.error = 'Failed to send notification'
      }
    }

  } catch (error) {
    console.error(`Error processing reminder ${reminder.id}:`, error)
    reminderResult.status = 'failed'
    reminderResult.error = error instanceof Error ? error.message : 'Unknown error'

    if (!dry_run) {
      await updateReminderStatus(supabase, reminder.id, 'failed', reminderResult.error)
    }
  }

  return reminderResult
}

// Build notification data from reminder
async function buildNotificationData(reminder: any): Promise<ReminderNotificationData | null> {
  try {
    const appointment = reminder.appointment
    const tenant = appointment.tenant
    const patient = appointment.patient
    const service = appointment.service
    const doctor = appointment.doctor
    const member = appointment.assigned_member

    // Calculate hours until appointment
    const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
    const now = new Date()
    const hoursUntil = Math.ceil((appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60))

    // Determine provider info
    const provider = doctor || member
    const providerName = provider
      ? `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || provider.email
      : 'Profesional asignado'
    const providerType = doctor ? 'doctor' : 'member'

    if (reminder.channel === 'email') {
      const templateData: EmailReminderTemplateData = {
        tenant_name: tenant.name,
        patient_first_name: patient.first_name,
        patient_last_name: patient.last_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.start_time,
        service_name: service.name,
        service_duration: service.duration_minutes,
        service_price: service.price,
        provider_name: providerName,
        provider_type: providerType,
        clinic_address: tenant.address,
        clinic_phone: tenant.phone,
        hours_until_appointment: hoursUntil,
        confirmation_link: process.env.NEXT_PUBLIC_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/appointments/${appointment.id}/confirm`
          : undefined,
        cancellation_link: process.env.NEXT_PUBLIC_BASE_URL
          ? `${process.env.NEXT_PUBLIC_BASE_URL}/appointments/${appointment.id}/cancel`
          : undefined
      }

      return {
        recipientEmail: reminder.recipient,
        tenantId: reminder.tenant_id,
        appointmentId: reminder.appointment_id,
        channel: 'email',
        templateData
      }
    } else {
      const templateData: SMSReminderTemplateData = {
        tenant_name: tenant.name,
        patient_first_name: patient.first_name,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.start_time,
        service_name: service.name,
        provider_name: providerName,
        clinic_phone: tenant.phone,
        hours_until_appointment: hoursUntil
      }

      return {
        recipientPhone: reminder.recipient,
        tenantId: reminder.tenant_id,
        appointmentId: reminder.appointment_id,
        channel: reminder.channel,
        templateData
      }
    }
  } catch (error) {
    console.error('Error building notification data:', error)
    return null
  }
}

// Update reminder status in database
async function updateReminderStatus(
  supabase: any,
  reminderId: string,
  status: string,
  errorMessage: string | null = null,
  sentAt: string | null = null,
  notificationId: string | null = null
) {
  const updateData: any = { status }

  if (errorMessage) updateData.error_message = errorMessage
  if (sentAt) updateData.sent_at = sentAt
  if (notificationId) updateData.notification_id = notificationId
  if (status === 'failed') {
    // Increment retry count
    const { data: currentReminder } = await supabase
      .from('scheduled_reminders')
      .select('retry_count')
      .eq('id', reminderId)
      .single()

    if (currentReminder) {
      updateData.retry_count = (currentReminder.retry_count || 0) + 1
    }
  }

  await supabase
    .from('scheduled_reminders')
    .update(updateData)
    .eq('id', reminderId)
}

// GET endpoint to check reminder processing status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')

    const supabase = await getSupabaseServerClient()

    // Get statistics about pending reminders
    let query = supabase
      .from('scheduled_reminders')
      .select('status, channel, scheduled_send_time, retry_count', { count: 'exact' })

    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id)
    }

    const { data: allReminders, count: totalCount } = await query

    // Get due reminders count
    const now = new Date()
    const { count: dueCount } = await (tenant_id
      ? supabase
          .from('scheduled_reminders')
          .select('*', { count: 'exact', head: true })
          .eq('tenant_id', tenant_id)
          .eq('status', 'scheduled')
          .lte('scheduled_send_time', now.toISOString())
          .lt('retry_count', 3)
      : supabase
          .from('scheduled_reminders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'scheduled')
          .lte('scheduled_send_time', now.toISOString())
          .lt('retry_count', 3)
    )

    // Calculate statistics
    const stats = (allReminders || []).reduce((acc, reminder) => {
      acc[reminder.status] = (acc[reminder.status] || 0) + 1
      acc[`${reminder.channel}_count`] = (acc[`${reminder.channel}_count`] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      total_reminders: totalCount || 0,
      due_for_processing: dueCount || 0,
      statistics: {
        scheduled: stats.scheduled || 0,
        processing: stats.processing || 0,
        sent: stats.sent || 0,
        failed: stats.failed || 0,
        cancelled: stats.cancelled || 0,
        email_count: stats.email_count || 0,
        sms_count: stats.sms_count || 0,
        whatsapp_count: stats.whatsapp_count || 0
      },
      last_check: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error getting reminder status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}