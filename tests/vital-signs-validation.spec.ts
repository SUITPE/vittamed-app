import { test, expect } from '@playwright/test'

test.describe('Validación de Signos Vitales', () => {
  test.beforeEach(async ({ page }) => {
    // Login como doctor
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'doctor-1759245234123@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'VittaMed2024!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/agenda')
  })

  test('debe validar temperatura fuera de rango', async ({ page }) => {
    // Ir a pacientes y abrir registro médico
    await page.goto('/patients')
    await page.waitForTimeout(1000)

    // Buscar botón de nuevo registro médico (puede variar según la implementación)
    const newRecordButton = page.locator('text=Nuevo Registro').or(page.locator('text=Agregar Registro'))
    if (await newRecordButton.isVisible()) {
      await newRecordButton.first().click()
    } else {
      // Si no hay botón directo, click en un paciente primero
      await page.click('table tbody tr:first-child')
      await page.waitForTimeout(500)
      await page.click('text=Nuevo Registro')
    }

    // Ir a pestaña de Signos Vitales
    await page.click('text=Signos Vitales')
    await page.waitForTimeout(500)

    // Probar temperatura alta
    const tempInput = page.locator('input[placeholder="36.5"]')
    await tempInput.fill('38.5')
    await tempInput.blur()

    // Verificar warning
    await expect(page.locator('text=⚠️ Valor alto')).toBeVisible()
    await expect(page.locator('text=Rango normal: 36.1-37.2')).toBeVisible()

    // Probar temperatura baja
    await tempInput.fill('35.0')
    await tempInput.blur()
    await expect(page.locator('text=⚠️ Valor bajo')).toBeVisible()

    // Probar temperatura normal
    await tempInput.fill('36.5')
    await tempInput.blur()
    await expect(page.locator('text=⚠️')).not.toBeVisible()
  })

  test('debe validar frecuencia cardíaca fuera de rango', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForTimeout(1000)

    const newRecordButton = page.locator('text=Nuevo Registro').or(page.locator('text=Agregar Registro'))
    if (await newRecordButton.isVisible()) {
      await newRecordButton.first().click()
    } else {
      await page.click('table tbody tr:first-child')
      await page.waitForTimeout(500)
      await page.click('text=Nuevo Registro')
    }

    await page.click('text=Signos Vitales')
    await page.waitForTimeout(500)

    // Probar frecuencia cardíaca alta
    const heartRateInput = page.locator('input[placeholder="72"]')
    await heartRateInput.fill('120')
    await heartRateInput.blur()
    await expect(page.locator('text=⚠️ Valor alto')).toBeVisible()

    // Probar frecuencia cardíaca baja
    await heartRateInput.fill('50')
    await heartRateInput.blur()
    await expect(page.locator('text=⚠️ Valor bajo')).toBeVisible()
  })

  test('debe validar presión arterial fuera de rango', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForTimeout(1000)

    const newRecordButton = page.locator('text=Nuevo Registro').or(page.locator('text=Agregar Registro'))
    if (await newRecordButton.isVisible()) {
      await newRecordButton.first().click()
    } else {
      await page.click('table tbody tr:first-child')
      await page.waitForTimeout(500)
      await page.click('text=Nuevo Registro')
    }

    await page.click('text=Signos Vitales')
    await page.waitForTimeout(500)

    // Probar presión sistólica alta
    const systolicInput = page.locator('input[placeholder="120"]')
    await systolicInput.fill('140')
    await systolicInput.blur()
    await expect(page.locator('text=⚠️ Valor alto').first()).toBeVisible()

    // Probar presión diastólica alta
    const diastolicInput = page.locator('input[placeholder="80"]')
    await diastolicInput.fill('95')
    await diastolicInput.blur()
    await expect(page.locator('text=⚠️ Valor alto').nth(1)).toBeVisible()
  })

  test('debe validar saturación de oxígeno baja', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForTimeout(1000)

    const newRecordButton = page.locator('text=Nuevo Registro').or(page.locator('text=Agregar Registro'))
    if (await newRecordButton.isVisible()) {
      await newRecordButton.first().click()
    } else {
      await page.click('table tbody tr:first-child')
      await page.waitForTimeout(500)
      await page.click('text=Nuevo Registro')
    }

    await page.click('text=Signos Vitales')
    await page.waitForTimeout(500)

    // Probar saturación baja (crítico)
    const o2Input = page.locator('input[placeholder="98"]')
    await o2Input.fill('90')
    await o2Input.blur()
    await expect(page.locator('text=⚠️ Valor bajo')).toBeVisible()
    await expect(page.locator('text=Rango normal: 95-100')).toBeVisible()
  })

  test('debe permitir guardar registro con warnings', async ({ page }) => {
    await page.goto('/patients')
    await page.waitForTimeout(1000)

    const newRecordButton = page.locator('text=Nuevo Registro').or(page.locator('text=Agregar Registro'))
    if (await newRecordButton.isVisible()) {
      await newRecordButton.first().click()
    } else {
      await page.click('table tbody tr:first-child')
      await page.waitForTimeout(500)
      await page.click('text=Nuevo Registro')
    }

    // Llenar información básica
    await page.selectOption('select', 'consultation')
    await page.fill('textarea[placeholder*="acude el paciente"]', 'Fiebre alta')

    // Ir a signos vitales con valores anormales
    await page.click('text=Signos Vitales')
    await page.waitForTimeout(500)

    const tempInput = page.locator('input[placeholder="36.5"]')
    await tempInput.fill('38.5')
    await tempInput.blur()

    // El warning debe estar visible pero permitir guardar
    await expect(page.locator('text=⚠️ Valor alto')).toBeVisible()

    // Intentar guardar
    const saveButton = page.locator('button:has-text("Guardar Registro")')
    await expect(saveButton).toBeEnabled()
  })
})
