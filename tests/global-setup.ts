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

  // Setup 1: Admin session
  console.log('  → Authenticating as admin...')
  const adminPage = await browser.newPage()
  await adminPage.goto(`${baseURL}/auth/login`)
  await adminPage.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
  await adminPage.fill('[data-testid="password-input"]', 'password123')
  await adminPage.click('[data-testid="login-submit"]')

  // Wait for successful navigation
  await adminPage.waitForURL(/\/dashboard/, { timeout: 30000 })
  await adminPage.context().storageState({ path: path.join(authDir, 'admin.json') })
  await adminPage.close()
  console.log('  ✅ Admin session saved')

  // Setup 2: Doctor session
  console.log('  → Authenticating as doctor...')
  const doctorPage = await browser.newPage()
  await doctorPage.goto(`${baseURL}/auth/login`)
  await doctorPage.fill('[data-testid="email-input"]', 'alvaro@abp.pe')
  await doctorPage.fill('[data-testid="password-input"]', 'VittaMed2024!')
  await doctorPage.click('[data-testid="login-submit"]')

  // Wait for successful navigation
  await doctorPage.waitForURL(/\/(agenda|dashboard)/, { timeout: 30000 })
  await doctorPage.context().storageState({ path: path.join(authDir, 'doctor.json') })
  await doctorPage.close()
  console.log('  ✅ Doctor session saved')

  // Setup 3: Receptionist session (uses admin credentials with receptionist user)
  console.log('  → Authenticating as receptionist...')
  const receptionistPage = await browser.newPage()
  await receptionistPage.goto(`${baseURL}/auth/login`)
  await receptionistPage.fill('[data-testid="email-input"]', 'secre@clinicasanrafael.com')
  await receptionistPage.fill('[data-testid="password-input"]', 'password')
  await receptionistPage.click('[data-testid="login-submit"]')

  // Wait for successful navigation
  await receptionistPage.waitForURL(/\/dashboard/, { timeout: 30000 })
  await receptionistPage.context().storageState({ path: path.join(authDir, 'receptionist.json') })
  await receptionistPage.close()
  console.log('  ✅ Receptionist session saved')

  await browser.close()
  console.log('✅ All authenticated sessions ready!\n')
  console.log('💡 Note: patient@example.com user not found in database')
  console.log('   Using admin/doctor/receptionist sessions for tests\n')
}

export default globalSetup
