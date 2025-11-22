import nodemailer from 'nodemailer'

interface InvitationEmailData {
  recipientEmail: string
  recipientName: string
  tempPassword?: string  // Optional: only if activation not required
  activationToken?: string  // Optional: for account activation
  senderName?: string
  tenantName?: string
}

interface AssignmentEmailData {
  recipientEmail: string
  recipientName: string
  tenantName: string
  role: string
  assignedBy?: string
}

interface EmailConfig {
  host: string
  port: number
  user: string
  password: string
}

/**
 * Gets email configuration from environment variables
 */
function getEmailConfig(): EmailConfig {
  const host = process.env.EMAIL_HOST
  const port = process.env.EMAIL_PORT
  const user = process.env.EMAIL_USER
  const password = process.env.EMAIL_PASSWORD

  if (!host || !port || !user || !password) {
    throw new Error('Email configuration is missing. Please check environment variables.')
  }

  return {
    host,
    port: parseInt(port, 10),
    user,
    password
  }
}

/**
 * Creates a nodemailer transporter with the current email configuration
 */
function createTransporter() {
  const config = getEmailConfig()

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: false, // Use TLS
    auth: {
      user: config.user,
      pass: config.password
    }
  })
}

/**
 * Generates HTML template for invitation email
 */
function generateInvitationEmailHTML(data: InvitationEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vittasami.com'
  const { recipientName, tempPassword, activationToken, tenantName } = data

  // Determine which flow to use: activation or direct login
  const requiresActivation = !!activationToken
  const activationUrl = requiresActivation ? `${baseUrl}/auth/activate?token=${activationToken}` : null
  const loginUrl = `${baseUrl}/auth/login`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bienvenido a VittaSami</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #40C9C6 0%, #A6E3A1 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                    Bienvenido a VittaSami
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Hola <strong>${recipientName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Has sido invitado a unirte a <strong>${tenantName || 'VittaSami'}</strong>. Tu cuenta ha sido creada exitosamente.
                  </p>

                  ${requiresActivation ? `
                  <!-- ACTIVATION FLOW -->
                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Para activar tu cuenta y establecer tu contraseña, haz clic en el siguiente botón:
                  </p>

                  <!-- CTA Button - Activation -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${activationUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #40C9C6 0%, #A6E3A1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Activar Mi Cuenta
                    </a>
                  </div>

                  <p style="margin: 20px 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                    <strong>⏱️ Este enlace es válido por 1 hora.</strong><br>
                    Si no activas tu cuenta dentro de este tiempo, deberás solicitar un nuevo enlace de activación.
                  </p>

                  <p style="margin: 20px 0; color: #6c757d; font-size: 12px; line-height: 1.6;">
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
                    <a href="${activationUrl}" style="color: #40C9C6; word-break: break-all;">${activationUrl}</a>
                  </p>
                  ` : `
                  <!-- LEGACY FLOW (Direct Login with Password) -->
                  <p style="margin: 0 0 10px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Tus credenciales de acceso son:
                  </p>

                  <!-- Credentials Box -->
                  <div style="background-color: #f8f9fa; border-left: 4px solid #40C9C6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #003A47; font-size: 14px;">
                      <strong>Email:</strong> ${data.recipientEmail}
                    </p>
                    <p style="margin: 0; color: #003A47; font-size: 14px;">
                      <strong>Contraseña temporal:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code>
                    </p>
                  </div>

                  <p style="margin: 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    ⚠️ <strong>Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.</strong>
                  </p>

                  <!-- CTA Button - Direct Login -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #40C9C6 0%, #A6E3A1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Iniciar Sesión
                    </a>
                  </div>
                  `}

                  <p style="margin: 30px 0 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px;">
                    VittaSami - Gestión moderna para salud y bienestar
                  </p>
                  <p style="margin: 0; color: #6c757d; font-size: 12px;">
                    © ${new Date().getFullYear()} VittaSami. Todos los derechos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Generates plain text version of invitation email
 */
function generateInvitationEmailText(data: InvitationEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vittasami.com'
  const { recipientName, recipientEmail, tempPassword, activationToken, tenantName } = data

  const requiresActivation = !!activationToken
  const activationUrl = requiresActivation ? `${baseUrl}/auth/activate?token=${activationToken}` : null
  const loginUrl = `${baseUrl}/auth/login`

  if (requiresActivation) {
    return `
Bienvenido a VittaSami

Hola ${recipientName},

Has sido invitado a unirte a ${tenantName || 'VittaSami'}. Tu cuenta ha sido creada exitosamente.

Para activar tu cuenta y establecer tu contraseña, visita el siguiente enlace:

${activationUrl}

⏱️ Este enlace es válido por 1 hora.
Si no activas tu cuenta dentro de este tiempo, deberás solicitar un nuevo enlace de activación.

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

---
VittaSami - Gestión moderna para salud y bienestar
© ${new Date().getFullYear()} VittaSami. Todos los derechos reservados.
    `.trim()
  } else {
    return `
Bienvenido a VittaSami

Hola ${recipientName},

Has sido invitado a unirte a ${tenantName || 'VittaSami'}. Tu cuenta ha sido creada exitosamente.

Tus credenciales de acceso son:

Email: ${recipientEmail}
Contraseña temporal: ${tempPassword}

⚠️ Por seguridad, deberás cambiar tu contraseña al iniciar sesión por primera vez.

Iniciar sesión: ${loginUrl}

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

---
VittaSami - Gestión moderna para salud y bienestar
© ${new Date().getFullYear()} VittaSami. Todos los derechos reservados.
    `.trim()
  }
}

/**
 * Sends an invitation email to a new user
 * @throws Error if email configuration is missing or email fails to send
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<void> {
  try {
    const transporter = createTransporter()
    const config = getEmailConfig()

    const mailOptions = {
      from: {
        name: 'VittaSami',
        address: config.user
      },
      to: {
        name: data.recipientName,
        address: data.recipientEmail
      },
      subject: `Bienvenido a ${data.tenantName || 'VittaSami'} - Credenciales de acceso`,
      text: generateInvitationEmailText(data),
      html: generateInvitationEmailHTML(data)
    }

    console.log('[Email] Sending invitation email to:', data.recipientEmail)

    const info = await transporter.sendMail(mailOptions)

    console.log('[Email] Invitation email sent successfully:', {
      messageId: info.messageId,
      recipient: data.recipientEmail,
      accepted: info.accepted,
      rejected: info.rejected
    })

    // Verify the connection worked
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email was rejected by server for: ${info.rejected.join(', ')}`)
    }

  } catch (error) {
    console.error('[Email] Failed to send invitation email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      recipient: data.recipientEmail
    })
    throw error
  }
}

/**
 * Verifies email configuration is valid by testing connection
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('[Email] Email configuration verified successfully')
    return true
  } catch (error) {
    console.error('[Email] Email configuration verification failed:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error'
    })
    return false
  }
}

/**
 * Generates HTML template for assignment notification email
 */
function generateAssignmentEmailHTML(data: AssignmentEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vittasami.com'
  const { recipientName, tenantName, role, assignedBy } = data
  const loginUrl = `${baseUrl}/auth/login`

  const roleNames: Record<string, string> = {
    'admin_tenant': 'Administrador',
    'doctor': 'Doctor/a',
    'staff': 'Personal',
    'receptionist': 'Recepcionista',
    'patient': 'Paciente',
    'member': 'Miembro',
    'client': 'Cliente'
  }

  const roleName = roleNames[role] || role

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Acceso en VittaSami</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #40C9C6 0%, #A6E3A1 100%); border-radius: 12px 12px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                    Nuevo Acceso Asignado
                  </h1>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Hola <strong>${recipientName}</strong>,
                  </p>

                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Has sido agregado a <strong>${tenantName}</strong> en VittaSami.
                  </p>

                  <!-- Assignment Details -->
                  <div style="background-color: #f0f9ff; border-left: 4px solid #40C9C6; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0 0 10px 0; color: #003A47; font-size: 14px;">
                      <strong>Negocio:</strong> ${tenantName}
                    </p>
                    <p style="margin: 0 0 10px 0; color: #003A47; font-size: 14px;">
                      <strong>Tu rol:</strong> ${roleName}
                    </p>
                    ${assignedBy ? `
                    <p style="margin: 0; color: #003A47; font-size: 14px;">
                      <strong>Asignado por:</strong> ${assignedBy}
                    </p>
                    ` : ''}
                  </div>

                  <p style="margin: 0 0 20px 0; color: #003A47; font-size: 16px; line-height: 1.6;">
                    Ahora puedes acceder al sistema con tu cuenta existente.
                  </p>

                  <!-- Login Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #40C9C6 0%, #A6E3A1 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(64, 201, 198, 0.3);">
                      Iniciar Sesión
                    </a>
                  </div>

                  <p style="margin: 20px 0 0 0; color: #666; font-size: 14px; line-height: 1.6;">
                    Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador de ${tenantName}.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #666; font-size: 12px; text-align: center; line-height: 1.6;">
                    VittaSami - Gestión moderna para salud y bienestar<br>
                    © ${new Date().getFullYear()} VittaSami. Todos los derechos reservados.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}

/**
 * Generates plain text template for assignment notification email
 */
function generateAssignmentEmailText(data: AssignmentEmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vittasami.com'
  const { recipientName, tenantName, role, assignedBy } = data
  const loginUrl = `${baseUrl}/auth/login`

  const roleNames: Record<string, string> = {
    'admin_tenant': 'Administrador',
    'doctor': 'Doctor/a',
    'staff': 'Personal',
    'receptionist': 'Recepcionista',
    'patient': 'Paciente',
    'member': 'Miembro',
    'client': 'Cliente'
  }

  const roleName = roleNames[role] || role

  return `
Nuevo Acceso Asignado en VittaSami

Hola ${recipientName},

Has sido agregado a ${tenantName} en VittaSami.

DETALLES DE ASIGNACIÓN:
━━━━━━━━━━━━━━━━━━━━━━
Negocio: ${tenantName}
Tu rol: ${roleName}
${assignedBy ? `Asignado por: ${assignedBy}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━

Ahora puedes acceder al sistema con tu cuenta existente.

Iniciar sesión: ${loginUrl}

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactar al administrador de ${tenantName}.

---
VittaSami - Gestión moderna para salud y bienestar
© ${new Date().getFullYear()} VittaSami. Todos los derechos reservados.
  `.trim()
}

/**
 * Sends an assignment notification email to an existing user
 * @throws Error if email configuration is missing or email fails to send
 */
export async function sendAssignmentEmail(data: AssignmentEmailData): Promise<void> {
  try {
    const transporter = createTransporter()
    const config = getEmailConfig()

    const mailOptions = {
      from: {
        name: 'VittaSami',
        address: config.user
      },
      to: {
        name: data.recipientName,
        address: data.recipientEmail
      },
      subject: `Nuevo acceso a ${data.tenantName} - VittaSami`,
      text: generateAssignmentEmailText(data),
      html: generateAssignmentEmailHTML(data)
    }

    console.log('[Email] Sending assignment notification email to:', data.recipientEmail)

    const info = await transporter.sendMail(mailOptions)

    console.log('[Email] Assignment notification email sent successfully:', {
      messageId: info.messageId,
      recipient: data.recipientEmail,
      accepted: info.accepted,
      rejected: info.rejected
    })

    // Verify the connection worked
    if (info.rejected && info.rejected.length > 0) {
      throw new Error(`Email was rejected by server for: ${info.rejected.join(', ')}`)
    }

  } catch (error) {
    console.error('[Email] Failed to send assignment notification email:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      recipient: data.recipientEmail
    })
    throw error
  }
}
