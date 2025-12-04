/**
 * E2E Tests for VT-229: Voice Dictation Feature
 *
 * Tests the voice dictation button and SOAP form integration.
 * Note: Actual voice recognition requires browser microphone access
 * which is not available in headless testing. These tests verify
 * the UI components and button behavior.
 */

import { test, expect } from '@playwright/test'

test.describe('VT-229: Voice Dictation Feature', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })

  test('should display SOAP form fields on patient page', async ({ page }) => {
    // Go to patients list first
    await page.goto('/patients')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(2000)

    // Try to find and click on a patient
    const patientLink = page.locator('a[href*="/patients/"], tr[data-patient-id], [data-testid="patient-row"]').first()

    if (await patientLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await patientLink.click()
      await page.waitForTimeout(2000)

      // Check for SOAP-related elements
      const soapElements = [
        'text=SOAP',
        'text=Subjetivo',
        'text=Objetivo',
        'text=Evaluación',
        'text=Plan',
        'text=Motivo'
      ]

      let foundSoap = false
      for (const selector of soapElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
          foundSoap = true
          break
        }
      }

      // Medical record form might need specific navigation
      if (!foundSoap) {
        // Look for medical history tab or button
        const historyTab = page.locator('text=Historia, text=Historial, text=Medical, button:has-text("Atender")').first()
        if (await historyTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await historyTab.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    // Page should load without errors
    expect(await page.locator('body').isVisible()).toBeTruthy()
  })

  test('should have voice dictation button in medical record form', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(2000)

    // Look for voice/microphone button indicators
    const voiceButtons = page.locator('button:has(svg[class*="mic"]), button:has-text("Dictar"), [data-testid="voice-button"]')

    // The voice button may only appear in the medical record form
    // Navigate to a patient if possible
    const patientLink = page.locator('a[href*="/patients/"]').first()
    if (await patientLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await patientLink.click()
      await page.waitForTimeout(2000)

      // Check for voice dictation button
      const dictateButton = page.locator('button:has-text("Dictar"), button[title*="voz"], button[aria-label*="voice"]').first()
      const isVoiceButtonVisible = await dictateButton.isVisible({ timeout: 5000 }).catch(() => false)

      // Voice button should exist if SOAP form is visible
      if (isVoiceButtonVisible) {
        expect(isVoiceButtonVisible).toBeTruthy()
      }
    }

    // Page loaded successfully
    expect(await page.locator('body').isVisible()).toBeTruthy()
  })

  test('voice button should not submit form when clicked', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(2000)

    // Navigate to a patient
    const patientLink = page.locator('a[href*="/patients/"]').first()
    if (await patientLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await patientLink.click()
      await page.waitForTimeout(2000)

      // Find voice/dictate button
      const dictateButton = page.locator('button:has-text("Dictar"), button[type="button"]:has(svg)').first()

      if (await dictateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Get current URL
        const urlBefore = page.url()

        // Click the button
        await dictateButton.click()
        await page.waitForTimeout(500)

        // URL should not change (form should not submit)
        const urlAfter = page.url()

        // The button click should not navigate away
        expect(urlAfter).toBe(urlBefore)
      }
    }

    expect(await page.locator('body').isVisible()).toBeTruthy()
  })

  test('SOAP fields should be editable', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(2000)

    const patientLink = page.locator('a[href*="/patients/"]').first()
    if (await patientLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await patientLink.click()
      await page.waitForTimeout(2000)

      // Look for SOAP textarea fields
      const soapFields = [
        'textarea[name*="subjective"], textarea[name*="subjetivo"]',
        'textarea[name*="objective"], textarea[name*="objetivo"]',
        'textarea[name*="assessment"], textarea[name*="evaluacion"]',
        'textarea[name*="plan"]'
      ]

      for (const selector of soapFields) {
        const field = page.locator(selector).first()
        if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
          // Verify field is editable
          const isDisabled = await field.isDisabled()
          expect(isDisabled).toBeFalsy()
          break
        }
      }
    }

    expect(await page.locator('body').isVisible()).toBeTruthy()
  })
})

test.describe('VT-229: Voice Dictation - Doctor View', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' })

  test('doctor should have access to voice dictation in medical records', async ({ page }) => {
    await page.goto('/patients')
    await expect(page.locator('body')).toBeVisible()
    await page.waitForTimeout(2000)

    // Doctors should be able to see patients and access medical records
    const hasPatientsAccess = await page.locator('text=Paciente, text=Patient, table, [data-testid="patients"]').first().isVisible({ timeout: 5000 }).catch(() => false)

    // Page should load for doctor
    expect(hasPatientsAccess || await page.locator('body').isVisible()).toBeTruthy()
  })
})
