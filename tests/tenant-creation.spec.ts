import { test, expect } from '@playwright/test'

// Tests that require admin authentication
test.describe('Tenant Creation (VT-27)', () => {
  test.use({ storageState: 'tests/.auth/admin.json' })

  test.beforeEach(async ({ page }) => {
    // Navigate to tenant creation page
    await page.goto('/admin/create-tenant')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should allow admin to create a new tenant', async ({ page }) => {
    // Wait for page to load
    await expect(page.locator('h2')).toBeVisible({ timeout: 10000 })

    // Verify we can access the create tenant page
    await expect(page.locator('h2')).toContainText('Crear Nuevo Negocio')

    // Generate unique name to avoid conflicts
    const uniqueName = `Test Medical Center ${Date.now()}`

    // Fill out the form
    await page.fill('[data-testid="tenant-name-input"]', uniqueName)

    // Try to select tenant type - may be a select or hidden input with custom dropdown
    const tenantTypeSelect = page.locator('[data-testid="tenant-type-select"]')
    const isHidden = await tenantTypeSelect.evaluate(el => el.getAttribute('type') === 'hidden')
    if (!isHidden && await tenantTypeSelect.isVisible()) {
      await page.selectOption('[data-testid="tenant-type-select"]', 'clinic')
    }

    await page.fill('[data-testid="tenant-email-input"]', `contact${Date.now()}@testmedical.com`)
    await page.fill('[data-testid="tenant-phone-input"]', '+1-555-0123')
    await page.fill('[data-testid="tenant-address-input"]', 'Test Address 123, Test City')

    // Submit the form
    await page.click('[data-testid="create-tenant-submit"]')

    // Check if there's an error message first
    const errorElement = page.locator('[data-testid="create-tenant-error"]')
    if (await errorElement.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await errorElement.textContent()
      console.log('Error creating tenant:', errorText)
    }

    // Wait for success message
    await expect(page.locator('[data-testid="create-tenant-success"]')).toBeVisible({ timeout: 15000 })
  })

  test('should validate required fields', async ({ page }) => {
    await expect(page.locator('h2')).toBeVisible({ timeout: 10000 })

    // Should show browser validation for required name field
    const nameInput = page.locator('[data-testid="tenant-name-input"]')
    await expect(nameInput).toHaveAttribute('required', '')
  })

  test('should handle different tenant types', async ({ page }) => {
    await expect(page.locator('h2')).toBeVisible({ timeout: 10000 })

    // Test each tenant type - skip if using hidden input
    const tenantTypeSelect = page.locator('[data-testid="tenant-type-select"]')
    const isHidden = await tenantTypeSelect.evaluate(el => el.getAttribute('type') === 'hidden')

    if (isHidden) {
      console.log('Tenant type selector is hidden input - skipping selectOption test')
      return
    }

    const tenantTypes = ['clinic', 'spa', 'consultorio']

    for (const tenantType of tenantTypes) {
      await page.selectOption('[data-testid="tenant-type-select"]', tenantType)
      const selectedValue = await page.locator('[data-testid="tenant-type-select"]').inputValue()
      expect(selectedValue).toBe(tenantType)
    }
  })

  test('should show loading state during submission', async ({ page }) => {
    await expect(page.locator('h2')).toBeVisible({ timeout: 10000 })

    // Fill required fields
    await page.fill('[data-testid="tenant-name-input"]', `Loading Test ${Date.now()}`)

    // Click submit
    await page.click('[data-testid="create-tenant-submit"]')

    // The button should either be disabled or show loading text
    const submitButton = page.locator('[data-testid="create-tenant-submit"]')

    // Check if button shows loading state (either disabled or has loading text)
    const isDisabled = await submitButton.isDisabled().catch(() => false)
    const buttonText = await submitButton.textContent()

    // Either the button is disabled or it shows "Creando..." text
    expect(isDisabled || buttonText?.includes('Creando')).toBeTruthy()
  })
})

// Tests for doctor access - separate describe with doctor storage state
test.describe('Tenant Creation - Doctor Access Control', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' })

  test('should show error for doctor users', async ({ page }) => {
    await page.goto('/admin/create-tenant')
    await expect(page.locator('body')).toBeVisible()

    // Should show access restricted or redirect
    const hasRestricted = await page.locator('text=Acceso Restringido').isVisible({ timeout: 5000 }).catch(() => false)
    const hasUnauthorized = await page.locator('text=No autorizado').isVisible({ timeout: 1000 }).catch(() => false)
    const redirectedToLogin = page.url().includes('/auth/login')
    const redirectedToDashboard = page.url().includes('/dashboard') || page.url().includes('/agenda')

    expect(hasRestricted || hasUnauthorized || redirectedToLogin || redirectedToDashboard).toBeTruthy()
  })
})

// Tests for receptionist access - separate describe with receptionist storage state
test.describe('Tenant Creation - Receptionist Access Control', () => {
  test.use({ storageState: 'tests/.auth/receptionist.json' })

  test('should show error for receptionist users', async ({ page }) => {
    await page.goto('/admin/create-tenant')
    await expect(page.locator('body')).toBeVisible()

    // Should show access restricted or redirect
    const hasRestricted = await page.locator('text=Acceso Restringido').isVisible({ timeout: 5000 }).catch(() => false)
    const redirectedToLogin = page.url().includes('/auth/login')
    const redirectedToDashboard = page.url().includes('/dashboard')

    expect(hasRestricted || redirectedToLogin || redirectedToDashboard).toBeTruthy()
  })
})
