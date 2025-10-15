/**
 * E2E TESTS - Patient CRUD Operations
 * End-to-end tests for complete patient management workflows including document field
 */

import { test, expect } from '@playwright/test'

// Use admin storage state for all tests
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Patient CRUD - E2E Tests', () => {
  const timestamp = Date.now()
  const testPatient = {
    firstName: 'E2E',
    lastName: 'TestPatient',
    email: `e2e.patient.${timestamp}@test.com`,
    document: `DOC-${timestamp}`,
    phone: '+51 987654321',
    dateOfBirth: '1990-01-15',
    address: 'Av. Test 123, Lima',
    medicalHistory: 'Sin antecedentes médicos relevantes'
  }

  test.beforeEach(async ({ page }) => {
    // Navigate to patients page - already authenticated via storage state
    await page.goto('/patients')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('E2E-01: Complete patient creation flow with document field', async ({ page }) => {
    // Step 1: Verify patients page loaded
    await expect(page.locator('h1')).toContainText('Pacientes')

    // Step 2: Open add patient modal
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    // Step 3: Verify document field exists and is required
    const documentInput = page.locator('input').filter({ has: page.locator('xpath=./preceding-sibling::label[contains(text(), "Documento")]') }).first()
    await expect(documentInput).toBeVisible()
    await expect(documentInput).toHaveAttribute('required', '')

    // Step 4: Fill all fields including document
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill(testPatient.firstName)
    await inputs.nth(1).fill(testPatient.lastName)

    await page.locator('input[type="email"]').fill(testPatient.email)

    // Fill document field
    await page.locator('input[placeholder*="DNI"]').fill(testPatient.document)

    await page.locator('input[type="tel"]').fill(testPatient.phone)
    await page.locator('input[type="date"]').fill(testPatient.dateOfBirth)

    const textareas = page.locator('textarea')
    await textareas.nth(0).fill(testPatient.address)
    await textareas.nth(1).fill(testPatient.medicalHistory)

    // Step 5: Submit form
    await page.click('button:has-text("Agregar")')

    // Step 6: Verify modal closes
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible({ timeout: 5000 })

    // Step 7: Verify patient appears in table with document
    await expect(page.locator(`text=${testPatient.email}`)).toBeVisible()
    await expect(page.locator(`text=${testPatient.document}`)).toBeVisible()
  })

  test('E2E-02: Document field validation - cannot submit without document', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("Agregar Paciente")')

    // Fill all fields EXCEPT document
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('Without')
    await inputs.nth(1).fill('Document')
    await page.locator('input[type="email"]').fill('nodoc@test.com')

    // Try to submit - should fail due to HTML5 validation
    await page.click('button:has-text("Agregar")')

    // Modal should still be visible (form didn't submit)
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()
  })

  test('E2E-03: Search patients by document number', async ({ page }) => {
    // First create a patient with unique document
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    const uniqueDoc = `SEARCH-${Date.now()}`
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('Search')
    await inputs.nth(1).fill('Test')
    await page.locator('input[type="email"]').fill(`search.${Date.now()}@test.com`)
    await page.locator('input[placeholder*="DNI"]').fill(uniqueDoc)

    await page.click('button:has-text("Agregar")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    // Now search for this patient by document
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
    await searchInput.fill(uniqueDoc)
    await expect(page.locator('tbody tr')).toHaveCount(1)

    // Verify only matching patient is shown
    await expect(page.locator(`text=${uniqueDoc}`)).toBeVisible()
  })

  test('E2E-04: Edit patient and update document', async ({ page }) => {
    // Find the first patient row
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    // Click edit button
    await firstRow.locator('button:has-text("Editar")').click()

    // Verify edit modal opened
    await expect(page.locator('h3:has-text("Editar Paciente")')).toBeVisible()

    // Update document field
    const newDocument = `UPDATED-${Date.now()}`
    const documentInput = page.locator('input[placeholder*="DNI"]')
    await documentInput.clear()
    await documentInput.fill(newDocument)

    // Submit update
    await page.click('button:has-text("Actualizar")')

    // Verify modal closed
    await expect(page.locator('h3:has-text("Editar Paciente")')).not.toBeVisible({ timeout: 5000 })

    // Verify updated document appears in table
    await expect(page.locator(`text=${newDocument}`)).toBeVisible()
  })

  test('E2E-05: Patient table displays document column', async ({ page }) => {
    // Verify document column header exists
    await expect(page.locator('th:has-text("Documento")')).toBeVisible()

    // Verify at least one patient has document displayed
    const firstPatientRow = page.locator('tbody tr').first()
    if (await firstPatientRow.isVisible()) {
      const cells = firstPatientRow.locator('td')
      const documentCell = cells.nth(1) // Second column (after Paciente)
      await expect(documentCell).toBeVisible()
    }
  })

  test('E2E-06: Toggle patient status preserves document', async ({ page }) => {
    // Get first patient's document
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    const documentCell = firstRow.locator('td').nth(1)
    const originalDocument = await documentCell.textContent()

    // Toggle status
    const toggleButton = firstRow.locator('button').nth(1)
    await toggleButton.click()

    // Wait for status badge to update (indicates operation completed)
    const statusBadge = firstRow.locator('span.px-2.py-1.rounded-full')
    await expect(statusBadge).toBeVisible()

    // Verify document is still the same
    const updatedDocumentCell = page.locator('tbody tr').first().locator('td').nth(1)
    const updatedDocument = await updatedDocumentCell.textContent()
    expect(updatedDocument).toBe(originalDocument)
  })

  test('E2E-07: Verify document field in different patient states', async ({ page }) => {
    const uniqueId = Date.now()

    // Create patient
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('State')
    await inputs.nth(1).fill('Test')
    await page.locator('input[type="email"]').fill(`state.${uniqueId}@test.com`)
    await page.locator('input[placeholder*="DNI"]').fill(`STATE-${uniqueId}`)

    await page.click('button:has-text("Agregar")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    // Verify in active state
    await expect(page.locator(`text=STATE-${uniqueId}`)).toBeVisible()

    // Edit and verify document is editable
    const targetRow = page.locator(`tr:has-text("STATE-${uniqueId}")`).first()
    await targetRow.locator('button:has-text("Editar")').click()
    await expect(page.locator('h3:has-text("Editar Paciente")')).toBeVisible()

    const documentInput = page.locator('input[placeholder*="DNI"]')
    await expect(documentInput).toBeEnabled()
    await expect(documentInput).toHaveValue(`STATE-${uniqueId}`)

    // Close modal without saving
    await page.click('button:has-text("Cancelar")')
    await expect(page.locator('h3:has-text("Editar Paciente")')).not.toBeVisible()
  })

  test('E2E-08: Patient count updates after operations', async ({ page }) => {
    // Get initial count
    const countText = await page.locator('h2:has-text("Lista de Pacientes")').textContent()
    const initialCount = parseInt(countText?.match(/\((\d+)\)/)?.[1] || '0')

    // Add new patient
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    const uniqueId = Date.now()
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('Count')
    await inputs.nth(1).fill('Test')
    await page.locator('input[type="email"]').fill(`count.${uniqueId}@test.com`)
    await page.locator('input[placeholder*="DNI"]').fill(`COUNT-${uniqueId}`)

    await page.click('button:has-text("Agregar")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    // Verify patient is in table
    await expect(page.locator(`text=COUNT-${uniqueId}`)).toBeVisible()

    // Verify count increased
    const newCountText = await page.locator('h2:has-text("Lista de Pacientes")').textContent()
    const newCount = parseInt(newCountText?.match(/\((\d+)\)/)?.[1] || '0')
    expect(newCount).toBe(initialCount + 1)
  })

  test('E2E-09: Search by partial document number', async ({ page }) => {
    // Create patient with known document
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    const uniqueDoc = `PARTIAL-${Date.now()}`
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('Partial')
    await inputs.nth(1).fill('Search')
    await page.locator('input[type="email"]').fill(`partial.${Date.now()}@test.com`)
    await page.locator('input[placeholder*="DNI"]').fill(uniqueDoc)

    await page.click('button:has-text("Agregar")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    // Search with partial document (first 7 chars)
    const searchInput = page.locator('input[placeholder="Buscar pacientes..."]')
    await searchInput.fill(uniqueDoc.substring(0, 7))

    // Should find the patient
    await expect(page.locator(`text=${uniqueDoc}`)).toBeVisible()
  })

  test('E2E-10: Complete CRUD cycle with document tracking', async ({ page }) => {
    const cycleId = Date.now()
    const originalDoc = `CYCLE-${cycleId}`
    const updatedDoc = `CYCLE-UPDATED-${cycleId}`

    // CREATE
    await page.click('button:has-text("Agregar Paciente")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).toBeVisible()

    const inputs = page.locator('input[type="text"]')
    await inputs.nth(0).fill('Cycle')
    await inputs.nth(1).fill('Test')
    await page.locator('input[type="email"]').fill(`cycle.${cycleId}@test.com`)
    await page.locator('input[placeholder*="DNI"]').fill(originalDoc)
    await page.click('button:has-text("Agregar")')
    await expect(page.locator('h3:has-text("Agregar Paciente")')).not.toBeVisible()

    // READ - verify created
    await expect(page.locator(`text=${originalDoc}`)).toBeVisible()

    // UPDATE
    const targetRow = page.locator(`tr:has-text("${originalDoc}")`).first()
    await targetRow.locator('button:has-text("Editar")').click()
    await expect(page.locator('h3:has-text("Editar Paciente")')).toBeVisible()

    const documentInput = page.locator('input[placeholder*="DNI"]')
    await documentInput.clear()
    await documentInput.fill(updatedDoc)
    await page.click('button:has-text("Actualizar")')
    await expect(page.locator('h3:has-text("Editar Paciente")')).not.toBeVisible()

    // Verify update
    await expect(page.locator(`text=${updatedDoc}`)).toBeVisible()
    await expect(page.locator(`text=${originalDoc}`)).not.toBeVisible()

    // DEACTIVATE (soft delete)
    const updatedRow = page.locator(`tr:has-text("${updatedDoc}")`).first()
    const toggleButton = updatedRow.locator('button').nth(1)
    await toggleButton.click()

    // Verify status changed by waiting for status badge text to update
    const statusBadge = updatedRow.locator('span.px-2.py-1.rounded-full')
    await expect(statusBadge).toContainText('Inactivo')
  })
})
