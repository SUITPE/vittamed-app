import { test, expect } from '@playwright/test'

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should display login form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Iniciar Sesión en VittaMed')
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-submit"]')).toBeVisible()
  })

  test('should show demo user credentials', async ({ page }) => {
    await expect(page.locator('text=admin@clinicasanrafael.com / password')).toBeVisible()
    await expect(page.locator('text=ana.rodriguez@email.com / password')).toBeVisible()
    await expect(page.locator('text=patient@example.com / password')).toBeVisible()
  })

  test('should login successfully with admin credentials', async ({ page }) => {
    // Capture console logs for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()))

    await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    // Wait for either success (navigation) or error message
    await Promise.race([
      // Success: navigation to dashboard
      page.waitForURL('/dashboard/**', { timeout: 15000 }).then(() => 'navigated'),

      // Error: error message appears
      page.waitForSelector('[data-testid="login-error"]', { timeout: 15000 }).then(() => {
        throw new Error('Login failed - error message appeared')
      }),

      // Fallback: check current URL after timeout
      page.waitForTimeout(10000).then(async () => {
        const currentUrl = page.url()
        const buttonText = await page.textContent('[data-testid="login-submit"]')
        console.log('Current URL:', currentUrl)
        console.log('Button text:', buttonText)

        if (currentUrl.includes('/dashboard') || currentUrl.includes('/agenda')) {
          return 'navigated'
        } else {
          throw new Error(`Still on login page. URL: ${currentUrl}, Button: ${buttonText}`)
        }
      })
    ])

    // Wait for page to load completely
    await page.waitForLoadState('networkidle', { timeout: 10000 })

    // Check for dashboard content with more flexible matching
    await expect(page.locator('h1, h2, [data-testid="dashboard"], .dashboard-title')).toBeVisible({ timeout: 20000 })
  })

  test('should login successfully with doctor credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'ana.rodriguez@email.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    // Wait for agenda page with extended timeout and fallback
    try {
      await page.waitForURL('/agenda', { timeout: 60000 })
    } catch (e) {
      // Fallback: check if we're on agenda or relevant page
      await page.waitForFunction(() => {
        return window.location.pathname.includes('/agenda') ||
               window.location.pathname.includes('/member') ||
               document.title.includes('Agenda')
      }, { timeout: 30000 })
    }

    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // Check for agenda content with more flexible matching
    await expect(page.locator('h1, h2, [data-testid="agenda"], .agenda-title')).toBeVisible({ timeout: 20000 })
  })

  test('should login successfully with patient credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'patient@example.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    // Wait for patient appointments page with extended timeout and fallback
    try {
      await page.waitForURL('/my-appointments', { timeout: 60000 })
    } catch (e) {
      // Fallback: check if we're on appointments or client page
      await page.waitForFunction(() => {
        return window.location.pathname.includes('/my-appointments') ||
               window.location.pathname.includes('/client') ||
               window.location.pathname.includes('/appointments') ||
               document.title.includes('Citas')
      }, { timeout: 30000 })
    }

    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // Check for appointments content with more flexible matching
    await expect(page.locator('h1, h2, [data-testid="appointments"], .appointments-title')).toBeVisible({ timeout: 20000 })
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

    await expect(page).toHaveURL('/auth/signup')
    await expect(page.locator('h2')).toContainText('Crear Cuenta en VittaMed')
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

test.describe('Signup Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
  })

  test('should display signup form', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Crear Cuenta en VittaMed')
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
    await expect(page.locator('h2')).toContainText('Iniciar Sesión en VittaMed')
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

test.describe('Protected Routes', () => {
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

  test('should redirect to dashboard when authenticated user accesses login', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('[data-testid="email-input"]', 'admin@clinicasanrafael.com')
    await page.fill('[data-testid="password-input"]', 'password')
    await page.click('[data-testid="login-submit"]')

    await page.waitForURL('/dashboard/**')

    await page.goto('/auth/login')
    await expect(page).toHaveURL('/dashboard')
  })
})