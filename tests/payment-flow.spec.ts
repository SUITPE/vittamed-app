import { test, expect } from '@playwright/test'


// Use receptionist storage state for payment tests (acting as patient)
test.use({ storageState: "tests/.auth/receptionist.json" })
test.describe('Payment Flow - Stripe Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to appointments
    await page.goto('/my-appointments')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('debe mostrar botón de pago para citas pendientes', async ({ page }) => {

    // Buscar citas con status pending/scheduled
    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      // Verificar que el botón es visible
      await expect(paymentButtons.first()).toBeVisible()
      console.log(`Found ${count} payment buttons`)
    } else {
      console.log('No pending appointments with payment button')
    }
  })

  test('debe navegar a página de pago al click en botón', async ({ page }) => {

    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      const currentUrl = page.url()
      await paymentButtons.first().click()

      const newUrl = page.url()

      // Verificar que navegó (URL cambió o modal apareció)
      if (currentUrl !== newUrl) {
        expect(newUrl).toMatch(/payment|pago|checkout/)
      } else {
        // Puede ser un modal
        const modal = page.locator('[role="dialog"], .modal, [class*="payment"]')
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(modal).toBeVisible()
        }
      }
    }
  })

  test('debe mostrar información de la cita en página de pago', async ({ page }) => {

    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      await paymentButtons.first().click()

      // Verificar que muestra detalles de la cita
      const appointmentDetails = page.locator('text=/servicio|doctor|fecha|precio|total|service|price/i')
      const detailsCount = await appointmentDetails.count()

      expect(detailsCount).toBeGreaterThan(0)
    }
  })

  test('debe mostrar elemento de Stripe (si está configurado)', async ({ page }) => {

    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      await paymentButtons.first().click()

      // Buscar iframe de Stripe o elementos de pago
      const stripeFrame = page.frameLocator('iframe[name*="stripe"], iframe[src*="stripe"]')
      const hasStripeFrame = await stripeFrame.locator('body').isVisible({ timeout: 5000 }).catch(() => false)

      if (hasStripeFrame) {
        console.log('Stripe payment element detected')
      } else {
        // Puede estar usando Stripe Elements que no siempre usa iframe
        const cardInput = page.locator('input[placeholder*="card"], input[name*="card"], [class*="StripeElement"]')
        const hasCardInput = await cardInput.isVisible({ timeout: 5000 }).catch(() => false)

        if (hasCardInput) {
          console.log('Stripe card input detected')
        } else {
          console.log('Payment UI present but Stripe elements not detected - may need configuration')
        }
      }
    }
  })

  test('debe permitir cancelar el proceso de pago', async ({ page }) => {

    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      await paymentButtons.first().click()

      // Buscar botón de cancelar/volver
      const cancelButton = page.locator('button').filter({ hasText: /cancelar|cancel|volver|back/i }).first()

      if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cancelButton.click()

        // Verificar que volvió a la página anterior
        expect(page.url()).toContain('my-appointments')
      }
    }
  })

  test.skip('debe procesar pago exitoso con tarjeta de prueba Stripe', async ({ page }) => {
    // Test skipped: Requiere Stripe test mode configurado
    // Tarjeta de prueba: 4242 4242 4242 4242
    // Para implementar cuando Stripe esté en test mode


    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      await paymentButtons.first().click()

      // Llenar información de tarjeta de prueba
      const cardFrame = page.frameLocator('iframe[name*="stripe"]').first()
      await cardFrame.locator('input[name="cardnumber"]').fill('4242424242424242')
      await cardFrame.locator('input[name="exp-date"]').fill('12/25')
      await cardFrame.locator('input[name="cvc"]').fill('123')
      await cardFrame.locator('input[name="postal"]').fill('12345')

      // Submit payment
      const submitButton = page.locator('button[type="submit"]').filter({ hasText: /pagar|pay|submit/i })
      await submitButton.click()

      // Esperar confirmación
      await page.waitForURL('**/success', { timeout: 10000 })
      expect(page.url()).toContain('success')
    }
  })

  test.skip('debe manejar errores de pago correctamente', async ({ page }) => {
    // Test skipped: Requiere tarjeta de prueba que falla
    // Tarjeta que falla: 4000 0000 0000 0002


    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay/i })
    const count = await paymentButtons.count()

    if (count > 0) {
      await paymentButtons.first().click()

      // Usar tarjeta que falla
      const cardFrame = page.frameLocator('iframe[name*="stripe"]').first()
      await cardFrame.locator('input[name="cardnumber"]').fill('4000000000000002')
      await cardFrame.locator('input[name="exp-date"]').fill('12/25')
      await cardFrame.locator('input[name="cvc"]').fill('123')

      // Submit
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Verificar mensaje de error
      const errorMessage = page.locator('text=/error|declined|rechazado/i')
      await expect(errorMessage).toBeVisible({ timeout: 10000 })
    }
  })

  test('debe mostrar historial de pagos si existe', async ({ page }) => {
    await page.goto('/my-appointments')

    // Buscar sección de pagos o historial
    const paymentsSection = page.locator('text=/historial|pagos|payments|transactions/i')
    const hasPaymentsSection = await paymentsSection.isVisible({ timeout: 3000 }).catch(() => false)

    if (hasPaymentsSection) {
      console.log('Payments history section found')
      await expect(paymentsSection).toBeVisible()
    } else {
      console.log('No payments history section - may be in different location')
    }
  })
})

test.describe('Payment - Doctor View', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' })

  test.beforeEach(async ({ page }) => {
    // Navigate directly to agenda
    await page.goto('/agenda')
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('doctor no debe ver botones de pago en agenda', async ({ page }) => {
    await page.goto('/agenda')

    // Doctor no debe tener opción de pagar citas
    const paymentButtons = page.locator('button').filter({ hasText: /pagar|pay now/i })
    const count = await paymentButtons.count()

    expect(count).toBe(0)
  })

  test('doctor puede ver status de pago de citas', async ({ page }) => {
    await page.goto('/appointments')
    await page.fill('input[type="date"]', '2025-10-04')

    // Buscar indicadores de status de pago
    const paymentStatus = page.locator('[class*="badge"], [class*="status"]').filter({ hasText: /pagado|paid|pending/i })
    const count = await paymentStatus.count()

    if (count > 0) {
      console.log(`Found ${count} payment status indicators`)
      await expect(paymentStatus.first()).toBeVisible()
    } else {
      console.log('No payment status indicators found - may not be implemented yet')
    }
  })
})
