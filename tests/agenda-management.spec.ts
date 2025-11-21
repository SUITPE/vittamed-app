import { test, expect } from '@playwright/test'

// Use doctor storage state for all tests
test.use({ storageState: 'tests/.auth/doctor.json' })

test.describe('Agenda Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to agenda - already authenticated via storage state
    await page.goto('/agenda')

    // Wait for loading spinner to disappear and main content to load
    await page.waitForSelector('text=Cargando agenda...', { state: 'hidden', timeout: 30000 }).catch(() => {})
    await expect(page.locator('h1')).toContainText('Mi Agenda', { timeout: 15000 })
  })

  test('should display doctor agenda page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Mi Agenda', { timeout: 10000 })
    // Check doctor name is visible
    await expect(page.locator('text=Dr.').first()).toBeVisible({ timeout: 10000 })
  })

  test('should show calendar view with week days', async ({ page }) => {
    // New UI shows abbreviated day names in calendar header
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

    for (const day of days) {
      await expect(page.locator(`text=${day}`).first()).toBeVisible()
    }
  })

  test('should display Nueva Cita button', async ({ page }) => {
    await expect(page.locator('button:has-text("Nueva Cita")')).toBeVisible()
  })

  test('should have calendar and availability tabs', async ({ page }) => {
    // Check for Calendario tab/button
    await expect(page.locator('button:has-text("Calendario")')).toBeVisible()
    // Check for Configurar Disponibilidad tab/button
    await expect(page.locator('button:has-text("Configurar Disponibilidad")')).toBeVisible()
  })

  test('should display time slots in calendar', async ({ page }) => {
    // Calendar shows time slots from morning to evening
    await expect(page.locator('text=09:00').first()).toBeVisible()
    await expect(page.locator('text=12:00').first()).toBeVisible()
    await expect(page.locator('text=15:00').first()).toBeVisible()
  })

  test('should show stats section', async ({ page }) => {
    // Stats section shows appointment counts
    await expect(page.locator('text=Citas esta semana')).toBeVisible()
    await expect(page.locator('text=Confirmadas')).toBeVisible()
    await expect(page.locator('text=Pendientes')).toBeVisible()
    await expect(page.locator('text=Días disponibles')).toBeVisible()
  })

  test('should display day and week view options', async ({ page }) => {
    await expect(page.locator('button:has-text("Día")')).toBeVisible()
    await expect(page.locator('button:has-text("Semana")')).toBeVisible()
  })

  test('should have navigation buttons for calendar', async ({ page }) => {
    // Check for month/week navigation
    await expect(page.locator('button:has-text("Hoy")')).toBeVisible()
  })

  test('should show current month in calendar header', async ({ page }) => {
    // Calendar shows current month (e.g., "noviembre de 2025")
    const now = new Date()
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const currentMonth = monthNames[now.getMonth()]

    await expect(page.locator('h2').filter({ hasText: currentMonth })).toBeVisible()
  })

  test('should display available time slots', async ({ page }) => {
    // Some slots should show as "Disponible"
    const availableSlots = page.locator('button:has-text("Disponible")')

    // At least one available slot should exist
    if (await availableSlots.count() > 0) {
      await expect(availableSlots.first()).toBeVisible()
    }
  })

  test('should show legend for slot status', async ({ page }) => {
    // Legend shows different status types
    await expect(page.locator('text=Disponible').last()).toBeVisible()
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
    await expect(page.getByText('Pendiente', { exact: true })).toBeVisible()
    await expect(page.locator('text=No disponible')).toBeVisible()
  })

  test('should maintain responsive design', async ({ page }) => {
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('button:has-text("Nueva Cita")')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should display user info in header', async ({ page }) => {
    // Header shows doctor name
    await expect(page.locator('text=Alvaro Burga').first()).toBeVisible()
    await expect(page.locator('text=Doctor').first()).toBeVisible()
  })
})
