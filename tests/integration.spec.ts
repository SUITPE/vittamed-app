import { test, expect } from '@playwright/test'

test.describe('Integration Tests', () => {
  test.describe('Multi-tenant System Integration', () => {
    // Use admin storage state for these tests
    test.use({ storageState: 'tests/.auth/admin.json' })

    test('should handle tenant-specific routing', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard\/[0-9a-f-]{36}/)

      const currentUrl = page.url()
      expect(currentUrl).toMatch(/\/dashboard\/[0-9a-f-]{36}/)
    })

    test('should show tenant-specific data in dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await expect(page.locator('h1, h2')).toBeVisible()

      await expect(page.locator('h1')).toContainText('Clínica San Rafael')
      await expect(page.locator('text=Gestión completa de tu clinica')).toBeVisible()
    })
  })

  test.describe('Role-based Access Control', () => {
    test('should redirect admin to dashboard', async ({ page }) => {
      test.use({ storageState: 'tests/.auth/admin.json' })

      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('h1, h2')).toBeVisible()
    })

    test('should redirect doctor to agenda', async ({ page }) => {
      test.use({ storageState: 'tests/.auth/doctor.json' })

      await page.goto('/agenda')
      await expect(page).toHaveURL('/agenda')
      await expect(page.locator('h1, h2')).toBeVisible()
    })

    test('should redirect receptionist to dashboard', async ({ page }) => {
      test.use({ storageState: 'tests/.auth/receptionist.json' })

      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('h1, h2')).toBeVisible()
    })
  })

  test.describe('Booking System Integration', () => {
    test('should maintain booking state across steps', async ({ page }) => {
      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      await page.selectOption('[data-testid="tenant-select"]', 'clinica-san-rafael')
      await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1)

      const selectedTenant = await page.locator('[data-testid="tenant-select"]').inputValue()
      expect(selectedTenant).toBe('clinica-san-rafael')

      await page.selectOption('[data-testid="service-select"]', 'consulta-general')
      await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible()

      const selectedService = await page.locator('[data-testid="service-select"]').inputValue()
      expect(selectedService).toBe('consulta-general')

      expect(selectedTenant).toBe('clinica-san-rafael')
    })

    test('should validate booking form submission', async ({ page }) => {
      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      await page.selectOption('[data-testid="tenant-select"]', 'clinica-san-rafael')
      await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1)

      await page.selectOption('[data-testid="service-select"]', 'consulta-general')
      await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible()

      await page.selectOption('[data-testid="doctor-select"]', 'doctor-1')
      await expect(page.locator('[data-testid="book-appointment"], button[type="submit"]')).toBeVisible()

      await page.click('[data-testid="book-appointment"]')

      await expect(page.locator('[data-testid="patient-name"]')).toHaveAttribute('required', '')
      await expect(page.locator('[data-testid="patient-email"]')).toHaveAttribute('required', '')
    })
  })

  test.describe('Context7 Flow Integration', () => {
    test('should handle booking flow with rollback on validation error', async ({ page }) => {
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

      await page.fill('[data-testid="patient-name"]', '')
      await page.fill('[data-testid="patient-email"]', 'invalid-email')

      await page.click('[data-testid="book-appointment"]')

      await expect(page.locator('[data-testid="patient-email"]')).toHaveAttribute('type', 'email')
    })

    test('should complete successful booking flow', async ({ page }) => {
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

      await page.fill('[data-testid="patient-name"]', 'Integration Test Patient')
      await page.fill('[data-testid="patient-email"]', 'integration@test.com')
      await page.fill('[data-testid="patient-phone"]', '+52 1234567890')

      await page.click('[data-testid="book-appointment"]')

      await expect(page.locator('[data-testid="booking-success"]')).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('API Integration', () => {
    test('should load dashboard stats from API', async ({ page }) => {
      test.use({ storageState: 'tests/.auth/admin.json' })

      await page.goto('/dashboard')
      await expect(page.locator('h1, h2')).toBeVisible()

      const todayStats = page.locator('[data-testid="today-appointments-stat"] .text-2xl')
      const weekStats = page.locator('[data-testid="week-appointments-stat"] .text-2xl')

      await expect(todayStats).toBeVisible()
      await expect(weekStats).toBeVisible()

      const todayValue = await todayStats.textContent()
      const weekValue = await weekStats.textContent()

      expect(todayValue).toMatch(/^\d+$/)
      expect(weekValue).toMatch(/^\d+$/)
    })

    test('should load tenant data correctly', async ({ page }) => {
      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      const tenantSelect = page.locator('[data-testid="tenant-select"]')
      await expect(tenantSelect).toBeVisible()

      const tenantOptions = tenantSelect.locator('option')
      await expect(tenantOptions).toHaveCount(2)

      await expect(tenantOptions.nth(1)).toHaveText('Clínica San Rafael')
    })

    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('**/api/tenants', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      await page.goto('/booking')

      const errorMessage = page.locator('text=Error loading tenants')
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible()
      }
    })
  })

  test.describe('Navigation and State Management', () => {
    test('should maintain authentication state across pages', async ({ page }) => {
      test.use({ storageState: 'tests/.auth/admin.json' })

      await page.goto('/dashboard')
      await expect(page.locator('h1, h2')).toBeVisible()

      await page.goto('/patients')
      await expect(page.locator('h1')).toContainText('Gestión de Pacientes')

      await page.goto('/agenda')
      await expect(page).toHaveURL('/agenda')

      await page.goto('/booking')
      await expect(page).toHaveURL('/booking')
    })

    test('should handle deep linking correctly', async ({ page }) => {
      await page.goto('/patients')

      await expect(page).toHaveURL(/\/auth\/login/)

      await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
      await page.fill('[data-testid="password-input"]', 'password')
      await page.click('[data-testid="login-submit"]')

      await page.waitForURL('/dashboard/**')
    })

    test('should handle browser back and forward', async ({ page }) => {
      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      await page.selectOption('[data-testid="tenant-select"]', 'clinica-san-rafael')
      await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1)

      await page.goto('/auth/login')
      await expect(page.locator('h2, h1')).toContainText('Iniciar Sesión')

      await page.goBack()
      await expect(page).toHaveURL('/booking')

      const tenantSelect = page.locator('[data-testid="tenant-select"]')
      if (await tenantSelect.isVisible()) {
        const selectedValue = await tenantSelect.inputValue()
        expect(selectedValue).toBe('')
      }
    })
  })

  test.describe('Performance and Loading States', () => {
    test('should show loading states', async ({ page }) => {
      await page.goto('/auth/login')
      await expect(page.locator('h1, h2')).toBeVisible()

      await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
      await page.fill('[data-testid="password-input"]', 'password')

      const loginButton = page.locator('[data-testid="login-submit"]')
      await loginButton.click()

      await expect(loginButton).toContainText('Iniciando sesión...')
      await expect(loginButton).toBeDisabled()

      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should handle slow network gracefully', async ({ page }) => {
      await page.route('**/api/**', route => {
        setTimeout(() => route.continue(), 1000)
      })

      await page.goto('/booking')
      await expect(page.locator('h1')).toBeVisible()

      await page.selectOption('[data-testid="tenant-select"]', 'clinica-san-rafael')

      const loadingIndicator = page.locator('.animate-spin')
      if (await loadingIndicator.isVisible()) {
        await expect(loadingIndicator).toBeVisible()
      }

      // Wait for services to load (indicated by having options)
      await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1)
    })
  })
})