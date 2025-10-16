// Team member invitation service for VittaSami

export interface InvitationData {
  email: string
  first_name?: string
  last_name?: string
  role: string
  tenant_id: string
  tenant_name: string
  inviter_name: string
  temp_password?: string
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

class InvitationService {

  /**
   * Generate invitation email template
   */
  generateInvitationEmail(data: InvitationData): EmailTemplate {
    const { email, first_name, last_name, role, tenant_name, inviter_name, temp_password } = data

    const userName = first_name && last_name ? `${first_name} ${last_name}` :
                    first_name ? first_name :
                    email.split('@')[0]

    const roleDisplayName = this.getRoleDisplayName(role)
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vittamed.com'}/auth/login`

    const subject = `Invitación a ${tenant_name} - ${roleDisplayName}`

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitación a ${tenant_name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .credentials { background: #f9fafb; border: 1px solid #d1d5db; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
          .role-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏥 VittaSami</h1>
          <p>Sistema de Gestión Médica</p>
        </div>

        <div class="content">
          <h2>¡Hola ${userName}!</h2>

          <p><strong>${inviter_name}</strong> te ha invitado a unirte al equipo de <strong>${tenant_name}</strong> en VittaSami.</p>

          <p>Has sido asignado con el rol de: <span class="role-badge">${roleDisplayName}</span></p>

          ${temp_password ? `
          <div class="credentials">
            <h3>📧 Credenciales de Acceso</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña temporal:</strong> <code>${temp_password}</code></p>
            <p><small>⚠️ Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.</small></p>
          </div>
          ` : ''}

          <p>Para comenzar a usar VittaSami:</p>
          <ol>
            <li>Haz clic en el botón de abajo para acceder</li>
            <li>Inicia sesión con las credenciales proporcionadas</li>
            <li>Completa tu perfil y cambia tu contraseña</li>
            <li>¡Comienza a trabajar con tu equipo!</li>
          </ol>

          <div style="text-align: center;">
            <a href="${loginUrl}" class="button">Acceder a VittaSami</a>
          </div>

          <h3>🎯 ¿Qué puedes hacer como ${roleDisplayName}?</h3>
          ${this.getRoleDescription(role)}

          <p>Si tienes alguna pregunta, no dudes en contactar a ${inviter_name} o al equipo de soporte.</p>

          <p>¡Bienvenido al equipo!</p>
        </div>

        <div class="footer">
          <p>Este correo fue enviado desde VittaSami - Sistema de Gestión Médica</p>
          <p>Si no esperabas este correo, puedes ignorarlo con seguridad.</p>
        </div>
      </body>
      </html>
    `

    const text = `
¡Hola ${userName}!

${inviter_name} te ha invitado a unirte al equipo de ${tenant_name} en VittaSami.

Has sido asignado con el rol de: ${roleDisplayName}

${temp_password ? `
Credenciales de Acceso:
- Email: ${email}
- Contraseña temporal: ${temp_password}

⚠️ Te recomendamos cambiar tu contraseña después de tu primer inicio de sesión.
` : ''}

Para comenzar a usar VittaSami:
1. Visita: ${loginUrl}
2. Inicia sesión con las credenciales proporcionadas
3. Completa tu perfil y cambia tu contraseña
4. ¡Comienza a trabajar con tu equipo!

¡Bienvenido al equipo!

---
VittaSami - Sistema de Gestión Médica
Si no esperabas este correo, puedes ignorarlo con seguridad.
    `

    return { subject, html, text }
  }

  /**
   * Send invitation email using nodemailer
   */
  async sendInvitationEmail(data: InvitationData): Promise<boolean> {
    try {
      const template = this.generateInvitationEmail(data)

      // Import nodemailer at runtime for server-side only
      const nodemailer = await import('nodemailer')

      // Check if email configuration is available
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        console.log('📧 INVITATION EMAIL (Demo Mode - No email config):')
        console.log('To:', data.email)
        console.log('Subject:', template.subject)
        console.log('Content preview:', template.text.substring(0, 200) + '...')
        console.log('---')
        // Simulate delay for demo
        await new Promise(resolve => setTimeout(resolve, 500))
        return true
      }

      // Create transporter
      const transporter = nodemailer.default.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      })

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: data.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }

      await transporter.sendMail(mailOptions)

      console.log(`✅ Invitation email sent successfully to ${data.email}`)
      return true
    } catch (error) {
      console.error('Error sending invitation email:', error)

      // Fallback to demo mode if email fails
      console.log('📧 INVITATION EMAIL (Fallback - Demo Mode):')
      console.log('To:', data.email)
      console.log('Subject:', this.generateInvitationEmail(data).subject)
      console.log('---')

      return false
    }
  }

  /**
   * Create invitation record in database
   */
  async createInvitationRecord(data: InvitationData): Promise<string | null> {
    // TODO: Store invitation in database for tracking
    // This would include:
    // - invitation_id
    // - email
    // - tenant_id
    // - role
    // - invited_by
    // - status (pending, accepted, expired)
    // - expires_at
    // - created_at

    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get role display name in Spanish
   */
  private getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      admin_tenant: 'Administrador',
      doctor: 'Doctor/a',
      patient: 'Paciente',
      staff: 'Personal'
    }
    return roleNames[role] || 'Usuario'
  }

  /**
   * Get role description for invitation email
   */
  private getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
      admin_tenant: `
        <ul>
          <li>👥 Gestionar usuarios y roles del equipo</li>
          <li>📊 Acceder a reportes y estadísticas</li>
          <li>⚙️ Configurar ajustes del negocio</li>
          <li>📅 Gestionar horarios y disponibilidad</li>
          <li>💰 Administrar facturación y pagos</li>
        </ul>
      `,
      doctor: `
        <ul>
          <li>📅 Gestionar tu agenda de citas</li>
          <li>👤 Ver y actualizar historiales de pacientes</li>
          <li>🩺 Registrar consultas y tratamientos</li>
          <li>📋 Acceder a informes médicos</li>
          <li>⏰ Configurar tu disponibilidad</li>
        </ul>
      `,
      staff: `
        <ul>
          <li>📞 Gestionar citas y reservas</li>
          <li>👥 Asistir en recepción de pacientes</li>
          <li>📋 Actualizar información de contacto</li>
          <li>🔔 Enviar recordatorios a pacientes</li>
          <li>📊 Generar reportes básicos</li>
        </ul>
      `,
      patient: `
        <ul>
          <li>📅 Reservar citas online</li>
          <li>📱 Ver tus próximas citas</li>
          <li>💳 Realizar pagos de servicios</li>
          <li>📋 Acceder a tu historial médico</li>
          <li>🔔 Recibir recordatorios automáticos</li>
        </ul>
      `
    }
    return descriptions[role] || '<p>Acceso básico a la plataforma.</p>'
  }
}

export const invitationService = new InvitationService()