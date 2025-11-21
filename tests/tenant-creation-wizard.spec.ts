import { test, expect } from '@playwright/test'

test.describe('Tenant Creation Wizard - Multi-Step', () => {

  test('should complete the 4-step tenant creation wizard', async ({ page }) => {
    // Step 0: Register and login
    await page.goto('/auth/register')

    // Fill registration form
    await page.fill('input[id="first_name"]', 'Test')
    await page.fill('input[id="last_name"]', 'User')
    await page.fill('input[id="email"]', `test-${Date.now()}@vittasami.com`)
    await page.fill('input[id="password"]', 'Password123!')
    await page.fill('input[id="confirmPassword"]', 'Password123!')

    // Submit registration
    await page.click('button[type="submit"]')

    // Wait for redirect to create tenant page
    await page.waitForURL(/\/admin\/create-tenant/, { timeout: 30000 })

    // Verify we're on the wizard
    await expect(page.locator('text=Crea tu Negocio')).toBeVisible()
    await expect(page.locator('text=Configuración Inicial')).toBeVisible()

    // STEP 1: Select Business Type
    console.log('Step 1: Selecting business type...')

    // Verify step 1 is active
    await expect(page.locator('text=Tipo de Negocio')).toBeVisible()
    await expect(page.locator('text=Elige el tipo de tu negocio')).toBeVisible()

    // Search for a business type
    await page.fill('input[placeholder*="Buscar tipo de negocio"]', 'clínica')
    await page.waitForTimeout(500) // Wait for filter

    // Click on a business type card (Clínica Médica)
    const clinicCard = page.locator('button:has-text("Clínica Médica")').first()
    await clinicCard.click()
    await page.waitForTimeout(500)

    // Verify the card is selected (should have gradient background)
    await expect(clinicCard).toHaveClass(/from-\[#40C9C6\]/)

    // Click "Siguiente" button
    const nextButton = page.locator('button:has-text("Siguiente")')
    await expect(nextButton).toBeEnabled()
    await nextButton.click()

    // STEP 2: Basic Information
    console.log('Step 2: Filling basic information...')
    await page.waitForTimeout(500)

    // Verify we're on step 2
    await expect(page.locator('text=Información Básica')).toBeVisible()

    // Fill basic info (type slowly to avoid triggering auto-submit)
    await page.locator('[data-testid="tenant-name-input"]').click()
    await page.locator('[data-testid="tenant-name-input"]').type('Clínica de Prueba E2E', { delay: 50 })
    await page.locator('[data-testid="tenant-document-input"]').click()
    await page.locator('[data-testid="tenant-document-input"]').type('12345678901', { delay: 50 })

    // Verify preview card shows selected business type
    await expect(page.locator('text=Tipo de Negocio Seleccionado')).toBeVisible()
    await expect(page.locator('text=Clínica Médica')).toBeVisible()

    // Click "Siguiente" button
    await nextButton.click()

    // STEP 3: Contact & Location
    console.log('Step 3: Filling contact information...')
    await page.waitForTimeout(500)

    // Verify we're on step 3
    await expect(page.locator('text=Contacto & Ubicación')).toBeVisible()

    // Fill optional contact info
    await page.fill('[data-testid="tenant-email-input"]', 'contacto@prueba-e2e.com')
    await page.fill('[data-testid="tenant-phone-input"]', '+51 999 999 999')
    await page.fill('[data-testid="tenant-address-input"]', 'Av. Test 123, Lima, Perú')

    // Verify summary card
    await expect(page.locator('text=Resumen de tu Negocio')).toBeVisible()
    await expect(page.locator('text=Clínica de Prueba E2E')).toBeVisible()
    await expect(page.locator('text=12345678901')).toBeVisible()

    // Click "Siguiente" to go to Step 4
    await nextButton.click()

    // STEP 4: Plan Selection
    console.log('Step 4: Selecting subscription plan...')
    await page.waitForTimeout(500)

    // Verify we're on step 4
    await expect(page.locator('text=Selecciona tu Plan')).toBeVisible()

    // Verify default plan is Free (should be pre-selected)
    const freePlanCard = page.locator('[data-testid="plan-card-free"]')
    await expect(freePlanCard).toHaveClass(/border-\[#40C9C6\]/) // Selected state

    // Change to Pro plan
    const proPlanCard = page.locator('[data-testid="plan-card-pro"]')
    await proPlanCard.click()
    await page.waitForTimeout(300)

    // Verify Pro is now selected
    await expect(proPlanCard).toHaveClass(/border-\[#40C9C6\]/)

    // Submit the form
    const submitButton = page.locator('[data-testid="create-tenant-submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Wait for success message
    await expect(page.locator('[data-testid="create-tenant-success"]')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=¡Negocio Creado!')).toBeVisible()

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard\//, { timeout: 10000 })

    console.log('✅ 4-step tenant creation wizard completed successfully!')
  })

  test('should prevent submission when pressing Enter on step 2', async ({ page }) => {
    // Register and login
    await page.goto('/auth/register')
    await page.fill('input[id="first_name"]', 'Enter')
    await page.fill('input[id="last_name"]', 'Test')
    await page.fill('input[id="email"]', `entertest-${Date.now()}@vittasami.com`)
    await page.fill('input[id="password"]', 'Password123!')
    await page.fill('input[id="confirmPassword"]', 'Password123!')
    await page.click('button[type="submit"]')

    // Wait for create tenant page
    await page.waitForURL(/\/admin\/create-tenant/, { timeout: 30000 })

    // Step 1: Select business type
    await page.fill('input[placeholder*="Buscar tipo de negocio"]', 'spa')
    await page.waitForTimeout(500)
    const spaCard = page.locator('button:has-text("Spa y Bienestar")').first()
    await spaCard.click()
    await page.click('button:has-text("Siguiente")')

    // Step 2: Fill name and press Enter
    await page.waitForTimeout(500)
    await page.fill('[data-testid="tenant-name-input"]', 'Enter Key Test')
    await page.fill('[data-testid="tenant-document-input"]', '99999999999')

    // Press Enter on the document input
    await page.press('[data-testid="tenant-document-input"]', 'Enter')

    // Should advance to step 3, NOT submit the form
    await page.waitForTimeout(500)
    await expect(page.locator('text=Contacto & Ubicación')).toBeVisible()

    // Should NOT show success message
    await expect(page.locator('[data-testid="create-tenant-success"]')).not.toBeVisible()

    console.log('✅ Enter key correctly advances to next step instead of submitting')
  })

  test('should navigate back and forth between steps', async ({ page }) => {
    // Register and login
    await page.goto('/auth/register')
    await page.fill('input[id="first_name"]', 'Nav')
    await page.fill('input[id="last_name"]', 'Test')
    await page.fill('input[id="email"]', `navtest-${Date.now()}@vittasami.com`)
    await page.fill('input[id="password"]', 'Password123!')
    await page.fill('input[id="confirmPassword"]', 'Password123!')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/create-tenant/, { timeout: 30000 })

    // Step 1: Select type
    await page.fill('input[placeholder*="Buscar tipo de negocio"]', 'consultorio')
    await page.waitForTimeout(500)
    const card = page.locator('button:has-text("Consultorio Médico")').first()
    await card.click()
    await page.click('button:has-text("Siguiente")')

    // Step 2: Fill info
    await page.waitForTimeout(500)
    await page.fill('[data-testid="tenant-name-input"]', 'Navigation Test')
    await page.fill('[data-testid="tenant-document-input"]', '11111111111')

    // Go to step 3
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Contacto & Ubicación')).toBeVisible()

    // Go back to step 2
    await page.click('button:has-text("Anterior")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Información Básica')).toBeVisible()

    // Verify data is preserved
    await expect(page.locator('[data-testid="tenant-name-input"]')).toHaveValue('Navigation Test')
    await expect(page.locator('[data-testid="tenant-document-input"]')).toHaveValue('11111111111')

    // Go back to step 1
    await page.click('button:has-text("Anterior")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Tipo de Negocio')).toBeVisible()

    // Verify selection is preserved (card should still be selected)
    const selectedCard = page.locator('button:has-text("Consultorio Médico")').first()
    await expect(selectedCard).toHaveClass(/from-\[#40C9C6\]/)

    console.log('✅ Navigation between steps works correctly with data preservation')
  })

  test('should disable "Siguiente" button when required fields are empty', async ({ page }) => {
    // Register and login
    await page.goto('/auth/register')
    await page.fill('input[id="first_name"]', 'Validation')
    await page.fill('input[id="last_name"]', 'Test')
    await page.fill('input[id="email"]', `validation-${Date.now()}@vittasami.com`)
    await page.fill('input[id="password"]', 'Password123!')
    await page.fill('input[id="confirmPassword"]', 'Password123!')
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin\/create-tenant/, { timeout: 30000 })

    // Step 1: Don't select anything - button should be disabled
    const nextButton = page.locator('button:has-text("Siguiente")')
    await expect(nextButton).toBeDisabled()

    // Select a type - button should be enabled
    await page.fill('input[placeholder*="Buscar tipo de negocio"]', 'spa')
    await page.waitForTimeout(500)
    const spaCard = page.locator('button:has-text("Spa y Bienestar")').first()
    await spaCard.click()
    await expect(nextButton).toBeEnabled()

    // Go to step 2
    await nextButton.click()
    await page.waitForTimeout(500)

    // Step 2: Button should be disabled without required fields
    await expect(nextButton).toBeDisabled()

    // Fill only name - still disabled
    await page.fill('[data-testid="tenant-name-input"]', 'Test Clinic')
    await expect(nextButton).toBeDisabled()

    // Fill document - now enabled
    await page.fill('[data-testid="tenant-document-input"]', '22222222222')
    await expect(nextButton).toBeEnabled()

    // Go to step 3
    await nextButton.click()
    await page.waitForTimeout(500)

    // Step 3: Button should be enabled (no required fields)
    await expect(nextButton).toBeEnabled()

    // Go to Step 4
    await nextButton.click()
    await page.waitForTimeout(500)

    // Step 4: No "Siguiente" button (now it's "Crear Negocio")
    await expect(page.locator('button:has-text("Siguiente")')).not.toBeVisible()
    const submitButton = page.locator('[data-testid="create-tenant-submit"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled() // Should be enabled (plan is pre-selected)

    console.log('✅ Validation works correctly - button enables/disables based on required fields')
  })
})

// Helper function to register and navigate to Step 4
async function registerAndNavigateToStep4(page: any) {
  const email = `test-${Date.now()}@vittasami.com`

  await page.goto('/auth/register')
  await page.fill('input[id="first_name"]', 'Test')
  await page.fill('input[id="last_name"]', 'User')
  await page.fill('input[id="email"]', email)
  await page.fill('input[id="password"]', 'Password123!')
  await page.fill('input[id="confirmPassword"]', 'Password123!')
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/admin\/create-tenant/, { timeout: 30000 })

  // Step 1: Select type
  await page.fill('input[placeholder*="Buscar"]', 'clínica')
  await page.waitForTimeout(500)
  await page.locator('button:has-text("Clínica Médica")').first().click()
  await page.click('button:has-text("Siguiente")')

  // Step 2: Basic info
  await page.waitForTimeout(500)
  await page.fill('[data-testid="tenant-name-input"]', 'Test Clinic')
  await page.fill('[data-testid="tenant-document-input"]', '12345678901')
  await page.click('button:has-text("Siguiente")')

  // Step 3: Contact (skip optional fields)
  await page.waitForTimeout(500)
  await page.click('button:has-text("Siguiente")')

  // Now on Step 4
  await page.waitForTimeout(500)
  await expect(page.locator('text=Selecciona tu Plan')).toBeVisible()
}

test.describe('Plan Selection - Step 4', () => {

  test('should show Free plan as default selection', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Verify Free plan is pre-selected
    const freePlan = page.locator('[data-testid="plan-card-free"]')
    await expect(freePlan).toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Free plan is selected by default')
  })

  test('should allow selecting Care plan', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Click on Care plan
    const carePlan = page.locator('[data-testid="plan-card-care"]')
    await carePlan.click()
    await page.waitForTimeout(300)

    // Verify Care is selected
    await expect(carePlan).toHaveClass(/border-\[#40C9C6\]/)

    // Verify Free is no longer selected
    const freePlan = page.locator('[data-testid="plan-card-free"]')
    await expect(freePlan).not.toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Care plan can be selected')
  })

  test('should allow selecting Pro plan (Popular)', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Verify Pro plan has "Más Popular" or "Popular" badge
    const proPlan = page.locator('[data-testid="plan-card-pro"]')
    const popularBadge = proPlan.locator('text=/Más Popular|Popular/i')
    await expect(popularBadge).toBeVisible()

    // Select Pro
    await proPlan.click()
    await page.waitForTimeout(300)

    // Verify selection
    await expect(proPlan).toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Pro plan with Popular badge can be selected')
  })

  test('should allow selecting Enterprise plan', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Select Enterprise
    const enterprisePlan = page.locator('[data-testid="plan-card-enterprise"]')
    await enterprisePlan.click()
    await page.waitForTimeout(300)

    // Verify selection
    await expect(enterprisePlan).toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Enterprise plan can be selected')
  })

  test('should toggle between monthly and annual pricing', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Get Care plan card
    const carePlan = page.locator('[data-testid="plan-card-care"]')

    // Verify monthly pricing is visible initially (should show $39 or similar)
    await expect(carePlan.locator('text=/\\$39|39/')).toBeVisible()

    // Click annual toggle
    const annualButton = page.locator('button:has-text("Anual")')
    await annualButton.click()
    await page.waitForTimeout(500)

    // Verify annual pricing appears (should show $33 or similar with discount)
    await expect(carePlan.locator('text=/\\$33|33/')).toBeVisible()

    // Verify discount badge or text appears
    await expect(page.locator('text=/Ahorra|15%|descuento/i')).toBeVisible()

    console.log('✅ Monthly/Annual toggle works correctly')
  })

  test('should preserve plan selection when navigating back and forth', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Select Care plan
    await page.locator('[data-testid="plan-card-care"]').click()
    await page.waitForTimeout(300)

    // Go back to Step 3
    await page.click('button:has-text("Anterior")')
    await page.waitForTimeout(500)
    await expect(page.locator('text=Contacto & Ubicación')).toBeVisible()

    // Go forward to Step 4 again
    await page.click('button:has-text("Siguiente")')
    await page.waitForTimeout(500)

    // Verify Care plan is still selected
    const carePlan = page.locator('[data-testid="plan-card-care"]')
    await expect(carePlan).toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Plan selection is preserved on navigation')
  })

  test('should send correct subscription_plan_key to API', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Intercept API call
    let requestBody: any
    await page.route('/api/tenants', async (route) => {
      const request = route.request()
      if (request.method() === 'POST') {
        const postData = request.postData()
        if (postData) {
          requestBody = JSON.parse(postData)
        }
      }
      await route.continue()
    })

    // Select Pro plan
    await page.locator('[data-testid="plan-card-pro"]').click()
    await page.waitForTimeout(300)

    // Submit
    await page.click('[data-testid="create-tenant-submit"]')

    // Wait for API call
    await page.waitForTimeout(2000)

    // Verify request body contains subscription_plan_key: 'pro'
    expect(requestBody).toHaveProperty('subscription_plan_key', 'pro')
    expect(requestBody).toHaveProperty('name')
    expect(requestBody).toHaveProperty('tenant_type')

    console.log('✅ API receives correct subscription_plan_key')
  })

  test('should allow changing plan multiple times before submit', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Select Care
    await page.locator('[data-testid="plan-card-care"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="plan-card-care"]')).toHaveClass(/border-\[#40C9C6\]/)

    // Change to Pro
    await page.locator('[data-testid="plan-card-pro"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="plan-card-pro"]')).toHaveClass(/border-\[#40C9C6\]/)

    // Change to Free
    await page.locator('[data-testid="plan-card-free"]').click()
    await page.waitForTimeout(300)
    await expect(page.locator('[data-testid="plan-card-free"]')).toHaveClass(/border-\[#40C9C6\]/)

    // Verify only Free is selected now
    await expect(page.locator('[data-testid="plan-card-care"]')).not.toHaveClass(/border-\[#40C9C6\]/)
    await expect(page.locator('[data-testid="plan-card-pro"]')).not.toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Can change plan multiple times')
  })

  test('should handle rapid plan selection (race conditions)', async ({ page }) => {
    await registerAndNavigateToStep4(page)

    // Click rapidly on different plans
    await page.locator('[data-testid="plan-card-care"]').click()
    await page.locator('[data-testid="plan-card-pro"]').click()
    await page.locator('[data-testid="plan-card-enterprise"]').click()

    // Wait and verify final state
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="plan-card-enterprise"]')).toHaveClass(/border-\[#40C9C6\]/)

    // Verify only Enterprise is selected
    await expect(page.locator('[data-testid="plan-card-care"]')).not.toHaveClass(/border-\[#40C9C6\]/)
    await expect(page.locator('[data-testid="plan-card-pro"]')).not.toHaveClass(/border-\[#40C9C6\]/)
    await expect(page.locator('[data-testid="plan-card-free"]')).not.toHaveClass(/border-\[#40C9C6\]/)

    console.log('✅ Rapid plan selection handled correctly')
  })
})
