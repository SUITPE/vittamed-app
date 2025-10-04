import { test, expect } from '@playwright/test'

test.describe('Patient Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')

    await page.fill('input[type="email"]', 'admin@clinicasanrafael.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard/**', { timeout: 15000 })
    await page.goto('/patients')
  })

  test('should display patients page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Pacientes')
    await expect(page.locator('text=Administra la información de tus pacientes')).toBeVisible()
    await expect(page.locator('button').filter({ hasText: 'Agregar Paciente' })).toBeVisible()
  })

  test('should show patients table', async ({ page }) => {
    await expect(page.locator('h2:has-text("Lista de Pacientes")')).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Paciente' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Documento' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Contacto' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Fecha de Nacimiento' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Estado' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Acciones' })).toBeVisible()
  })

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
    await expect(searchInput).toBeVisible()

    await searchInput.fill('test')
    await expect(searchInput).toHaveValue('test')
  })

  test('should open add patient modal', async ({ page }) => {
    await page.click('button:has-text("Agregar Paciente")')

    await expect(page.locator('h3')).toContainText('Agregar Paciente')
    await expect(page.locator('label:has-text("Nombre")')).toBeVisible()
    await expect(page.locator('label:has-text("Apellido")')).toBeVisible()
    await expect(page.locator('label:has-text("Email")')).toBeVisible()
    await expect(page.locator('label:has-text("ID / Documento")')).toBeVisible()
    await expect(page.locator('label:has-text("Teléfono")')).toBeVisible()
    await expect(page.locator('label:has-text("Fecha de Nacimiento")')).toBeVisible()
    await expect(page.locator('label:has-text("Dirección")')).toBeVisible()
    await expect(page.locator('label:has-text("Historial Médico")')).toBeVisible()
  })

  test('should close modal when clicking cancel or X', async ({ page }) => {
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3')).toContainText('Agregar Paciente')

    await page.click('button:has-text("Cancelar")')
    await expect(page.locator('h3')).not.toBeVisible()

    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3')).toContainText('Agregar Paciente')

    await page.locator('svg').nth(0).click()
    await expect(page.locator('h3')).not.toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Agregar Paciente")')

    // Wait for modal to open
    await page.waitForSelector('h3:has-text("Agregar Paciente")')

    // Get inputs from the modal specifically
    const modal = page.locator('div.fixed')
    const nameInput = modal.locator('input[type="text"]').first()
    const lastNameInput = modal.locator('input[type="text"]').nth(1)
    const emailInput = modal.locator('input[type="email"]')
    const documentInput = modal.locator('input[placeholder*="DNI"]')

    await expect(nameInput).toHaveAttribute('required', '')
    await expect(lastNameInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(documentInput).toHaveAttribute('required', '')
  })

  test('should add new patient successfully', async ({ page }) => {
    await page.click('button:has-text("Agregar Paciente")')

    await page.fill('input[type="text"]', 'Juan')
    await page.fill('input[type="text"]', 'Pérez')
    await page.fill('input[type="email"]', 'juan.perez@test.com')
    await page.fill('input[type="tel"]', '+52 1234567890')
    await page.fill('input[type="date"]', '1990-01-01')
    await page.fill('textarea', 'Calle Principal 123')

    await page.click('button:has-text("Agregar")')

    await expect(page.locator('h3')).not.toBeVisible()
  })

  test('should show empty state when no patients found', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
    await searchInput.fill('nonexistentpatient123456')

    await expect(page.locator('text=No se encontraron pacientes')).toBeVisible()
  })

  test('should filter patients by search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')

    await searchInput.fill('example')

    await page.waitForTimeout(500)

    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(1)
  })

  test('should show patient actions buttons', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      await expect(firstRow.locator('button:has-text("Editar")')).toBeVisible()

      const toggleButton = firstRow.locator('button').nth(1)
      await expect(toggleButton).toBeVisible()
    }
  })

  test('should open edit modal when clicking edit', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      await firstRow.locator('button:has-text("Editar")').click()

      await expect(page.locator('h3')).toContainText('Editar Paciente')
      await expect(page.locator('button:has-text("Actualizar")')).toBeVisible()
    }
  })

  test('should display patient count', async ({ page }) => {
    const countText = page.locator('h2:has-text("Lista de Pacientes")')
    await expect(countText).toBeVisible()

    const fullText = await countText.textContent()
    expect(fullText).toMatch(/Lista de Pacientes \(\d+\)/)
  })

  test('should handle patient status toggle', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      const statusBadge = firstRow.locator('span.px-2.py-1.rounded-full')
      const initialStatus = await statusBadge.textContent()

      const toggleButton = firstRow.locator('button').nth(1)
      await toggleButton.click()

      await page.waitForTimeout(1000)

      const newStatus = await statusBadge.textContent()
      expect(newStatus).not.toBe(initialStatus)
    }
  })

  test('should search patients by document number', async ({ page }) => {
    // Get first patient's document number
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      const documentCell = firstRow.locator('td').nth(1) // Document is 2nd column
      const documentText = await documentCell.textContent()

      if (documentText && documentText !== 'No registrado') {
        // Search using first few characters of document
        const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
        const searchTerm = documentText.trim().substring(0, 5)
        await searchInput.fill(searchTerm)

        await page.waitForTimeout(500)

        // Verify the patient is still visible
        await expect(page.locator(`text=${documentText}`)).toBeVisible()
      }
    }
  })

  test('should display document in patient table', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      const documentCell = firstRow.locator('td').nth(1)
      await expect(documentCell).toBeVisible()

      // Document should either show a value or "No registrado"
      const documentText = await documentCell.textContent()
      expect(documentText).toBeTruthy()
    }
  })
})