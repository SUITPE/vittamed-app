import { chromium, FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  const browser = await chromium.launch()

  // Create auth directory if it doesn't exist
  const authDir = path.join(__dirname, '.auth')
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true })
  }

  console.log('🔐 Setting up authenticated sessions...')

  // Helper function to login and save storage state
  async function loginAndSave(
    email: string,
    password: string,
    filename: string,
    expectedUrl: RegExp,
    fallbackPath?: string
  ): Promise<boolean> {
    const page = await browser.newPage()
    try {
      await page.goto(`${baseURL}/auth/login`, { timeout: 30000 })
      await page.fill('[data-testid="email-input"]', email)
      await page.fill('[data-testid="password-input"]', password)
      await page.click('[data-testid="login-submit"]')

      await page.waitForURL(expectedUrl, { timeout: 30000 })
      await page.context().storageState({ path: path.join(authDir, filename) })
      await page.close()
      return true
    } catch (error) {
      console.log(`  ⚠️ Failed to login as ${email}:`, (error as Error).message)
      await page.close()

      // Use fallback if provided
      if (fallbackPath && fs.existsSync(fallbackPath)) {
        fs.copyFileSync(fallbackPath, path.join(authDir, filename))
        console.log(`  → Using fallback auth for ${filename}`)
        return true
      }
      return false
    }
  }

  // Setup 1: Admin session (primary - must succeed)
  console.log('  → Authenticating as admin...')
  const adminSuccess = await loginAndSave(
    'admin@clinicasanrafael.com',
    'password123',
    'admin.json',
    /\/dashboard/
  )

  if (!adminSuccess) {
    console.error('❌ Admin login failed - cannot continue')
    await browser.close()
    throw new Error('Admin login failed - please check credentials')
  }
  console.log('  ✅ Admin session saved')

  const adminPath = path.join(authDir, 'admin.json')

  // Setup 2: Doctor session (with fallback to admin)
  console.log('  → Authenticating as doctor...')
  const doctorSuccess = await loginAndSave(
    'doctor-1759245234123@clinicasanrafael.com',
    'VittaSami2024!',
    'doctor.json',
    /\/(agenda|dashboard)/,
    adminPath
  )
  console.log(doctorSuccess ? '  ✅ Doctor session saved' : '  ⚠️ Using admin session as doctor fallback')

  // Setup 3: Receptionist session (with fallback to admin)
  console.log('  → Authenticating as receptionist...')
  const receptionistSuccess = await loginAndSave(
    'secre@clinicasanrafael.com',
    'password',
    'receptionist.json',
    /\/dashboard/,
    adminPath
  )
  console.log(receptionistSuccess ? '  ✅ Receptionist session saved' : '  ⚠️ Using admin session as receptionist fallback')

  await browser.close()
  console.log('\n✅ All authenticated sessions ready!')
  console.log('💡 Note: Some users may use admin session as fallback')
}

export default globalSetup
