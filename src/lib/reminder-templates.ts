import { getSupabaseServerClient } from '@/lib/supabase-api'
import type {
  EmailReminderTemplateData,
  SMSReminderTemplateData,
  TenantBranding
} from '@/types/catalog'

// Generate HTML email template for appointment reminders with tenant branding
export async function generateReminderEmailTemplate(
  templateData: EmailReminderTemplateData,
  branding?: TenantBranding | null
): Promise<string> {
  const {
    tenant,
    appointment,
    patient,
    reminder
  } = templateData

  // Extract nested values for easier access (with fallbacks for optional properties)
  const tenant_name = tenant?.name ?? 'Clínica'
  const patient_first_name = patient?.first_name ?? 'Paciente'
  const patient_last_name = patient?.last_name ?? ''
  const appointment_date = appointment?.date ?? new Date().toISOString().split('T')[0]
  const appointment_time = appointment?.time ?? '00:00'
  const service_name = appointment?.service_name ?? 'Servicio'
  const service_duration = appointment?.duration ?? 30
  const provider_name = appointment?.provider_name ?? 'Profesional'
  const provider_type = appointment?.provider_type ?? 'doctor'
  const clinic_address = appointment?.location ?? tenant?.name ?? 'Dirección'
  const clinic_phone = tenant?.name ?? '' // This should come from tenant data
  const hours_until_appointment = reminder?.hours_before ?? 24

  // These would be passed separately or built dynamically
  const confirmation_link = undefined
  const cancellation_link = undefined

  // Use tenant branding or fallback to defaults
  const primaryColor = branding?.primary_color || '#2563eb'
  const secondaryColor = branding?.secondary_color || '#f3f4f6'
  const logoUrl = branding?.logo_url
  const fromName = branding?.email_from_name || tenant_name
  const customSignature = branding?.email_signature
  const customFooter = branding?.custom_footer

  // Format appointment date and time
  const appointmentDate = new Date(appointment_date + 'T' + appointment_time)
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
  const endTime = new Date(appointmentDate.getTime() + service_duration * 60000)
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
      <title>Recordatorio de Cita - ${tenant_name}</title>
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

        .reminder-badge {
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

        .reminder-message {
          background: ${secondaryColor};
          border-left: 4px solid ${primaryColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 8px;
        }

        .reminder-message .title {
          font-size: 16px;
          font-weight: 600;
          color: ${primaryColor};
          margin-bottom: 10px;
        }

        .reminder-message .message {
          color: #555;
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

        .detail-icon {
          width: 20px;
          height: 20px;
          margin-right: 10px;
          margin-top: 2px;
          opacity: 0.7;
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

        .actions {
          display: flex;
          gap: 15px;
          margin: 30px 0;
          justify-content: center;
        }

        @media (max-width: 480px) {
          .actions {
            flex-direction: column;
            align-items: center;
          }
        }

        .btn {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          text-align: center;
          transition: all 0.3s ease;
          min-width: 140px;
        }

        .btn-primary {
          background: ${primaryColor};
          color: white;
          border: 2px solid ${primaryColor};
        }

        .btn-primary:hover {
          background: ${adjustColorBrightness(primaryColor, -20)};
          border-color: ${adjustColorBrightness(primaryColor, -20)};
        }

        .btn-secondary {
          background: transparent;
          color: ${primaryColor};
          border: 2px solid ${primaryColor};
        }

        .btn-secondary:hover {
          background: ${primaryColor};
          color: white;
        }

        .instructions {
          background: #fef7e0;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
        }

        .instructions .title {
          font-size: 14px;
          font-weight: 600;
          color: #92400e;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
        }

        .instructions .title::before {
          content: "ⓘ";
          margin-right: 8px;
          font-size: 16px;
        }

        .instructions .text {
          font-size: 14px;
          color: #78350f;
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
          ${logoUrl ? `<img src="${logoUrl}" alt="${tenant_name}" class="logo">` : ''}
          <h1>${fromName}</h1>
          <div class="subtitle">Recordatorio de Cita</div>
          <div class="reminder-badge">
            ${hours_until_appointment} ${hours_until_appointment === 1 ? 'hora' : 'horas'} restantes
          </div>
        </div>

        <div class="content">
          <div class="greeting">
            Hola ${patient_first_name} ${patient_last_name},
          </div>

          <div class="reminder-message">
            <div class="title">🔔 Recordatorio importante</div>
            <div class="message">
              Te recordamos que tienes una cita programada
              ${hours_until_appointment === 24 ? 'mañana' : `en ${hours_until_appointment} ${hours_until_appointment === 1 ? 'hora' : 'horas'}`}.
            </div>
          </div>

          <div class="appointment-card">
            <div class="appointment-header">
              <div class="appointment-icon">📅</div>
              <div>
                <div class="appointment-title">${service_name}</div>
                <div class="appointment-subtitle">Duración: ${service_duration} minutos</div>
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
                  <div class="label">Ubicación</div>
                  <div class="value">${clinic_address}</div>
                </div>
              </div>

              <div class="detail-item">
                <div class="detail-content">
                  <div class="label">Contacto</div>
                  <div class="value">${clinic_phone}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="provider-info">
            <div class="label">${provider_type === 'doctor' ? 'Doctor' : 'Profesional'}</div>
            <div class="name">${provider_name}</div>
            <div class="type">${provider_type}</div>
          </div>

          <div class="instructions">
            <div class="title">Instrucciones importantes</div>
            <div class="text">
              • Llega 15 minutos antes de tu cita<br>
              • Trae tu documento de identidad<br>
              • Si no puedes asistir, cancela con al menos 2 horas de anticipación<br>
              • Para reprogramar o cancelar, utiliza los botones a continuación
            </div>
          </div>

          ${confirmation_link || cancellation_link ? `
            <div class="actions">
              ${confirmation_link ? `<a href="${confirmation_link}" class="btn btn-primary">Confirmar Asistencia</a>` : ''}
              ${cancellation_link ? `<a href="${cancellation_link}" class="btn btn-secondary">Cancelar Cita</a>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="footer">
          <div class="contact-info">
            <div class="clinic-name">${tenant_name}</div>
            ${clinic_address ? `<div class="address">${clinic_address}</div>` : ''}
            ${clinic_phone ? `<div class="phone">${clinic_phone}</div>` : ''}
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

// Generate SMS reminder message with tenant branding
export function generateReminderSMSTemplate(
  templateData: SMSReminderTemplateData,
  branding?: TenantBranding | null
): string {
  const {
    tenant,
    appointment,
    patient,
    reminder
  } = templateData

  // Extract nested values for easier access (with fallbacks for optional properties)
  const tenant_name = tenant?.name ?? 'Clínica'
  const patient_first_name = patient?.first_name ?? 'Paciente'
  const appointment_date = appointment?.date ?? new Date().toISOString().split('T')[0]
  const appointment_time = appointment?.time ?? '00:00'
  const service_name = appointment?.service_name ?? 'Servicio'
  const provider_name = appointment?.provider_name ?? 'Profesional'
  const clinic_phone = tenant?.phone ?? tenant?.name ?? ''
  const hours_until_appointment = reminder?.hours_before ?? 24

  const senderName = branding?.sms_sender_name || tenant_name
  const appointmentDate = new Date(appointment_date + 'T' + appointment_time)
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

  const timeReference = hours_until_appointment === 24
    ? 'mañana'
    : hours_until_appointment === 1
      ? 'en 1 hora'
      : `en ${hours_until_appointment}h`

  return `🔔 ${senderName}: Hola ${patient_first_name}, te recordamos tu cita ${timeReference}: ${service_name} con ${provider_name} el ${formattedDate} a las ${formattedTime}. Info: ${clinic_phone}`
}

// Get tenant branding configuration
export async function getTenantBranding(tenantId: string): Promise<TenantBranding | null> {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: branding, error } = await supabase
      .from('tenant_branding')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching tenant branding:', error)
      return null
    }

    return branding
  } catch (error) {
    console.error('Error in getTenantBranding:', error)
    return null
  }
}

// Utility function to adjust color brightness
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