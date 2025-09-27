import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { sendEmailNotification, sendWhatsAppNotification } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  try {
    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Error fetching notifications:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const results = []

    for (const notification of pendingNotifications) {
      try {
        await supabase
          .from('notifications')
          .update({ status: 'processing', updated_at: new Date().toISOString() })
          .eq('id', notification.id)

        let emailSent = false
        let whatsappSent = false

        if (notification.recipient_email) {
          emailSent = await sendEmailNotification({
            recipientEmail: notification.recipient_email,
            subject: notification.subject,
            content: notification.content,
            type: notification.type as any
          })
        }

        if (notification.recipient_phone) {
          whatsappSent = await sendWhatsAppNotification({
            recipientPhone: notification.recipient_phone,
            subject: notification.subject,
            content: notification.content,
            type: notification.type as any
          })
        }

        const finalStatus = (emailSent || whatsappSent) ? 'sent' : 'failed'

        await supabase
          .from('notifications')
          .update({
            status: finalStatus,
            sent_at: finalStatus === 'sent' ? new Date().toISOString() : null,
            error_message: finalStatus === 'failed' ? 'Failed to send notification' : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          status: finalStatus,
          emailSent,
          whatsappSent
        })

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error)

        await supabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', notification.id)

        results.push({
          id: notification.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      processed: results.length,
      results
    })

  } catch (error) {
    console.error('Error in notification processing endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient()
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'

    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: notifications, error } = await query

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    return NextResponse.json({ notifications })

  } catch (error) {
    console.error('Error in notification status endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}