import { getSupabaseServerClient } from '@/lib/supabase-api'
import { getTenantBranding } from './reminder-templates'
import type { TenantBranding } from '@/types/catalog'

// VT-44: Automatic booking confirmation template data
export interface BookingConfirmationTemplateData {
  tenant: {
    name: string
    address?: string
    phone?: string
  }
  appointment: {
    id: string
    date: string
    time: string
    end_time: string
    service_name: string
    service_description?: string
    service_duration: number
    service_price: number
    provider_name: string
    provider_type: 'doctor' | 'member'
    status: string
    confirmation_number?: string
  }
  patient: {
    first_name: string
    last_name: string
    full_name: string
    email: string
    phone?: string
  }
}

// Generate HTML email confirmation template with tenant branding
export async function generateBookingConfirmationEmailTemplate(
  templateData: BookingConfirmationTemplateData,
  branding?: TenantBranding | null
): Promise<string> {
  const {
    tenant,
    appointment,
    patient
  } = templateData

  // Use tenant branding or fallback to defaults
  const primaryColor = branding?.primary_color || '#22c55e'
  const secondaryColor = branding?.secondary_color || '#f3f4f6'
  const logoUrl = branding?.logo_url
  const fromName = branding?.email_from_name || tenant.name
  const customSignature = branding?.email_signature
  const customFooter = branding?.custom_footer

  // Format appointment date and time
  const appointmentDate = new Date(appointment.date + 'T' + appointment.time)
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // Calculate service end time
  const endTime = new Date(appointmentDate.getTime() + appointment.service_duration * 60000)
  const formattedEndTime = endTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Cita - ${tenant.name}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }

        .email-container {
          max-width: 600px;
          margin: 20px auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${adjustColorBrightness(primaryColor, -20)} 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          position: relative;
        }

        .logo {
          max-height: 60px;
          margin-bottom: 15px;
        }

        .header h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .header .subtitle {
          font-size: 16px;
          opacity: 0.9;
          font-weight: 400;
        }

        .confirmation-badge {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .content {
          padding: 40px 30px;
        }

        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #333;
        }

        .confirmation-message {
          background: #f0fdf4;
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }

        .confirmation-message .title {
          font-size: 16px;
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 10px;
          display: flex;
          align-items: center;
        }

        .confirmation-message .title::before {
          content: "✅";
          margin-right: 8px;
          font-size: 18px;
        }

        .confirmation-message .message {
          color: #166534;
          font-size: 14px;
        }

        .appointment-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .appointment-header {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }

        .appointment-icon {
          width: 40px;
          height: 40px;
          background: ${primaryColor};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          font-weight: bold;
          margin-right: 15px;
        }

        .appointment-title {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .appointment-subtitle {
          color: #6b7280;
          font-size: 14px;
        }

        .appointment-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 480px) {
          .appointment-details {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        .detail-item {
          display: flex;
          align-items: flex-start;
        }

        .detail-content .label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .detail-content .value {
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .service-details {
          background: ${secondaryColor};
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }

        .service-details .title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .service-details .description {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 15px;
        }

        .service-pricing {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #d1d5db;
        }

        .service-pricing .label {
          font-size: 14px;
          color: #6b7280;
        }

        .service-pricing .price {
          font-size: 18px;
          font-weight: 600;
          color: ${primaryColor};
        }

        .provider-info {
          background: ${secondaryColor};
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }

        .provider-info .label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .provider-info .name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }

        .provider-info .type {
          font-size: 14px;
          color: #6b7280;
          text-transform: capitalize;
        }

        .confirmation-number {
          background: #fef7e0;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }

        .confirmation-number .label {
          font-size: 12px;
          color: #92400e;
          text-transform: uppercase;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .confirmation-number .number {
          font-size: 20px;
          font-weight: 600;
          color: #92400e;
          font-family: monospace;
        }

        .instructions {
          background: #eff6ff;
          border: 1px solid #3b82f6;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }

        .instructions .title {
          font-size: 14px;
          font-weight: 600;
          color: #1d4ed8;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .instructions .title::before {
          content: "ℹ️";
          margin-right: 8px;
          font-size: 16px;
        }

        .instructions .text {
          font-size: 14px;
          color: #1e40af;
          line-height: 1.5;
        }

        .footer {
          background: #f9fafb;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }

        .contact-info {
          margin-bottom: 20px;
        }

        .contact-info .clinic-name {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
        }

        .contact-info .address {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .contact-info .phone {
          font-size: 14px;
          color: ${primaryColor};
          font-weight: 500;
        }

        .signature {
          font-size: 14px;
          color: #6b7280;
          margin: 20px 0;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .automated-message {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          ${logoUrl ? `<img src="${logoUrl}" alt="${tenant.name}" class="logo">` : ''}
          <h1>${fromName}</h1>
          <div class="subtitle">Confirmación de Cita</div>
          <div class="confirmation-badge">Confirmada</div>
        </div>

        <div class="content">
          <div class="greeting">
            Hola ${patient.first_name} ${patient.last_name},
          </div>

          <div class="confirmation-message">
            <div class="title">¡Tu cita ha sido confirmada!</div>
            <div class="message">
              Hemos recibido exitosamente tu reserva. A continuación encontrarás todos los detalles de tu cita.
            </div>
          </div>

          ${appointment.confirmation_number ? `
            <div class="confirmation-number">
              <div class="label">Número de Confirmación</div>
              <div class="number">${appointment.confirmation_number}</div>
            </div>
          ` : ''}

          <div class="appointment-card">
            <div class="appointment-header">
              <div class="appointment-icon">📅</div>
              <div>
                <div class="appointment-title">${appointment.service_name}</div>
                <div class="appointment-subtitle">Duración: ${appointment.service_duration} minutos</div>
              </div>
            </div>

            <div class="appointment-details">
              <div class="detail-item">
                <div class="detail-content">
                  <div class="label">Fecha</div>
                  <div class="value">${formattedDate}</div>
                </div>
              </div>

              <div class="detail-item">
                <div class="detail-content">
                  <div class="label">Hora</div>
                  <div class="value">${formattedTime} - ${formattedEndTime}</div>
                </div>
              </div>

              <div class="detail-item">
                <div class="detail-content">
                  <div class="label">Estado</div>
                  <div class="value" style="color: ${primaryColor}; font-weight: 600; text-transform: capitalize;">${appointment.status}</div>
                </div>
              </div>

              <div class="detail-item">
                <div class="detail-content">
                  <div class="label">Ubicación</div>
                  <div class="value">${tenant.address || tenant.name}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="service-details">
            <div class="title">${appointment.service_name}</div>
            ${appointment.service_description ? `<div class="description">${appointment.service_description}</div>` : ''}
            <div class="service-pricing">
              <span class="label">Precio del servicio:</span>
              <span class="price">$${appointment.service_price.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div class="provider-info">
            <div class="label">${appointment.provider_type === 'doctor' ? 'Doctor' : 'Profesional'}</div>
            <div class="name">${appointment.provider_name}</div>
            <div class="type">${appointment.provider_type}</div>
          </div>

          <div class="instructions">
            <div class="title">Instrucciones importantes</div>
            <div class="text">
              • Llega 15 minutos antes de tu cita<br>
              • Trae tu documento de identidad<br>
              • Si tienes alguna pregunta, no dudes en contactarnos<br>
              • Te enviaremos un recordatorio 24 horas antes de la cita<br>
              • Si necesitas cancelar o reprogramar, hazlo con al menos 2 horas de anticipación
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="contact-info">
            <div class="clinic-name">${tenant.name}</div>
            ${tenant.address ? `<div class="address">${tenant.address}</div>` : ''}
            ${tenant.phone ? `<div class="phone">${tenant.phone}</div>` : ''}
          </div>

          ${customSignature ? `
            <div class="signature">
              ${customSignature}
            </div>
          ` : ''}

          ${customFooter ? `
            <div class="signature">
              ${customFooter}
            </div>
          ` : ''}

          <div class="automated-message">
            Este es un mensaje automático. No responder a este email.
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Generate SMS booking confirmation message
export function generateBookingConfirmationSMSTemplate(
  templateData: BookingConfirmationTemplateData,
  branding?: TenantBranding | null
): string {
  const {
    tenant,
    appointment,
    patient
  } = templateData

  const senderName = branding?.sms_sender_name || tenant.name
  const appointmentDate = new Date(appointment.date + 'T' + appointment.time)
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  const confirmationText = appointment.confirmation_number
    ? ` Confirmación: ${appointment.confirmation_number}.`
    : ''

  return `✅ ${senderName}: Hola ${patient.first_name}, tu cita para ${appointment.service_name} ha sido confirmada para el ${formattedDate} a las ${formattedTime}.${confirmationText} Info: ${tenant.phone || tenant.name}`
}

// Utility function to adjust color brightness (same as reminder templates)
function adjustColorBrightness(color: string, percent: number): string {
  const num = parseInt(color.replace("#", ""), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const B = (num >> 8 & 0x00FF) + amt
  const G = (num & 0x0000FF) + amt

  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 +
    (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1)
}

// Send booking confirmation notification
export async function sendBookingConfirmation(
  appointmentId: string,
  tenantId: string,
  channel: 'email' | 'sms' | 'both' = 'email'
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient()

    // Get appointment with all related data
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        tenant:tenants(id, name, address, phone),
        patient:patients(id, first_name, last_name, email, phone),
        service:services(id, name, description, duration_minutes, price),
        doctor:doctors(id, first_name, last_name),
        assigned_member:user_profiles!appointments_assigned_member_id_fkey(id, first_name, last_name)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment for confirmation:', appointmentError)
      return false
    }

    // Get tenant branding
    const branding = await getTenantBranding(tenantId)

    // Build template data
    const provider = appointment.doctor || appointment.assigned_member
    const providerName = provider
      ? `${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Profesional asignado'
      : 'Profesional asignado'
    const providerType = appointment.doctor ? 'doctor' : 'member'

    const templateData: BookingConfirmationTemplateData = {
      tenant: {
        name: appointment.tenant.name,
        address: appointment.tenant.address,
        phone: appointment.tenant.phone
      },
      appointment: {
        id: appointment.id,
        date: appointment.appointment_date,
        time: appointment.start_time,
        end_time: appointment.end_time,
        service_name: appointment.service.name,
        service_description: appointment.service.description,
        service_duration: appointment.service.duration_minutes,
        service_price: appointment.service.price,
        provider_name: providerName,
        provider_type: providerType,
        status: appointment.status,
        confirmation_number: `VT-${appointment.id.slice(0, 8).toUpperCase()}`
      },
      patient: {
        first_name: appointment.patient.first_name,
        last_name: appointment.patient.last_name,
        full_name: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
        email: appointment.patient.email,
        phone: appointment.patient.phone
      }
    }

    let emailSent = false
    let smsSent = false

    // Send email confirmation
    if ((channel === 'email' || channel === 'both') && appointment.patient.email) {
      const { sendEmailNotification } = await import('./notifications')
      const htmlContent = await generateBookingConfirmationEmailTemplate(templateData, branding)

      const fromName = branding?.email_from_name || appointment.tenant.name

      emailSent = await sendEmailNotification({
        recipientEmail: appointment.patient.email,
        subject: `✅ Cita confirmada - ${appointment.service.name} | ${appointment.tenant.name}`,
        content: htmlContent,
        type: 'appointment_confirmation'
      })
    }

    // Send SMS confirmation
    if ((channel === 'sms' || channel === 'both') && appointment.patient.phone) {
      const { twilioClient } = await import('./notifications')
      const smsContent = generateBookingConfirmationSMSTemplate(templateData, branding)

      if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
        try {
          await twilioClient.messages.create({
            body: smsContent,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: appointment.patient.phone
          })
          smsSent = true
        } catch (error) {
          console.error('Error sending confirmation SMS:', error)
        }
      }
    }

    // Create notification record
    if (emailSent || smsSent) {
      await supabase
        .from('notifications')
        .insert({
          tenant_id: tenantId,
          user_id: appointment.patient.user_id,
          type: 'appointment_confirmation',
          title: `Cita confirmada - ${appointment.service.name}`,
          message: `Tu cita para ${appointment.service.name} ha sido confirmada para el ${templateData.appointment.date}`,
          recipient_email: emailSent ? appointment.patient.email : null,
          recipient_phone: smsSent ? appointment.patient.phone : null,
          is_read: false,
          delivery_status: 'sent',
          sent_at: new Date().toISOString()
        })
    }

    return emailSent || smsSent
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return false
  }
}