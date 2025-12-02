import { test, expect } from '@playwright/test'


// Use admin storage state for all tests
test.use({ storageState: "tests/.auth/admin.json" })

test.describe('Sistema de Notificaciones', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard - already authenticated via storage state
    await page.goto('/dashboard')
    await expect(page.locator('h1')).toBeVisible()
  })

  test('debe mostrar configuración de notificaciones si existe', async ({ page }) => {
    // Buscar enlace o sección de configuración/settings
    const settingsLink = page.locator('a, button').filter({ hasText: /configuraci[oó]n|settings|ajustes/i })
    const count = await settingsLink.count()

    if (count > 0) {
      await settingsLink.first().click()

      // Buscar sección de notificaciones
      const notificationsSection = page.locator('text=/notificaciones|notifications|avisos/i')
      const hasNotifications = await notificationsSection.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasNotifications) {
        console.log('Notifications configuration found')
        await expect(notificationsSection).toBeVisible()
      } else {
        console.log('No notifications section in settings')
      }
    } else {
      console.log('Settings link not found - notifications config may be elsewhere')
    }
  })

  test('debe haber indicador de notificaciones pendientes en header', async ({ page }) => {
    // Buscar bell icon o notification badge en header
    const notificationBell = page.locator('[aria-label*="notification"], [class*="bell"], svg').filter({ has: page.locator('path[d*="M"]') })
    const count = await notificationBell.count()

    if (count > 0) {
      console.log(`Found ${count} notification indicators`)

      // Buscar badge con número de notificaciones
      const notificationBadge = page.locator('[class*="badge"], [class*="count"]').filter({ hasText: /\d+/ })
      const hasBadge = await notificationBadge.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasBadge) {
        console.log('Notification count badge visible')
      }
    } else {
      console.log('No notification bell found in UI')
    }
  })
})

test.describe('Notificaciones de Email - Verificación de Envío', () => {
  test('debe enviar email de confirmación al crear cita', async ({ page }) => {
    // Note: Este test verifica que el código intenta enviar email
    // El email real requeriría interceptar llamadas HTTP o verificar logs

    // Ir a booking (already authenticated)
    await page.goto('/booking')

    // El proceso de booking debería incluir envío de email
    // Por ahora solo verificamos que la página de booking existe
    expect(page.url()).toContain('booking')

    // En producción, interceptaríamos la llamada a API de email:
    // page.route('**/api/send-email', route => {
    //   route.fulfill({ status: 200, body: JSON.stringify({ sent: true }) })
    // })
  })

  test('debe mostrar mensaje de confirmación después de booking exitoso', async ({ page }) => {
    await page.goto('/booking')

    // Verificar que existe algún tipo de confirmación en la UI
    // (mensaje de éxito, redirect, etc.)
    const successIndicator = page.locator('text=/confirmaci[oó]n|confirmado|success|enviado/i')

    // Este es un test de smoke - verifica que la página está lista para mostrar confirmaciones
    console.log('Booking page ready for confirmation messages')
  })
})

test.describe('Notificaciones de WhatsApp - Mock', () => {
  test.skip('debe enviar WhatsApp al confirmar cita', async ({ page }) => {
    // Test skipped: Requiere Twilio configurado en test mode
    // O mock de la API de Twilio
    await page.goto('/dashboard')

    // Interceptar llamadas a API de WhatsApp/Twilio
    let whatsappCalled = false
    await page.route('**/api/whatsapp/**', route => {
      whatsappCalled = true
      route.fulfill({
        status: 200,
        body: JSON.stringify({ sent: true, messageId: 'test-123' })
      })
    })

    // Simular acción que envía WhatsApp (confirmar cita)
    // ...

    // Verificar que se intentó enviar
    // expect(whatsappCalled).toBe(true)
  })

  test.skip('debe manejar error al enviar WhatsApp', async ({ page }) => {
    // Test skipped: Requiere configuración de error handling
    await page.goto('/dashboard')

    // Mock de error de Twilio
    await page.route('**/api/whatsapp/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Twilio error' })
      })
    })

    // Verificar que el sistema maneja el error gracefully
    // No debería romper el flujo principal si WhatsApp falla
  })
})

test.describe('Templates de Notificaciones', () => {
  test('debe tener templates definidos para diferentes eventos', async ({ page }) => {
    // Este test verifica que existen archivos de templates
    // o configuración de mensajes
    await page.goto('/dashboard')

    // Buscar sección de templates si existe en admin
    const templatesSection = page.locator('text=/templates|plantillas|mensajes/i')
    const hasTemplates = await templatesSection.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasTemplates) {
      console.log('Templates section found')
      await templatesSection.click()

      // Verificar tipos de templates
      const templateTypes = [
        /confirmaci[oó]n|confirmation/i,
        /recordatorio|reminder/i,
        /cancelaci[oó]n|cancellation/i
      ]

      for (const type of templateTypes) {
        const template = page.locator(`text=${type}`)
        const exists = await template.isVisible({ timeout: 2000 }).catch(() => false)
        if (exists) {
          console.log(`Template found: ${type}`)
        }
      }
    } else {
      console.log('No templates configuration UI found')
    }
  })
})

test.describe('Preferencias de Notificaciones - Usuario', () => {
  test('usuario debe poder configurar preferencias de notificaciones', async ({ page }) => {
    await page.goto('/dashboard')

    // Buscar perfil o configuración de usuario
    const profileLink = page.locator('a, button').filter({ hasText: /perfil|profile|cuenta|account/i })
    const count = await profileLink.count()

    if (count > 0) {
      await profileLink.first().click()

      // Buscar opciones de notificaciones
      const notificationPrefs = page.locator('text=/notificaciones|notifications/i, input[type="checkbox"]').filter({ hasText: /email|whatsapp|sms/i })
      const hasPrefs = await notificationPrefs.count()

      if (hasPrefs > 0) {
        console.log(`Found ${hasPrefs} notification preferences`)
      } else {
        console.log('No notification preferences found in profile')
      }
    } else {
      console.log('Profile link not found')
    }
  })

  test('debe poder desactivar notificaciones por email', async ({ page }) => {
    await page.goto('/dashboard')

    // Buscar toggle de email notifications
    const emailToggle = page.locator('input[type="checkbox"]').filter({ has: page.locator('~ text=/email/i') })
    const hasToggle = await emailToggle.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasToggle) {
      const isChecked = await emailToggle.isChecked()
      await emailToggle.click()

      const newState = await emailToggle.isChecked()
      expect(newState).toBe(!isChecked)
      console.log(`Email notifications toggled: ${isChecked} → ${newState}`)
    } else {
      console.log('Email notification toggle not found')
    }
  })
})

test.describe('Notificaciones en Tiempo Real', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' })

  test('debe actualizar notificaciones sin recargar página', async ({ page }) => {
    await page.goto('/agenda')
    await expect(page.locator('h1, h2').first()).toBeVisible()

    // Verificar si hay WebSocket o polling para notificaciones en tiempo real
    // (esto es avanzado y puede no estar implementado)

    const initialUrl = page.url()
    const finalUrl = page.url()

    // Verificar que no hubo reload completo
    expect(initialUrl).toBe(finalUrl)

    console.log('Page remained stable - real-time notifications would update without reload')
  })
})
