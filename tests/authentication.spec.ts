import { test, expect } from '@playwright/test'

// Tests that DON'T need authentication (login page tests)
test.describe('Authentication Tests - Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Iniciar Sesión en VittaSami')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test.skip('should show demo user credentials', async ({ page }) => {
    // Skipped: Demo credentials are no longer shown on the login page
    await expect(page.locator('text=admin@clinicasanrafael.com / password')).toBeVisible()
  })

  test('should login successfully with admin credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-submit"]')

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard/**', { timeout: 30000 })

    // Check for dashboard content - wait for page to fully load
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 })
  })

  test('should login successfully with doctor credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'alvaro@abp.pe')
    await page.fill('[data-testid="password-input"]', 'VittaMed2024!')
    await page.click('[data-testid="login-submit"]')

    // Wait for navigation to agenda or dashboard
    await page.waitForURL(/\/(agenda|dashboard)/, { timeout: 30000 })

    // Check for page content - wait for page to fully load
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 })
  })

  test('should login successfully with patient credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'patient@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    // Wait for navigation to appointments or client page
    await page.waitForURL(/\/(my-appointments|client)/, { timeout: 30000 })

    // Check for page content
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'invalid@email.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-submit"]')

    await expect(page.locator('[data-testid="login-error"]')).toBeVisible()
  })

  test('should require email and password fields', async ({ page }) => {
    await page.click('[data-testid="login-submit"]')

    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('should navigate to signup page', async ({ page }) => {
    await page.click('text=Regístrate aquí')

    await expect(page).toHaveURL('/auth/register-business')
    await expect(page.locator('h2')).toContainText('Registra tu Negocio')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'password')

    const submitButton = page.locator('[data-testid="login-submit"]')
    await submitButton.click()

    await expect(submitButton).toContainText('Iniciando sesión...')
    await expect(submitButton).toBeDisabled()
  })
})

// Signup Tests - SKIPPED: The /auth/signup page has been replaced with /auth/register-business
// which is a completely different business registration flow
test.describe.skip('Signup Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('should display signup form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Crear Cuenta en VittaSami')
    await expect(page.locator('[data-testid="first-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="last-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="role-select"]')).toBeVisible()
    await expect(page.locator('[data-testid="signup-submit"]')).toBeVisible()
  })

  test('should show user role descriptions', async ({ page }) => {
    await expect(page.locator('text=Pacientes: Pueden reservar citas')).toBeVisible()
    await expect(page.locator('text=Doctores: Pueden gestionar su agenda')).toBeVisible()
    await expect(page.locator('text=Admin Clínica: Acceso completo al dashboard')).toBeVisible()
  })

  test('should create account successfully', async ({ page }) => {
    await page.fill('[data-testid="first-name-input"]', 'Juan')
    await page.fill('[data-testid="last-name-input"]', 'Pérez')
    await page.fill('[data-testid="email-input"]', 'juan.perez@test.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.selectOption('[data-testid="role-select"]', 'patient')
    await page.click('[data-testid="signup-submit"]')

    await expect(page.locator('[data-testid="signup-success"]')).toBeVisible()
    await expect(page.locator('text=¡Cuenta Creada!')).toBeVisible()
  })

  test('should require all fields', async ({ page }) => {
    await page.click('[data-testid="signup-submit"]')

    const firstNameInput = page.locator('[data-testid="first-name-input"]')
    const lastNameInput = page.locator('[data-testid="last-name-input"]')
    const emailInput = page.locator('[data-testid="email-input"]')
    const passwordInput = page.locator('[data-testid="password-input"]')

    await expect(firstNameInput).toHaveAttribute('required', '')
    await expect(lastNameInput).toHaveAttribute('required', '')
    await expect(emailInput).toHaveAttribute('required', '')
    await expect(passwordInput).toHaveAttribute('required', '')
  })

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Inicia sesión aquí')

    await expect(page).toHaveURL('/auth/login')
    await expect(page.locator('h2')).toContainText('Iniciar Sesión en VittaSami')
  })

  test('should show loading state during signup', async ({ page }) => {
    await page.fill('[data-testid="first-name-input"]', 'Test')
    await page.fill('[data-testid="last-name-input"]', 'User')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')

    const submitButton = page.locator('[data-testid="signup-submit"]')
    await submitButton.click()

    await expect(submitButton).toContainText('Creando cuenta...')
    await expect(submitButton).toBeDisabled()
  })
})

// Tests for protected routes (NO authentication)
test.describe('Protected Routes - Unauthenticated', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should redirect to login when accessing agenda without auth', async ({ page }) => {
    await page.goto('/agenda')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('should redirect to login when accessing patients without auth', async ({ page }) => {
    await page.goto('/patients')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})

// Tests for authenticated behavior
test.describe('Protected Routes - Authenticated', () => {
  // Use admin storage state
  test.use({ storageState: 'tests/.auth/admin.json' })

  test('should allow access to dashboard when authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    // Should NOT redirect to login
    await expect(page).not.toHaveURL(/\/auth\/login/)
    // Wait for page to fully load
    await expect(page.locator('h1:visible, h2:visible').first()).toBeVisible({ timeout: 15000 })
  })
})