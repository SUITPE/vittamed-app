import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  try {
    const user = await customAuth.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      tenantId,
      recipientEmail,
      recipientPhone,
      type,
      subject,
      content,
      appointmentId
    } = await request.json()

    if (!tenantId || !type || !subject || !content) {
      return NextResponse.json(
        { error: 'tenantId, type, subject, and content are required' },
        { status: 400 }
      )
    }

    if (!recipientEmail && !recipientPhone) {
      return NextResponse.json(
        { error: 'Either recipientEmail or recipientPhone is required' },
        { status: 400 }
      )
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        tenant_id: tenantId,
        type,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone,
        subject,
        content,
        appointment_id: appointmentId,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      )
    }

    const processResponse = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/notifications/process`,
      { method: 'POST' }
    )

    if (!processResponse.ok) {
      console.warn('Failed to trigger notification processing, but notification was queued')
    }

    return NextResponse.json({
      success: true,
      notificationId: notification.id
    })

  } catch (error) {
    console.error('Error in send notification endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}