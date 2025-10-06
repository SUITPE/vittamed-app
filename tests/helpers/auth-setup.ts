import { Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export async function loginAsDoctor(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in doctor credentials
  await page.fill('input[type="email"]', 'alvaro@abp.pe')
  await page.fill('input[type="password"]', 'VittaMed2024!')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for navigation away from login page (should go to /agenda)
  await page.waitForURL(/\/(agenda|dashboard)/, { timeout: 15000 })

  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Give some extra time for auth to settle
  await page.waitForTimeout(2000)
}

export async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in admin credentials
  await page.fill('input[type="email"]', 'admin@clinicasanrafael.com')
  await page.fill('input[type="password"]', 'password123')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for successful login
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Give some extra time for auth to settle
  await page.waitForTimeout(2000)
}

export async function loginAsReceptionist(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`)

  // Fill in receptionist credentials
  await page.fill('input[type="email"]', 'secre@clinicasanrafael.com')
  await page.fill('input[type="password"]', 'password')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for successful login
  await page.waitForLoadState('networkidle', { timeout: 15000 })

  // Give some extra time for auth to settle
  await page.waitForTimeout(2000)
}

export async function navigateToAgenda(page: Page) {
  // Only navigate if not already on agenda page
  if (!page.url().includes('/agenda')) {
    await page.goto(`${BASE_URL}/agenda`)
  }

  await page.waitForLoadState('networkidle', { timeout: 10000 })

  // Wait for agenda to fully load
  await page.waitForTimeout(1000)
}
