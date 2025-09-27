import { test, expect } from '@playwright/test'

test.describe('Agenda Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('[data-testid="email-input"]', 'ana.rodriguez@email.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    // Wait for agenda page with extended timeout
    await page.waitForURL('/agenda', { timeout: 30000 })
    await page.waitForLoadState('networkidle')

    // Wait for page content to load
    await expect(page.locator('h1')).toContainText('Mi Agenda', { timeout: 15000 })
  })

  test('should display doctor agenda page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Mi Agenda', { timeout: 10000 })
    await expect(page.locator('text=Dr. Ana Rodriguez')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Gestiona tu disponibilidad y revisa tus citas')).toBeVisible({ timeout: 10000 })
  })

  test('should show availability schedule section', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Horarios de Disponibilidad')
    await expect(page.locator('text=Configura tus horarios de trabajo para cada día de la semana')).toBeVisible()
  })

  test('should display all days of the week', async ({ page }) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

    for (const day of days) {
      await expect(page.locator(`text=${day}`)).toBeVisible()
    }
  })

  test('should have availability toggle checkboxes', async ({ page }) => {
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(7)

    for (let i = 0; i < 7; i++) {
      await expect(checkboxes.nth(i)).toBeVisible()
    }
  })

  test('should enable time inputs when availability is checked', async ({ page }) => {
    const mondayCheckbox = page.locator('input[type="checkbox"]').first()

    if (!await mondayCheckbox.isChecked()) {
      await mondayCheckbox.check()
    }

    await page.waitForTimeout(2000)

    const timeInputs = page.locator('input[type="time"]')
    await expect(timeInputs.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display appointments for today section', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Citas del Día')

    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()

    const today = new Date().toISOString().split('T')[0]
    await expect(dateInput).toHaveValue(today)
  })

  test('should change date for appointments view', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowString = tomorrow.toISOString().split('T')[0]

    await dateInput.fill(tomorrowString)
    await expect(dateInput).toHaveValue(tomorrowString)
  })

  test('should show appointment actions when appointments exist', async ({ page }) => {
    const appointmentCard = page.locator('.border.rounded-lg.p-4').first()

    if (await appointmentCard.isVisible()) {
      await expect(appointmentCard.locator('button:has-text("Confirmar")')).toBeVisible()
      await expect(appointmentCard.locator('button:has-text("Completar")')).toBeVisible()
      await expect(appointmentCard.locator('button:has-text("Cancelar")')).toBeVisible()
    }
  })

  test('should display empty state when no appointments', async ({ page }) => {
    const futureDate = new Date()
    futureDate.setFullYear(futureDate.getFullYear() + 1)
    const futureDateString = futureDate.toISOString().split('T')[0]

    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill(futureDateString)

    await page.waitForTimeout(2000)

    await expect(page.locator('text=No hay citas programadas para este día')).toBeVisible({ timeout: 15000 })
  })

  test('should update availability settings', async ({ page }) => {
    const mondayCheckbox = page.locator('input[type="checkbox"]').first()

    if (!await mondayCheckbox.isChecked()) {
      await mondayCheckbox.check()
      await page.waitForTimeout(2000)
    }

    const startTimeInput = page.locator('input[type="time"]').first()
    await startTimeInput.fill('08:00')

    const endTimeInput = page.locator('input[type="time"]').nth(1)
    await endTimeInput.fill('18:00')

    const lunchStartInput = page.locator('input[type="time"]').nth(2)
    await lunchStartInput.fill('12:00')

    const lunchEndInput = page.locator('input[type="time"]').nth(3)
    await lunchEndInput.fill('13:30')

    await expect(startTimeInput).toHaveValue('08:00')
    await expect(endTimeInput).toHaveValue('18:00')
    await expect(lunchStartInput).toHaveValue('12:00')
    await expect(lunchEndInput).toHaveValue('13:30')
  })

  test('should show time input labels', async ({ page }) => {
    const mondayCheckbox = page.locator('input[type="checkbox"]').first()

    if (!await mondayCheckbox.isChecked()) {
      await mondayCheckbox.check()
      await page.waitForTimeout(2000)
    }

    await expect(page.locator('label:has-text("Inicio")')).toBeVisible()
    await expect(page.locator('label:has-text("Fin")')).toBeVisible()
    await expect(page.locator('label:has-text("Almuerzo (inicio)")')).toBeVisible()
    await expect(page.locator('label:has-text("Almuerzo (fin)")')).toBeVisible()
  })

  test('should display appointment details', async ({ page }) => {
    const appointmentCard = page.locator('.border.rounded-lg.p-4').first()

    if (await appointmentCard.isVisible()) {
      const patientName = appointmentCard.locator('.font-medium.text-gray-900').first()
      const serviceName = appointmentCard.locator('.text-sm.text-gray-500').first()
      const timeInfo = appointmentCard.locator('.text-sm.text-gray-500').nth(1)
      const statusBadge = appointmentCard.locator('span.px-2.py-1.rounded-full')

      await expect(patientName).toBeVisible()
      await expect(serviceName).toBeVisible()
      await expect(timeInfo).toBeVisible()
      await expect(statusBadge).toBeVisible()
    }
  })

  test('should handle appointment status changes', async ({ page }) => {
    const appointmentCard = page.locator('.border.rounded-lg.p-4').first()

    if (await appointmentCard.isVisible()) {
      const confirmButton = appointmentCard.locator('button:has-text("Confirmar")')

      if (await confirmButton.isVisible()) {
        await confirmButton.click()
        await page.waitForTimeout(2000)
      }
    }
  })

  test('should maintain responsive design', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h2')).toContainText('Horarios de Disponibilidad')
    await expect(page.locator('h2')).toContainText('Citas del Día')

    await page.setViewportSize({ width: 1200, height: 800 })

    await expect(page.locator('.grid.grid-cols-1.lg\\:grid-cols-2')).toBeVisible()
  })
})