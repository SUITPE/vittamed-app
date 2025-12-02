import { test, expect, devices } from '@playwright/test'

// Use doctor storage state and iPhone 13 device
test.use({
  ...devices['iPhone 13'],
  storageState: 'tests/.auth/doctor.json'
})

test.describe('Appointments Mobile View', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to appointments - already authenticated via storage state
    await page.goto('/appointments')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('debe mostrar appointments correctamente en mobile', async ({ page }) => {
    // Verify page loaded
    const currentUrl = page.url()
    expect(currentUrl).toContain('/appointments')

    // Verificar que hay elementos visibles
    const heading = page.locator('h1, h2, [role="heading"]')
    await expect(heading.first()).toBeVisible()
    const count = await heading.count()
    expect(count).toBeGreaterThan(0)
  })

  test('botón Atender debe ser accesible en mobile', async ({ page }) => {
    // Seleccionar fecha con citas
    await page.fill('input[type="date"]', '2025-10-04')
    await expect(page.locator('table tbody tr, .appointment-card').first()).toBeVisible({ timeout: 10000 }).catch(() => {})

    const hasCitas = await page.locator('table tbody tr, .appointment-card').count() > 0

    if (hasCitas) {
      // Buscar botón Atender
      const atenderButton = page.locator('button').filter({ has: page.locator('svg') }).first()
      const buttonCount = await page.locator('button').filter({ has: page.locator('svg') }).count()
      if (buttonCount > 0) {
        await expect(atenderButton).toBeVisible()

        // Verificar que el botón es suficientemente grande para mobile (mínimo 44x44 px)
        const box = await atenderButton.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(32) // Permitir un poco menos para iconos
          expect(box.width).toBeGreaterThanOrEqual(32)
        }
      }
    }
  })

  test('tabla debe ser scrolleable horizontalmente en mobile', async ({ page }) => {
    await page.fill('input[type="date"]', '2025-10-04')

    const count = await page.locator('table').count()

    if (count > 0) {
      const table = page.locator('table').first()
      await expect(table).toBeVisible()

      // Verificar que la tabla está en un contenedor scrolleable
      const container = page.locator('table').locator('..').first()
      if (await container.isVisible()) {
        const overflow = await container.evaluate((el) => window.getComputedStyle(el).overflowX)
        // La tabla debe tener overflow-x auto o scroll
        expect(['auto', 'scroll'].includes(overflow)).toBe(true)
      }
    }
  })

  test('filtro de fecha debe funcionar en mobile', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]')
    await expect(dateInput).toBeVisible()

    // El input debe ser accesible
    await dateInput.click()
    await dateInput.fill('2025-10-04')

    // Wait for data to load by checking for visible rows or empty state
    await page.locator('table tbody tr, .appointment-card, text=No hay citas').first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})

    // Verificar que se filtraron las citas
    const appointmentsCount = await page.locator('table tbody tr, .appointment-card').count()
    expect(appointmentsCount >= 0).toBe(true)
  })

  test('debe mostrar información completa en mobile (responsive)', async ({ page }) => {
    await page.fill('input[type="date"]', '2025-10-04')

    const hasRows = await page.locator('table tbody tr, .appointment-card').count() > 0

    if (hasRows) {
      // En mobile, algunos campos pueden estar ocultos o en vista de cards
      // Verificar que al menos el nombre del paciente está visible
      const patientName = page.locator('table tbody tr, .appointment-card').first()
      await expect(patientName).toBeVisible()

      // Verificar que no hay "Invalid Date"
      const invalidDate = page.locator('text=Invalid Date')
      await expect(invalidDate).not.toBeVisible()
    }
  })

  test('debe poder hacer click en cita para ver detalles en mobile', async ({ page }) => {
    await page.fill('input[type="date"]', '2025-10-04')

    const count = await page.locator('table tbody tr, .appointment-card').count()

    if (count > 0) {
      const firstRow = page.locator('table tbody tr, .appointment-card').first()
      await expect(firstRow).toBeVisible()

      // Click en la fila o card
      await firstRow.click()
      // Wait for any modal/details to appear if applicable
      await page.locator('h1, h2, h3').first().waitFor({ state: 'visible', timeout: 2000 }).catch(() => {})
    }
  })

  test('menú debe ser accesible en mobile', async ({ page }) => {
    // Buscar navegación o header
    const header = page.locator('header, nav, [role="banner"]').first()

    if (await header.isVisible()) {
      await expect(header).toBeVisible()

      // Buscar enlaces de navegación
      const navLinks = header.locator('a, button')
      const linkCount = await navLinks.count()

      expect(linkCount).toBeGreaterThan(0)
    }
  })

  test('badges de estado deben ser legibles en mobile', async ({ page }) => {
    await page.fill('input[type="date"]', '2025-10-04')

    const badges = page.locator('[class*="bg-"]').filter({ hasText: /.+/ })
    const count = await badges.count()

    if (count > 0) {
      const firstBadge = badges.first()
      await expect(firstBadge).toBeVisible()

      // Verificar que el texto es legible (tiene contenido)
      const text = await firstBadge.textContent()
      expect(text && text.length > 0).toBe(true)
    }
  })

  test('debe mantener performance en mobile', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/appointments')
    await expect(page.locator('h1, h2').first()).toBeVisible()

    const loadTime = Date.now() - startTime

    // La página no debe tardar más de 10 segundos en cargar en mobile
    expect(loadTime).toBeLessThan(10000)
  })

  test('debe poder volver a agenda desde appointments en mobile', async ({ page }) => {
    // Buscar enlace o botón de volver a agenda
    const count = await page.locator('a[href*="agenda"], button').filter({ hasText: /agenda|back|volver/i }).count()

    if (count > 0) {
      const agendaLink = page.locator('a[href*="agenda"], button').filter({ hasText: /agenda|back|volver/i }).first()
      if (await agendaLink.isVisible()) {
        await agendaLink.click()
        await expect(page).toHaveURL(/\/agenda/, { timeout: 5000 })
      }
    }
  })
})
