import { test, expect } from '@playwright/test'

// Use admin storage state for all tests
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - already authenticated via storage state
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('[data-testid="today-appointments-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="week-appointments-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="month-revenue-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-patients-stat"]')).toBeVisible()
    await expect(page.locator('[data-testid="pending-appointments-stat"]')).toBeVisible()

    // Check that dashboard title contains "Dashboard -" followed by tenant name
    await expect(page.locator('h1')).toContainText('Dashboard -')
  })

  test('should show today appointments section', async ({ page }) => {
    // Use first() to avoid strict mode violation when multiple h2 elements exist
    await expect(page.locator('h2').filter({ hasText: 'Citas de Hoy' })).toBeVisible()

    const appointmentsSection = page.locator('.bg-white.rounded-lg.shadow-sm').first()
    await expect(appointmentsSection).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    // Use filter to find the specific h2
    await expect(page.locator('h2').filter({ hasText: 'Acciones Rápidas' })).toBeVisible()

    // Check quick action buttons are visible
    await expect(page.locator('button').filter({ hasText: 'Nueva Cita' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Gestionar Pacientes' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Agenda Doctores' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Reportes' })).toBeVisible()
  })

  test('should navigate to booking when clicking Nueva Cita', async ({ page, context }) => {
    const newAppointmentButton = page.locator('button').filter({ hasText: 'Nueva Cita' })

    // The button opens a new window with window.open, so we need to listen for the popup
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      newAppointmentButton.click()
    ])

    // Wait for the new page to load
    await newPage.waitForLoadState()

    // Check the new page URL contains /booking
    expect(newPage.url()).toContain('/booking')

    // Close the new page
    await newPage.close()
  })

  test('should navigate to patients when clicking Gestionar Pacientes', async ({ page }) => {
    const patientsButton = page.locator('button').filter({ hasText: 'Gestionar Pacientes' })
    await patientsButton.click()

    await expect(page).toHaveURL('/patients')
  })

  test('should navigate to agenda when clicking Agenda Doctores', async ({ page }) => {
    const agendaButton = page.locator('button').filter({ hasText: 'Agenda Doctores' })
    await agendaButton.click()

    await expect(page).toHaveURL('/agenda')
  })

  test('should display tenant-specific information', async ({ page }) => {
    // Dashboard should show "Dashboard - [Tenant Name]" format
    await expect(page.locator('h1')).toContainText('Dashboard -')
    // The description shows "Gestión completa de tu [business type]"
    await expect(page.locator('p').first()).toContainText('Gestión completa de tu')
  })

  test('should handle stats loading and display numbers', async ({ page }) => {
    const todayStats = page.locator('[data-testid="today-appointments-stat"] .text-2xl')
    const weekStats = page.locator('[data-testid="week-appointments-stat"] .text-2xl')
    const revenueStats = page.locator('[data-testid="month-revenue-stat"] .text-2xl')
    const patientsStats = page.locator('[data-testid="active-patients-stat"] .text-2xl')
    const pendingStats = page.locator('[data-testid="pending-appointments-stat"] .text-2xl')

    await expect(todayStats).toBeVisible()
    await expect(weekStats).toBeVisible()
    await expect(revenueStats).toBeVisible()
    await expect(patientsStats).toBeVisible()
    await expect(pendingStats).toBeVisible()

    const todayValue = await todayStats.textContent()
    expect(todayValue).toMatch(/^\d+$/)
  })
})