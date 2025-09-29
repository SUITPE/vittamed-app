// Auth bypass utility for development and testing
// This file ensures compatibility with legacy imports

export const authBypass = {
  isEnabled: false, // Disabled by default for production
  allowedEmails: ['admin@clinicasanrafael.com'],

  isAllowed(email: string | null): boolean {
    if (!this.isEnabled || !email) return false
    return this.allowedEmails.includes(email)
  }
}

export default authBypass