import nodemailer from 'nodemailer'
// @ts-expect-error - Twilio types not available
import twilio from 'twilio'
import { generateReminderEmailTemplate, generateReminderSMSTemplate, getTenantBranding } from './reminder-templates'
import type { EmailReminderTemplateData, SMSReminderTemplateData, TenantBranding } from '@/types/catalog'

const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export interface NotificationData {
  recipientEmail?: string
  recipientPhone?: string
  subject: string
  content: string
  type: 'appointment_confirmation' | 'appointment_reminder' | 'payment_success' | 'payment_failed' | 'appointment_cancelled'
}

export interface ReminderNotificationData {
  recipientEmail?: string
  recipientPhone?: string
  tenantId: string
  appointmentId: string
  channel: 'email' | 'sms' | 'whatsapp'
  templateData: EmailReminderTemplateData | SMSReminderTemplateData
}

export async function sendEmailNotification(data: NotificationData): Promise<boolean> {
  if (!data.recipientEmail || !process.env.EMAIL_USER) {
    console.warn('Email configuration missing')
    return false
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.recipientEmail,
      subject: data.subject,
      html: generateEmailTemplate(data),
    }

    await emailTransporter.sendMail(mailOptions)
    console.log('Email sent successfully to:', data.recipientEmail)
    return true
  } catch (error) {
    console.error('Error sending email:', error)
    return false
  }
}

export async function sendWhatsAppNotification(data: NotificationData): Promise<boolean> {
  if (!data.recipientPhone || !twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('WhatsApp configuration missing')
    return false
  }

  try {
    const message = await twilioClient.messages.create({
      body: data.content,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${data.recipientPhone}`,
    })

    console.log('WhatsApp message sent successfully:', message.sid)
    return true
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

function generateEmailTemplate(data: NotificationData): string {
  const baseTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.subject}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>VittaMed</h1>
      </div>
      <div class="content">
        ${getContentByType(data)}
      </div>
      <div class="footer">
        <p>Este es un mensaje automático de VittaMed. No responder a este email.</p>
      </div>
    </body>
    </html>
  `

  return baseTemplate
}

function getContentByType(data: NotificationData): string {
  switch (data.type) {
    case 'appointment_confirmation':
      return `
        <h2>¡Tu cita ha sido confirmada!</h2>
        <p>${data.content}</p>
        <p>Te recordaremos 24 horas antes de tu cita.</p>
        <a href="#" class="button">Ver detalles de la cita</a>
      `
    case 'appointment_reminder':
      return `
        <h2>Recordatorio de cita</h2>
        <p>${data.content}</p>
        <p>Por favor, llega 15 minutos antes de tu cita programada.</p>
        <a href="#" class="button">Ver detalles</a>
      `
    case 'payment_success':
      return `
        <h2>¡Pago exitoso!</h2>
        <p>${data.content}</p>
        <p>Tu cita está confirmada y te esperamos en la fecha programada.</p>
      `
    case 'payment_failed':
      return `
        <h2>Problema con el pago</h2>
        <p>${data.content}</p>
        <p>Por favor, intenta realizar el pago nuevamente o contacta con nosotros.</p>
        <a href="#" class="button">Reintentar pago</a>
      `
    case 'appointment_cancelled':
      return `
        <h2>Cita cancelada</h2>
        <p>${data.content}</p>
        <p>Si necesitas reagendar, puedes hacerlo a través de nuestra plataforma.</p>
        <a href="#" class="button">Reagendar cita</a>
      `
    default:
      return `<p>${data.content}</p>`
  }
}

// VT-43: Enhanced reminder notifications with tenant branding
export async function sendReminderNotification(data: ReminderNotificationData): Promise<boolean> {
  try {
    // Get tenant branding
    const branding = await getTenantBranding(data.tenantId)

    if (data.channel === 'email' && data.recipientEmail) {
      return await sendReminderEmail(data, branding)
    } else if (data.channel === 'sms' && data.recipientPhone) {
      return await sendReminderSMS(data, branding)
    } else if (data.channel === 'whatsapp' && data.recipientPhone) {
      return await sendReminderWhatsApp(data, branding)
    }

    console.warn('Invalid reminder notification configuration:', data)
    return false
  } catch (error) {
    console.error('Error sending reminder notification:', error)
    return false
  }
}

// Send email reminder with tenant branding
export async function sendReminderEmail(
  data: ReminderNotificationData,
  branding: TenantBranding | null
): Promise<boolean> {
  if (!data.recipientEmail || !process.env.EMAIL_USER) {
    console.warn('Email configuration missing for reminder')
    return false
  }

  try {
    const templateData = data.templateData as EmailReminderTemplateData
    const htmlContent = await generateReminderEmailTemplate(templateData, branding)

    const fromName = branding?.email_from_name || templateData.tenant.name
    const fromEmail = `"${fromName}" <${process.env.EMAIL_USER}>`

    const mailOptions = {
      from: fromEmail,
      to: data.recipientEmail,
      subject: `🔔 Recordatorio de cita - ${templateData.tenant.name}`,
      html: htmlContent,
    }

    await emailTransporter.sendMail(mailOptions)
    console.log('Reminder email sent successfully to:', data.recipientEmail)
    return true
  } catch (error) {
    console.error('Error sending reminder email:', error)
    return false
  }
}

// Send SMS reminder with tenant branding
export async function sendReminderSMS(
  data: ReminderNotificationData,
  branding: TenantBranding | null
): Promise<boolean> {
  if (!data.recipientPhone || !twilioClient) {
    console.warn('SMS configuration missing for reminder')
    return false
  }

  try {
    const templateData = data.templateData as SMSReminderTemplateData
    const messageContent = generateReminderSMSTemplate(templateData, branding)

    const message = await twilioClient.messages.create({
      body: messageContent,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: data.recipientPhone,
    })

    console.log('Reminder SMS sent successfully:', message.sid)
    return true
  } catch (error) {
    console.error('Error sending reminder SMS:', error)
    return false
  }
}

// Send WhatsApp reminder with tenant branding
export async function sendReminderWhatsApp(
  data: ReminderNotificationData,
  branding: TenantBranding | null
): Promise<boolean> {
  if (!data.recipientPhone || !twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
    console.warn('WhatsApp configuration missing for reminder')
    return false
  }

  try {
    const templateData = data.templateData as SMSReminderTemplateData
    const messageContent = generateReminderSMSTemplate(templateData, branding)

    const message = await twilioClient.messages.create({
      body: messageContent,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${data.recipientPhone}`,
    })

    console.log('Reminder WhatsApp message sent successfully:', message.sid)
    return true
  } catch (error) {
    console.error('Error sending reminder WhatsApp message:', error)
    return false
  }
}