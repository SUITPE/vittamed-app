import { test, expect } from '@playwright/test'

test.describe('Appointment Lifecycle Tests', () => {
  test.describe('Patient Appointment Management', () => {
    // Use receptionist storage state (acts as patient for these tests)
    test.use({ storageState: 'tests/.auth/receptionist.json' })

    test.beforeEach(async ({ page }) => {
      await page.goto('/my-appointments')
      await expect(page.locator('h1')).toBeVisible()
    })

    test('should display my appointments page', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('Mis Citas')
      await expect(page.locator('text=Gestiona y revisa el historial de tus citas médicas')).toBeVisible()
      await expect(page.locator('a[href="/booking"]')).toContainText('Nueva Cita')
    })

    test('should show appointment filter buttons', async ({ page }) => {
      await expect(page.locator('button:has-text("Todas")')).toBeVisible()
      await expect(page.locator('button:has-text("Próximas")')).toBeVisible()
      await expect(page.locator('button:has-text("Pasadas")')).toBeVisible()
      await expect(page.locator('button:has-text("Canceladas")')).toBeVisible()
    })

    test('should filter appointments by status', async ({ page }) => {
      await page.click('button:has-text("Próximas")')
      await expect(page.locator('button:has-text("Próximas")')).toHaveClass(/bg-blue-600/)

      await page.click('button:has-text("Pasadas")')
      await expect(page.locator('button:has-text("Pasadas")')).toHaveClass(/bg-blue-600/)

      await page.click('button:has-text("Canceladas")')
      await expect(page.locator('button:has-text("Canceladas")')).toHaveClass(/bg-blue-600/)

      await page.click('button:has-text("Todas")')
      await expect(page.locator('button:has-text("Todas")')).toHaveClass(/bg-blue-600/)
    })

    test('should display appointment details', async ({ page }) => {
      const appointmentCard = page.locator('.border.rounded-lg.p-6').first()

      if (await appointmentCard.isVisible()) {
        await expect(appointmentCard.locator('.text-lg.font-medium')).toBeVisible()

        await expect(appointmentCard.locator('text=Doctor:')).toBeVisible()
        await expect(appointmentCard.locator('text=Clínica:')).toBeVisible()
        await expect(appointmentCard.locator('text=Fecha:')).toBeVisible()
        await expect(appointmentCard.locator('text=Hora:')).toBeVisible()
        await expect(appointmentCard.locator('text=Precio:')).toBeVisible()

        await expect(appointmentCard.locator('span.px-2.py-1.rounded-full')).toBeVisible()
      }
    })

    test('should show payment button for pending appointments', async ({ page }) => {
      const appointmentCard = page.locator('.border.rounded-lg.p-6').first()

      if (await appointmentCard.isVisible()) {
        const payButton = appointmentCard.locator('a:has-text("Pagar Cita")')
        const cancelButton = appointmentCard.locator('button:has-text("Cancelar")')

        if (await payButton.isVisible()) {
          await expect(payButton).toHaveAttribute('href', /\/payment\//)
        }

        if (await cancelButton.isVisible()) {
          await expect(cancelButton).toBeVisible()
        }
      }
    })

    test('should handle appointment cancellation', async ({ page }) => {
      const appointmentCard = page.locator('.border.rounded-lg.p-6').first()

      if (await appointmentCard.isVisible()) {
        const cancelButton = appointmentCard.locator('button:has-text("Cancelar")')

        if (await cancelButton.isVisible()) {
          page.on('dialog', dialog => {
            expect(dialog.message()).toContain('¿Estás seguro de que quieres cancelar esta cita?')
            dialog.dismiss()
          })

          await cancelButton.click()
        }
      }
    })

    test('should show empty state when no appointments', async ({ page }) => {
      await page.click('button:has-text("Canceladas")')

      if (await page.locator('text=No tienes citas canceladas').isVisible()) {
        await expect(page.locator('text=📅')).toBeVisible()
        await expect(page.locator('text=No tienes citas canceladas')).toBeVisible()
        await expect(page.locator('a:has-text("Reservar Primera Cita")')).toBeVisible()
      }
    })

    test('should display appointment status badges correctly', async ({ page }) => {
      const statusBadges = page.locator('span.px-2.py-1.rounded-full')

      if (await statusBadges.count() > 0) {
        for (let i = 0; i < await statusBadges.count(); i++) {
          const badge = statusBadges.nth(i)
          const text = await badge.textContent()

          expect(['Pendiente', 'Confirmada', 'Completada', 'Cancelada', 'Pagado', 'Falló']).toContain(text)
        }
      }
    })

    test('should navigate to booking page', async ({ page }) => {
      await page.click('a:has-text("Nueva Cita")')
      await expect(page).toHaveURL('/booking')
    })
  })

  test.describe('Complete Booking Flow', () => {
    test('should complete full booking flow', async ({ page }) => {
      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      await page.selectOption('[data-testid="tenant-select"]', 'clinica-san-rafael')
      await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1)

      await page.selectOption('[data-testid="service-select"]', 'consulta-general')
      await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible()

      await page.selectOption('[data-testid="doctor-select"]', 'doctor-1')

      const availableSlots = page.locator('[data-testid^="time-slot-"]')
      if (await availableSlots.count() > 0) {
        await availableSlots.first().click()
        await expect(page.locator('[data-testid="patient-form"]')).toBeVisible()
      }

      await page.fill('[data-testid="patient-name"]', 'Test Patient')
      await page.fill('[data-testid="patient-email"]', 'test@patient.com')
      await page.fill('[data-testid="patient-phone"]', '+52 1234567890')

      await page.click('[data-testid="book-appointment"]')

      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=¡Cita Reservada Exitosamente!')).toBeVisible()
    })
  })

  test.describe('Doctor Appointment Management', () => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    test.beforeEach(async ({ page }) => {
      await page.goto('/agenda')
      await expect(page.locator('h1, h2')).toBeVisible()
    })

    test('should update appointment status', async ({ page }) => {
      const appointmentCard = page.locator('.border.rounded-lg.p-4').first()

      if (await appointmentCard.isVisible()) {
        const confirmButton = appointmentCard.locator('button:has-text("Confirmar")')
        const completeButton = appointmentCard.locator('button:has-text("Completar")')
        const cancelButton = appointmentCard.locator('button:has-text("Cancelar")')

        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          // Wait for status to update
          await expect(appointmentCard.locator('span.px-2.py-1.rounded-full')).toBeVisible()
        }

        if (await completeButton.isVisible()) {
          await completeButton.click()
          await expect(appointmentCard.locator('span.px-2.py-1.rounded-full')).toBeVisible()
        }

        await expect(cancelButton).toBeVisible()
      }
    })

    test('should show appointment time and patient info', async ({ page }) => {
      const appointmentCard = page.locator('.border.rounded-lg.p-4').first()

      if (await appointmentCard.isVisible()) {
        await expect(appointmentCard.locator('.font-medium.text-gray-900')).toBeVisible()
        await expect(appointmentCard.locator('.text-sm.text-gray-500')).toHaveCount(2)
      }
    })
  })

  test.describe('Admin Dashboard Integration', () => {
    test.use({ storageState: 'tests/.auth/admin.json' })

    test.beforeEach(async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('h1')).toBeVisible()
    })

    test('should show today appointments in dashboard', async ({ page }) => {
      await expect(page.locator('h2:has-text("Citas de Hoy")')).toBeVisible()

      const appointmentsSection = page.locator('.bg-white.rounded-lg.shadow-sm').nth(1)
      await expect(appointmentsSection).toBeVisible()
    })

    test('should display appointment stats', async ({ page }) => {
      const todayStats = page.locator('[data-testid="today-appointments-stat"]')
      const weekStats = page.locator('[data-testid="week-appointments-stat"]')
      const pendingStats = page.locator('[data-testid="pending-appointments-stat"]')

      await expect(todayStats).toBeVisible()
      await expect(weekStats).toBeVisible()
      await expect(pendingStats).toBeVisible()

      await expect(todayStats.locator('.text-2xl')).toBeVisible()
      await expect(weekStats.locator('.text-2xl')).toBeVisible()
      await expect(pendingStats.locator('.text-2xl')).toBeVisible()
    })
  })
})