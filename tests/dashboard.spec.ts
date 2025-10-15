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

    await expect(page.locator('h1')).toContainText('Dashboard - Clínica San Rafael')
  })

  test('should show today appointments section', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Citas de Hoy')

    const appointmentsSection = page.locator('.bg-white.rounded-lg.shadow-sm').first()
    await expect(appointmentsSection).toBeVisible()
  })

  test('should display quick actions', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Acciones Rápidas')

    await expect(page.locator('button').filter({ hasText: 'Nueva Cita' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Gestionar Pacientes' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Agenda Doctores' })).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Reportes' })).toBeVisible()
  })

  test('should navigate to booking when clicking Nueva Cita', async ({ page }) => {
    const newAppointmentButton = page.locator('button').filter({ hasText: 'Nueva Cita' })
    await newAppointmentButton.click()

    await expect(page).toHaveURL('/booking')
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
    await expect(page.locator('h1')).toContainText('Clínica San Rafael')
    await expect(page.locator('p')).toContainText('Gestión completa de tu clinica')
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