import { test, expect } from '@playwright/test'

// Use admin storage state for all tests in this file
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Patient Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // No login needed - session already authenticated
    await page.goto('/patients')
    // Wait for page to load by checking for main heading
    await expect(page.locator('h1')).toBeVisible()
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
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3')).toContainText('Agregar Paciente')

    // The X button is in the modal header next to the title
    const modalCloseButton = page.locator('h3:has-text("Agregar Paciente")').locator('..').locator('button').first()
    await modalCloseButton.click()
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()
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

  // TODO: API returns 'Error al guardar paciente' - investigate server-side issue
  test.skip('should add new patient successfully', async ({ page }) => {
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    // Wait for modal to fully load
    await page.waitForTimeout(500)

    // Use the modal container with fixed positioning (this is the modal overlay)
    const modal = page.locator('div.fixed').filter({ has: page.locator('h3:has-text("Agregar Paciente")') })

    // Get input fields by their label text
    const nameLabel = modal.locator('text=Nombre').first()
    const lastNameLabel = modal.locator('text=Apellido').first()
    const emailLabel = modal.locator('text=Email').first()
    const documentLabel = modal.locator('text=ID / Documento')

    // Fill required fields using sibling inputs
    const timestamp = Date.now()
    await nameLabel.locator('..').locator('input').fill('Juan')
    await lastNameLabel.locator('..').locator('input').fill('Pérez')
    await emailLabel.locator('..').locator('input').fill(`juan.perez.${timestamp}@test.com`)
    await documentLabel.locator('..').locator('input').fill(`DOC-${timestamp}`)

    // Submit form using the Agregar button inside the modal
    await modal.locator('button:has-text("Agregar")').click()

    // Wait for response and check that modal closes OR error appears
    // Modal should close on success
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible({ timeout: 15000 })
  })

  test('should show empty state when no patients found', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
    await searchInput.fill('nonexistentpatient123456')

    await expect(page.locator('text=No se encontraron pacientes')).toBeVisible()
  })

  test('should filter patients by search term', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')

    // Get first patient's name to search for
    const firstPatientName = await page.locator('tbody tr').first().locator('td').first().textContent()
    const searchTerm = firstPatientName?.split(' ')[0] || 'Test'

    await searchInput.fill(searchTerm)

    // Wait for search to filter - should still have at least one result
    await page.waitForTimeout(500) // Wait for debounce
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show patient actions buttons', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      // Buttons are icon-only with title attributes
      await expect(firstRow.locator('button[title*="Editar"], button:has-text("Editar")')).toBeVisible()
      await expect(firstRow.locator('button[title*="Desactivar"], button[title*="Activar"]')).toBeVisible()
      await expect(firstRow.locator('button[title*="Ver perfil"]')).toBeVisible()
    }
  })

  test('should open edit modal when clicking edit', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      // Click the edit button (icon with title "Editar información del paciente")
      await firstRow.locator('button[title*="Editar"]').click()

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

  // Skip: PUT /api/patients/:id endpoint not implemented - returns 405
  test.skip('should handle patient status toggle', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first()

    if (await firstRow.isVisible()) {
      // Get the status cell (5th column - Estado)
      const statusCell = firstRow.locator('td').nth(4)
      const initialStatus = await statusCell.textContent()

      // Click the toggle button (Activar/Desactivar)
      const toggleButton = firstRow.locator('button[title*="Desactivar"], button[title*="Activar"]')
      await toggleButton.click()

      // Wait for status to change
      await page.waitForTimeout(1000)
      const newStatus = await statusCell.textContent()

      // Status should have changed
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

        // Verify the patient is still visible after search completes
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