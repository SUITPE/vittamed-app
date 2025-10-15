import { test, expect } from '@playwright/test'

// Use admin storage state for all tests
test.use({ storageState: 'tests/.auth/admin.json' })

test.describe('Tenant Creation (VT-27)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to tenant creation page
    await page.goto('/admin/create-tenant')
    await expect(page.locator('h2')).toBeVisible()
  })

  test('should allow admin to create a new tenant', async ({ page }) => {
    // Already on create tenant page via beforeEach

    // Verify we can access the create tenant page
    await expect(page.locator('h2')).toContainText('Crear Nuevo Negocio')

    // Fill out the form
    await page.fill('[data-testid="tenant-name-input"]', 'Test Medical Center')
    await page.selectOption('[data-testid="tenant-type-select"]', 'clinic')
    await page.fill('[data-testid="tenant-email-input"]', 'contact@testmedical.com')
    await page.fill('[data-testid="tenant-phone-input"]', '+1-555-0123')
    await page.fill('[data-testid="tenant-address-input"]', 'Test Address 123, Test City')

    // Submit the form
    await page.click('[data-testid="create-tenant-submit"]')

    // Check if there's an error message first
    const errorElement = page.locator('[data-testid="create-tenant-error"]')
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent()
      console.log('Error creating tenant:', errorText)
    }

    // Wait for success message
    await expect(page.locator('[data-testid="create-tenant-success"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=¡Negocio Creado!')).toBeVisible()

    // Should redirect to the new tenant's dashboard (allow more time)
    await page.waitForURL('**/dashboard/**', { timeout: 15000 })
  })

  test('should show error for non-admin users', async ({ page }) => {
    test.use({ storageState: 'tests/.auth/doctor.json' })

    // Try to access tenant creation page with doctor credentials
    await page.goto('/admin/create-tenant')

    // Should show access restricted message
    await expect(page.locator('text=Acceso Restringido')).toBeVisible()
    await expect(page.locator('text=Solo los administradores pueden crear nuevos negocios')).toBeVisible()
  })

  test('should show error for patient users', async ({ page }) => {
    test.use({ storageState: 'tests/.auth/receptionist.json' })

    // Try to access tenant creation page with receptionist/patient credentials
    await page.goto('/admin/create-tenant')

    // Should show access restricted message
    await expect(page.locator('text=Acceso Restringido')).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    // Already on create tenant page via beforeEach
    // Try to submit without required fields
    await page.click('[data-testid="create-tenant-submit"]')

    // Should show browser validation for required name field
    const nameInput = page.locator('[data-testid="tenant-name-input"]')
    await expect(nameInput).toHaveAttribute('required', '')
  })

  test('should handle different tenant types', async ({ page }) => {
    // Already on create tenant page via beforeEach
    // Test each tenant type
    const tenantTypes = ['clinic', 'spa', 'consultorio']

    for (const tenantType of tenantTypes) {
      await page.selectOption('[data-testid="tenant-type-select"]', tenantType)
      const selectedValue = await page.locator('[data-testid="tenant-type-select"]').inputValue()
      expect(selectedValue).toBe(tenantType)
    }
  })

  test('should show loading state during submission', async ({ page }) => {
    // Already on create tenant page via beforeEach
    // Fill required fields
    await page.fill('[data-testid="tenant-name-input"]', 'Loading Test Clinic')

    // Click submit and immediately check for loading state
    await page.click('[data-testid="create-tenant-submit"]')

    // Should show loading text briefly
    const submitButton = page.locator('[data-testid="create-tenant-submit"]')
    // The loading state might be brief, so we'll check the button is disabled
    await expect(submitButton).toBeDisabled()
  })
})