import { createAdminClient } from './supabase-server'
import crypto from 'crypto'

export interface VerificationToken {
  id: string
  user_id: string
  token: string
  expires_at: string
  created_at: string
  used_at: string | null
}

/**
 * Get token expiration time in hours from environment or use default
 */
export function getTokenExpirationHours(): number {
  const hours = process.env.EMAIL_VERIFICATION_TOKEN_EXPIRATION_HOURS
  return hours ? parseInt(hours, 10) : 1 // Default: 1 hour
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a verification token for a user
 */
export async function createVerificationToken(userId: string): Promise<{
  token: string
  expiresAt: Date
}> {
  const adminClient = await createAdminClient()
  const token = generateSecureToken()
  const expirationHours = getTokenExpirationHours()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + expirationHours)

  console.log('[VerificationToken] Creating token for user:', {
    userId,
    expirationHours,
    expiresAt: expiresAt.toISOString()
  })

  // Delete any existing unused tokens for this user
  await adminClient
    .from('email_verification_tokens')
    .delete()
    .eq('user_id', userId)
    .is('used_at', null)

  // Create new token
  const { error } = await adminClient
    .from('email_verification_tokens')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt.toISOString()
    })

  if (error) {
    console.error('[VerificationToken] Error creating token:', error)
    throw new Error('Failed to create verification token')
  }

  console.log('[VerificationToken] Token created successfully')

  return {
    token,
    expiresAt
  }
}

/**
 * Verify and consume a verification token
 * Returns the user_id if valid, null otherwise
 */
export async function verifyAndConsumeToken(token: string): Promise<{
  success: boolean
  userId?: string
  error?: string
}> {
  const adminClient = await createAdminClient()

  console.log('[VerificationToken] Verifying token...')

  // Find the token
  const { data: tokenData, error: findError } = await adminClient
    .from('email_verification_tokens')
    .select('*')
    .eq('token', token)
    .is('used_at', null) // Only unused tokens
    .single()

  if (findError || !tokenData) {
    console.log('[VerificationToken] Token not found or already used')
    return {
      success: false,
      error: 'Token inválido o ya utilizado'
    }
  }

  // Check if token is expired
  const now = new Date()
  const expiresAt = new Date(tokenData.expires_at)

  if (now > expiresAt) {
    console.log('[VerificationToken] Token expired:', {
      expiresAt: expiresAt.toISOString(),
      now: now.toISOString()
    })
    return {
      success: false,
      error: 'El token ha expirado. Solicita un nuevo correo de activación.'
    }
  }

  // Mark token as used
  const { error: updateError } = await adminClient
    .from('email_verification_tokens')
    .update({ used_at: now.toISOString() })
    .eq('id', tokenData.id)

  if (updateError) {
    console.error('[VerificationToken] Error marking token as used:', updateError)
    return {
      success: false,
      error: 'Error al procesar el token'
    }
  }

  console.log('[VerificationToken] Token verified and consumed successfully')

  return {
    success: true,
    userId: tokenData.user_id
  }
}

/**
 * Activate a user account (mark as verified)
 */
export async function activateUserAccount(userId: string): Promise<boolean> {
  const adminClient = await createAdminClient()

  console.log('[VerificationToken] Activating user account:', userId)

  const { error } = await adminClient
    .from('custom_users')
    .update({
      email_verified: true,
      is_active: true
    })
    .eq('id', userId)

  if (error) {
    console.error('[VerificationToken] Error activating user:', error)
    return false
  }

  console.log('[VerificationToken] User account activated successfully')
  return true
}

/**
 * Check if a user needs to change their password
 */
export async function userMustChangePassword(userId: string): Promise<boolean> {
  const adminClient = await createAdminClient()

  const { data, error } = await adminClient
    .from('custom_users')
    .select('must_change_password')
    .eq('id', userId)
    .single()

  if (error || !data) {
    return false
  }

  return data.must_change_password === true
}

/**
 * Mark that user has changed their password
 */
export async function markPasswordChanged(userId: string): Promise<boolean> {
  const adminClient = await createAdminClient()

  const { error } = await adminClient
    .from('custom_users')
    .update({ must_change_password: false })
    .eq('id', userId)

  if (error) {
    console.error('[VerificationToken] Error marking password as changed:', error)
    return false
  }

  return true
}
