/**
 * E2E Tests for Specialty Fields (VT-245)
 * Tests adaptive medical records by business type
 */

import { test, expect } from '@playwright/test'

test.describe('VT-245: Specialty Fields - Adaptive Medical Records', () => {
  // Test credentials
  const DOCTOR_EMAIL = 'doctor-1759245234123@clinicasanrafael.com'
  const DOCTOR_PASSWORD = 'VittaSami2024!'

  test.beforeEach(async ({ page }) => {
    // Login as doctor
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', DOCTOR_EMAIL)
    await page.fill('input[name="password"]', DOCTOR_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for redirect to agenda
    await page.waitForURL(/\/(agenda|dashboard)/, { timeout: 10000 })
  })

  test('should show specialty tab in medical record form', async ({ page }) => {
    // Navigate to patients
    await page.goto('/patients')
    await page.waitForLoadState('networkidle')

    // Click on first patient
    const patientRow = page.locator('table tbody tr').first()
    await patientRow.click()

    // Wait for patient profile to load
    await page.waitForURL(/\/patients\/[^/]+/)

    // Click on medical history tab
    const historialTab = page.locator('button', { hasText: /Historial|Historia/ })
    await historialTab.first().click()

    // Click on new medical record button
    const newRecordButton = page.locator('button', { hasText: /Nuevo Registro|Nueva Consulta|Agregar/ })
    await newRecordButton.first().click()

    // Wait for modal to open
    await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 })

    // Verify specialty tab exists (should show based on tenant type)
    const specialtyTab = page.locator('button', { hasText: /General|Pediatría|Odontología|Dermatología|Estética|Nutrición/ })

    // At least one specialty tab should be visible
    await expect(specialtyTab.first()).toBeVisible({ timeout: 5000 })
  })

  test('should display specialty-specific fields when clicking specialty tab', async ({ page }) => {
    // Navigate to patients
    await page.goto('/patients')
    await page.waitForLoadState('networkidle')

    // Click on first patient
    const patientRow = page.locator('table tbody tr').first()
    await patientRow.click()

    // Wait for patient profile to load
    await page.waitForURL(/\/patients\/[^/]+/)

    // Click on medical history tab
    const historialTab = page.locator('button', { hasText: /Historial|Historia/ })
    await historialTab.first().click()

    // Click on new medical record button
    const newRecordButton = page.locator('button', { hasText: /Nuevo Registro|Nueva Consulta|Agregar/ })
    await newRecordButton.first().click()

    // Wait for modal to open
    await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 })

    // Click on specialty tab
    const specialtyTab = page.locator('button', { hasText: /General|Pediatría|Odontología|Dermatología|Estética|Nutrición/ })
    await specialtyTab.first().click()

    // Verify specialty fields section header is shown
    const specialtyHeader = page.locator('h3, h4', { hasText: /Campos de/ })
    await expect(specialtyHeader.first()).toBeVisible({ timeout: 5000 })
  })

  test('should have all required form sections', async ({ page }) => {
    // Navigate to patients
    await page.goto('/patients')
    await page.waitForLoadState('networkidle')

    // Click on first patient
    const patientRow = page.locator('table tbody tr').first()
    await patientRow.click()

    // Wait for patient profile to load
    await page.waitForURL(/\/patients\/[^/]+/)

    // Click on medical history tab
    const historialTab = page.locator('button', { hasText: /Historial|Historia/ })
    await historialTab.first().click()

    // Click on new medical record button
    const newRecordButton = page.locator('button', { hasText: /Nuevo Registro|Nueva Consulta|Agregar/ })
    await newRecordButton.first().click()

    // Wait for modal to open
    await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 })

    // Check for required tabs
    await expect(page.locator('button', { hasText: /Información Básica/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /Signos Vitales/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /Recetas/ })).toBeVisible()
    await expect(page.locator('button', { hasText: /Diagnósticos/ })).toBeVisible()
  })

  test('should display vital signs tab with input fields', async ({ page }) => {
    // Navigate to patients
    await page.goto('/patients')
    await page.waitForLoadState('networkidle')

    // Click on first patient
    const patientRow = page.locator('table tbody tr').first()
    await patientRow.click()

    // Wait for patient profile to load
    await page.waitForURL(/\/patients\/[^/]+/)

    // Click on medical history tab
    const historialTab = page.locator('button', { hasText: /Historial|Historia/ })
    await historialTab.first().click()

    // Click on new medical record button
    const newRecordButton = page.locator('button', { hasText: /Nuevo Registro|Nueva Consulta|Agregar/ })
    await newRecordButton.first().click()

    // Wait for modal to open
    await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 })

    // Click on vital signs tab
    await page.locator('button', { hasText: /Signos Vitales/ }).click()

    // Verify vital signs fields are present
    await expect(page.locator('label', { hasText: /Temperatura/ })).toBeVisible()
    await expect(page.locator('label', { hasText: /Frecuencia Cardíaca/ })).toBeVisible()
    await expect(page.locator('label', { hasText: /Presión Sistólica/ })).toBeVisible()
    await expect(page.locator('label', { hasText: /Peso/ })).toBeVisible()
  })
})

test.describe('VT-245: Specialty Field Configuration', () => {
  test('should have valid specialty configurations', async ({ page }) => {
    // This test verifies the medical-fields configuration is properly loaded
    // by checking if the medical record form loads without errors

    // Login as doctor
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'doctor-1759245234123@clinicasanrafael.com')
    await page.fill('input[name="password"]', 'VittaSami2024!')
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL(/\/(agenda|dashboard)/, { timeout: 10000 })

    // Navigate to patients
    await page.goto('/patients')
    await page.waitForLoadState('networkidle')

    // Click on first patient
    const patientRow = page.locator('table tbody tr').first()
    await patientRow.click()

    // Wait for patient profile to load
    await page.waitForURL(/\/patients\/[^/]+/)

    // Click on medical history tab
    const historialTab = page.locator('button', { hasText: /Historial|Historia/ })
    await historialTab.first().click()

    // Click on new medical record button
    const newRecordButton = page.locator('button', { hasText: /Nuevo Registro|Nueva Consulta|Agregar/ })
    await newRecordButton.first().click()

    // Wait for modal to open - if it opens without errors, the configuration is valid
    await page.waitForSelector('[class*="modal"], [role="dialog"]', { timeout: 5000 })

    // Verify form loaded successfully (no error messages)
    const errorMessage = page.locator('text=/error|Error/')
    const errorCount = await errorMessage.count()
    expect(errorCount).toBe(0)
  })
})
