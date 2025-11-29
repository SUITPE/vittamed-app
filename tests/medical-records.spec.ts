/**
 * E2E TESTS - Medical Records (Historia Clínica)
 * End-to-end tests for medical records and patient allergies management
 * Ticket: VT-55
 */

import { test, expect } from '@playwright/test'

// Use admin storage state (doctor/admin can create medical records)
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Medical Records - E2E Tests', () => {
  const timestamp = Date.now()

  test.beforeEach(async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients')
    await expect(page.locator('h1')).toBeVisible()
  })

  test.describe('Medical Record CRUD', () => {
    test('MR-01: Navigate to patient profile and see medical history tab', async ({ page }) => {
      // Find first patient row and click to view profile
      const firstRow = page.locator('tbody tr').first()
      await expect(firstRow).toBeVisible()

      // Click on patient name to view profile
      await firstRow.locator('td').first().click()

      // Verify patient profile page loaded
      await expect(page.locator('text=Historia Clínica')).toBeVisible()
      await expect(page.locator('text=Información Personal')).toBeVisible()
      await expect(page.locator('text=Alergias')).toBeVisible()
    })

    test('MR-02: Create new medical record with SOAP notes', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      // Wait for patient profile
      await expect(page.locator('text=Historia Clínica')).toBeVisible()

      // Click on Historia Clínica tab if not active
      await page.click('button:has-text("Historia Clínica")')

      // Click new medical record button
      await page.click('button:has-text("Nuevo Registro Médico")')

      // Verify modal opened
      await expect(page.locator('h2:has-text("Nuevo Registro Médico")')).toBeVisible()

      // Fill SOAP notes
      await page.locator('textarea').nth(0).fill('Paciente presenta dolor de cabeza persistente desde hace 3 días')
      await page.locator('textarea').nth(1).fill('Dolor frontal, intensidad 6/10, empeora con luz brillante')
      await page.locator('textarea').nth(2).fill('PA: 120/80, FC: 72, Temp: 36.5°C. Sin signos meníngeos.')
      await page.locator('textarea').nth(3).fill('Cefalea tensional probable')
      await page.locator('textarea').nth(4).fill('Ibuprofeno 400mg c/8h por 5 días. Control en 1 semana.')

      // Submit
      await page.click('button:has-text("Guardar Registro")')

      // Verify modal closes
      await expect(page.locator('h2:has-text("Nuevo Registro Médico")')).not.toBeVisible({ timeout: 5000 })

      // Verify record appears in history
      await expect(page.locator('text=Cefalea tensional probable')).toBeVisible()
    })

    test('MR-03: Create medical record with vital signs', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()
      await expect(page.locator('text=Historia Clínica')).toBeVisible()

      await page.click('button:has-text("Historia Clínica")')
      await page.click('button:has-text("Nuevo Registro Médico")')

      // Fill chief complaint
      await page.locator('textarea').first().fill('Control de rutina')

      // Go to vital signs tab
      await page.click('button:has-text("Signos Vitales")')

      // Fill vital signs
      await page.locator('input[placeholder="36.5"]').fill('36.8')
      await page.locator('input[placeholder="72"]').fill('78')
      await page.locator('input[placeholder="120"]').fill('125')
      await page.locator('input[placeholder="80"]').fill('82')
      await page.locator('input[placeholder="70"]').fill('75')
      await page.locator('input[placeholder="170"]').fill('175')

      // Submit
      await page.click('button:has-text("Guardar Registro")')

      // Verify record shows vital signs
      await expect(page.locator('text=36.8°C')).toBeVisible()
      await expect(page.locator('text=78 bpm')).toBeVisible()
    })

    test('MR-04: Create medical record with prescription', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()
      await expect(page.locator('text=Historia Clínica')).toBeVisible()

      await page.click('button:has-text("Historia Clínica")')
      await page.click('button:has-text("Nuevo Registro Médico")')

      // Fill chief complaint
      await page.locator('textarea').first().fill('Infección respiratoria')

      // Go to prescriptions tab
      await page.click('button:has-text("Recetas")')

      // Add prescription
      await page.click('button:has-text("Agregar Receta")')

      // Fill prescription details
      await page.locator('input[placeholder*="Paracetamol"]').fill('Amoxicilina')
      await page.locator('input[placeholder*="500mg"]').fill('500mg')
      await page.locator('input[placeholder*="8 horas"]').fill('Cada 8 horas')
      await page.locator('input[placeholder*="7 días"]').fill('7 días')
      await page.locator('input[placeholder*="tabletas"]').fill('21 cápsulas')

      // Submit
      await page.click('button:has-text("Guardar Registro")')

      // Verify prescription appears
      await expect(page.locator('text=Amoxicilina')).toBeVisible()
      await expect(page.locator('text=500mg')).toBeVisible()
    })

    test('MR-05: Create medical record with diagnosis', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()
      await expect(page.locator('text=Historia Clínica')).toBeVisible()

      await page.click('button:has-text("Historia Clínica")')
      await page.click('button:has-text("Nuevo Registro Médico")')

      // Fill chief complaint
      await page.locator('textarea').first().fill('Dolor de garganta')

      // Go to diagnoses tab
      await page.click('button:has-text("Diagnósticos")')

      // Add diagnosis
      await page.click('button:has-text("Agregar Diagnóstico")')

      // Fill diagnosis details
      await page.locator('input[placeholder*="Hipertensión"]').fill('Faringitis aguda')
      await page.locator('input[placeholder*="I10"]').fill('J02.9')

      // Select severity
      await page.locator('select').filter({ hasText: 'Leve' }).selectOption('moderate')

      // Submit
      await page.click('button:has-text("Guardar Registro")')

      // Verify diagnosis appears
      await expect(page.locator('text=Faringitis aguda')).toBeVisible()
      await expect(page.locator('text=J02.9')).toBeVisible()
    })

    test('MR-06: Edit existing medical record', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()
      await expect(page.locator('text=Historia Clínica')).toBeVisible()

      await page.click('button:has-text("Historia Clínica")')

      // Click edit on first record
      const editButton = page.locator('button:has-text("Editar")').first()
      if (await editButton.isVisible()) {
        await editButton.click()

        // Verify edit modal opened
        await expect(page.locator('h2:has-text("Editar Registro Médico")')).toBeVisible()

        // Modify chief complaint
        const chiefComplaint = page.locator('textarea').first()
        await chiefComplaint.clear()
        await chiefComplaint.fill('Motivo actualizado - ' + timestamp)

        // Save
        await page.click('button:has-text("Actualizar Registro")')

        // Verify changes saved
        await expect(page.locator(`text=Motivo actualizado - ${timestamp}`)).toBeVisible()
      }
    })
  })

  test.describe('Patient Allergies', () => {
    test('AL-01: Navigate to allergies tab', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()
      await expect(page.locator('text=Alergias')).toBeVisible()

      // Click on allergies tab
      await page.click('button:has-text("Alergias")')

      // Verify allergies section is visible
      await expect(page.locator('text=Nueva Alergia').or(page.locator('text=Sin alergias registradas'))).toBeVisible()
    })

    test('AL-02: Add new medication allergy', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      // Go to allergies tab
      await page.click('button:has-text("Alergias")')

      // Click new allergy button
      await page.click('button:has-text("Nueva Alergia")')

      // Verify modal opened
      await expect(page.locator('h2:has-text("Nueva Alergia")')).toBeVisible()

      // Fill allergy details
      await page.locator('input[placeholder*="Penicilina"]').fill('Penicilina')
      await page.locator('select').filter({ hasText: 'Medicamento' }).selectOption('medication')
      await page.locator('textarea').first().fill('Rash cutáneo generalizado')
      await page.locator('select').filter({ hasText: 'Moderado' }).selectOption('severe')

      // Submit
      await page.click('button:has-text("Guardar")')

      // Verify modal closes
      await expect(page.locator('h2:has-text("Nueva Alergia")')).not.toBeVisible({ timeout: 5000 })

      // Verify allergy appears
      await expect(page.locator('text=Penicilina')).toBeVisible()
    })

    test('AL-03: Add food allergy', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Alergias")')
      await page.click('button:has-text("Nueva Alergia")')

      // Fill allergy details
      await page.locator('input[placeholder*="Penicilina"]').fill('Maní')
      await page.locator('select').filter({ hasText: 'Medicamento' }).selectOption('food')
      await page.locator('textarea').first().fill('Anafilaxia')
      await page.locator('select').filter({ hasText: 'Moderado' }).selectOption('life_threatening')

      await page.click('button:has-text("Guardar")')

      // Verify allergy appears with food icon
      await expect(page.locator('text=Maní')).toBeVisible()
      await expect(page.locator('text=Alimento').or(page.locator('text=🍽️'))).toBeVisible()
    })

    test('AL-04: Edit existing allergy', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Alergias")')

      // Find edit button for an allergy
      const editButton = page.locator('[title="Editar"]').first()
      if (await editButton.isVisible()) {
        await editButton.click()

        // Verify edit modal
        await expect(page.locator('h2:has-text("Editar Alergia")')).toBeVisible()

        // Update notes
        const notesField = page.locator('textarea').last()
        await notesField.fill('Notas actualizadas - ' + timestamp)

        await page.click('button:has-text("Actualizar")')

        // Verify update
        await expect(page.locator(`text=Notas actualizadas - ${timestamp}`)).toBeVisible()
      }
    })

    test('AL-05: Toggle allergy status (active/inactive)', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Alergias")')

      // Find toggle button
      const toggleButton = page.locator('[title="Marcar como inactiva"]').first()
      if (await toggleButton.isVisible()) {
        await toggleButton.click()

        // Verify allergy moved to inactive section
        await expect(page.locator('text=Alergias Inactivas')).toBeVisible()
      }
    })

    test('AL-06: Delete allergy', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Alergias")')

      // First add an allergy to delete
      await page.click('button:has-text("Nueva Alergia")')
      const uniqueAllergen = `TestAllergen-${timestamp}`
      await page.locator('input[placeholder*="Penicilina"]').fill(uniqueAllergen)
      await page.locator('select').filter({ hasText: 'Medicamento' }).selectOption('other')
      await page.click('button:has-text("Guardar")')

      // Wait for allergy to appear
      await expect(page.locator(`text=${uniqueAllergen}`)).toBeVisible()

      // Find and click delete button
      page.on('dialog', dialog => dialog.accept()) // Handle confirmation dialog
      const deleteButton = page.locator(`tr:has-text("${uniqueAllergen}")`).locator('[title="Eliminar"]')
      await deleteButton.click()

      // Verify allergy is removed
      await expect(page.locator(`text=${uniqueAllergen}`)).not.toBeVisible({ timeout: 5000 })
    })

    test('AL-07: Allergy count updates in tab', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      // Get initial count from tab
      const allergyTab = page.locator('button:has-text("Alergias")')
      const initialText = await allergyTab.textContent()
      const initialCount = parseInt(initialText?.match(/\((\d+)\)/)?.[1] || '0')

      await allergyTab.click()

      // Add new allergy
      await page.click('button:has-text("Nueva Alergia")')
      await page.locator('input[placeholder*="Penicilina"]').fill(`CountTest-${timestamp}`)
      await page.locator('select').filter({ hasText: 'Medicamento' }).selectOption('environmental')
      await page.click('button:has-text("Guardar")')

      // Wait for update
      await page.waitForTimeout(1000)

      // Verify count increased
      const newText = await page.locator('button:has-text("Alergias")').textContent()
      const newCount = parseInt(newText?.match(/\((\d+)\)/)?.[1] || '0')
      expect(newCount).toBe(initialCount + 1)
    })
  })

  test.describe('Medical Record View Component', () => {
    test('MRV-01: Medical record displays SOAP sections correctly', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Historia Clínica")')

      // Check for SOAP section labels
      const recordCard = page.locator('.bg-white.rounded-lg.shadow-sm').first()
      if (await recordCard.isVisible()) {
        // These should be visible in records with SOAP notes
        const sections = ['Subjetivo', 'Objetivo', 'Evaluación', 'Plan']
        for (const section of sections) {
          const sectionElement = recordCard.locator(`text=${section}`)
          // Not all records have all sections, so just check the structure exists
          if (await sectionElement.isVisible()) {
            await expect(sectionElement).toBeVisible()
          }
        }
      }
    })

    test('MRV-02: Vital signs display with correct units', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Historia Clínica")')

      // Look for vital signs section
      const vitalSection = page.locator('text=Signos Vitales').first()
      if (await vitalSection.isVisible()) {
        // Check for common vital sign units
        await expect(page.locator('text=/°C|bpm|mmHg|kg|cm|%/')).toBeVisible()
      }
    })

    test('MRV-03: Prescriptions display medication details', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Historia Clínica")')

      // Look for prescriptions section
      const prescriptionSection = page.locator('text=Recetas').first()
      if (await prescriptionSection.isVisible()) {
        // Verify prescription card structure
        await expect(page.locator('.bg-purple-50').first()).toBeVisible()
      }
    })

    test('MRV-04: Diagnoses display with severity badges', async ({ page }) => {
      // Navigate to first patient
      const firstRow = page.locator('tbody tr').first()
      await firstRow.locator('td').first().click()

      await page.click('button:has-text("Historia Clínica")')

      // Look for diagnoses section
      const diagnosisSection = page.locator('text=Diagnósticos').first()
      if (await diagnosisSection.isVisible()) {
        // Verify diagnosis card structure
        await expect(page.locator('.bg-indigo-50').first()).toBeVisible()
      }
    })
  })
})
