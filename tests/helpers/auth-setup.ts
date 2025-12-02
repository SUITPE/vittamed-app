import { Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3003'

/**
 * @deprecated Use storage state instead: test.use({ storageState: 'tests/.auth/doctor.json' })
 *
 * This helper is kept for backward compatibility but should be replaced with
 * storage state for better performance (no login required per test).
 */
export async function loginAsDoctor(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in doctor credentials
  await page.fill('input[type="email"]', 'alvaro@abp.pe')
  await page.fill('input[type="password"]', 'VittaMed2024!')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for navigation away from login page (should go to /agenda)
  await page.waitForURL(/\/(agenda|dashboard)/, { timeout: 30000 })

  // Wait for page to be fully loaded by checking for main heading
  await page.locator('h1, h2').first().waitFor({ state: 'visible' })
}

/**
 * @deprecated Use storage state instead: test.use({ storageState: 'tests/.auth/admin.json' })
 */
export async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in admin credentials
  await page.fill('input[type="email"]', 'admin@clinicasanrafael.com')
  await page.fill('input[type="password"]', 'password123')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for successful login
  await page.waitForURL('/dashboard/**', { timeout: 30000 })

  // Wait for page to be fully loaded
  await page.locator('h1, h2').first().waitFor({ state: 'visible' })
}

/**
 * @deprecated Use storage state instead: test.use({ storageState: 'tests/.auth/admin.json' })
 * Note: Receptionist uses same storage as admin (admin_tenant role)
 */
export async function loginAsReceptionist(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in receptionist credentials
  await page.fill('input[type="email"]', 'secre@clinicasanrafael.com')
  await page.fill('input[type="password"]', 'password')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for successful login
  await page.waitForURL(/\/dashboard/, { timeout: 30000 })

  // Wait for page to be fully loaded
  await page.locator('h1, h2').first().waitFor({ state: 'visible' })
}

/**
 * Navigate to agenda page
 * @deprecated Just use page.goto('/agenda') with storage state
 */
export async function navigateToAgenda(page: Page) {
  if (!page.url().includes('/agenda')) {
    await page.goto(`${BASE_URL}/agenda`)
  }

  // Wait for agenda to fully load
  await page.locator('h1, h2').first().waitFor({ state: 'visible' })
}
