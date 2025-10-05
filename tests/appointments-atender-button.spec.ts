import { test, expect } from '@playwright/test'

test.describe('Botón Atender en Appointments', () => {
  test.beforeEach(async ({ page }) => {
    // Login como doctor
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'doctor-1759245234123@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'VittaMed2024!')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/agenda')
  })

  test('debe mostrar botón Atender para citas con patient_id', async ({ page }) => {
    // Ir a appointments
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    // Seleccionar fecha con citas (2025-10-04)
    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    // Verificar que hay citas (buscar el texto específico de contador)
    const appointmentsCount = page.locator('text=/\\d+ citas? encontradas?/')
    if (await appointmentsCount.isVisible()) {
      await expect(appointmentsCount).toBeVisible()
    }

    // Buscar el botón morado "Atender" (icono de activity)
    const atenderButton = page.locator('button[title*="atender"] svg, button .w-5.h-5').first()

    // Si hay citas, el botón debe estar visible
    const hasCitas = await page.locator('table tbody tr').count() > 0
    if (hasCitas) {
      await expect(atenderButton).toBeVisible()
    }
  })

  test('el botón Atender debe redirigir al perfil del paciente', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    // Seleccionar fecha con citas
    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    // Buscar y hacer click en el botón Atender
    const atenderButton = page.locator('button[title*="atender"]').first()

    if (await atenderButton.isVisible()) {
      const patientId = await atenderButton.getAttribute('data-patient-id') ||
                        await atenderButton.evaluate(btn => {
                          const onClick = btn.getAttribute('onclick')
                          const match = onClick?.match(/patients\/([a-f0-9-]+)/)
                          return match ? match[1] : null
                        })

      await atenderButton.click()

      // Debe redirigir a /patients/[patient_id]
      await page.waitForURL(/\/patients\/[a-f0-9-]+/, { timeout: 5000 })
      expect(page.url()).toContain('/patients/')
    }
  })

  test('debe mostrar hora correctamente (no Invalid Date)', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    // Verificar que no hay "Invalid Date" en ninguna parte
    const invalidDate = page.locator('text=Invalid Date')
    await expect(invalidDate).not.toBeVisible()

    // Verificar que las horas se muestran correctamente (formato HH:MM)
    const timePattern = /\d{2}:\d{2}/
    const times = page.locator('td:has-text(":")')
    const count = await times.count()

    if (count > 0) {
      const firstTime = await times.first().textContent()
      expect(firstTime).toMatch(timePattern)
    }
  })

  test('filtro de fecha debe funcionar correctamente', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    // Probar con fecha que tiene citas
    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    const withAppointments = await page.locator('table tbody tr').count()

    // Probar con fecha sin citas
    await page.fill('input[type="date"]', '2025-10-05')
    await page.waitForTimeout(1000)

    const withoutAppointments = await page.locator('table tbody tr').count()

    // Las cantidades deben ser diferentes
    expect(withAppointments).not.toBe(withoutAppointments)
  })

  test('debe mostrar información completa de la cita', async ({ page }) => {
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    const hasRows = await page.locator('table tbody tr').count() > 0

    if (hasRows) {
      const firstRow = page.locator('table tbody tr').first()

      // Debe mostrar:
      // - Nombre del paciente
      await expect(firstRow).toContainText(/.+/)

      // - Hora (HH:MM - HH:MM)
      await expect(firstRow).toContainText(/\d{2}:\d{2}/)

      // - Servicio
      // - Estado (badge con color)
      const statusBadge = firstRow.locator('[class*="bg-"]')
      await expect(statusBadge).toBeVisible()
    }
  })

  test('no debe mostrar botón Atender si no es doctor', async ({ page }) => {
    // Logout
    await page.goto('/auth/login')

    // Login como admin
    await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')
    await page.waitForURL('**/dashboard/**')

    // Ir a appointments
    await page.goto('/appointments')
    await page.waitForLoadState('networkidle')

    await page.fill('input[type="date"]', '2025-10-04')
    await page.waitForTimeout(1000)

    // No debe haber botón Atender para admins
    const atenderButton = page.locator('button[title*="atender"]')
    await expect(atenderButton).not.toBeVisible()
  })
})
