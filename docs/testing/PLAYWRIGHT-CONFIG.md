# Configuración de Playwright para VittaMed

## 📁 Archivos de Configuración

### `playwright.config.ts`
Archivo principal de configuración de Playwright ubicado en la raíz del proyecto.

**Configuraciones clave:**
```typescript
{
  testDir: './tests',              // Carpeta de tests
  timeout: 120 * 1000,             // 2 minutos timeout total
  expect: { timeout: 15 * 1000 },  // 15 segundos para assertions
  workers: 1,                       // 1 worker para estabilidad
  retries: 2,                       // 2 reintentos en caso de fallo

  use: {
    baseURL: 'http://localhost:3000',
    actionTimeout: 30 * 1000,      // 30 segundos para acciones
    navigationTimeout: 60 * 1000,  // 60 segundos para navegación
  }
}
```

## 🔧 Configuraciones Importantes

### 1. **Timeouts**

Los timeouts están configurados para manejar la autenticación y carga de datos:

- `timeout: 120000` (2 minutos) - Tiempo total del test
- `actionTimeout: 30000` (30 segundos) - Tiempo para clicks, fills, etc
- `navigationTimeout: 60000` (60 segundos) - Tiempo para navegación entre páginas
- `expect.timeout: 15000` (15 segundos) - Tiempo para assertions

**Modificar timeouts:**
```typescript
// En playwright.config.ts
export default defineConfig({
  timeout: 180 * 1000, // Cambiar a 3 minutos si es necesario
})
```

### 2. **Workers (Paralelismo)**

Configurado con `workers: 1` para evitar race conditions durante la autenticación.

**Cambiar a paralelo:**
```typescript
workers: process.env.CI ? 2 : 4, // 2 en CI, 4 en local
fullyParallel: true,
```

### 3. **Retries (Reintentos)**

Configurado con `retries: 2` para manejar fallos temporales de red/auth.

**Modificar reintentos:**
```typescript
retries: process.env.CI ? 3 : 0, // 3 en CI, 0 en local
```

### 4. **Base URL**

Configurado para usar `http://localhost:3000` por defecto.

**Cambiar puerto:**
```bash
# Temporal (línea de comandos)
PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test

# Permanente (en playwright.config.ts)
baseURL: 'http://localhost:3001',
```

## 🔐 Autenticación

### Helper de Autenticación

Ubicado en: `tests/helpers/auth-setup.ts`

**Funciones disponibles:**
- `loginAsDoctor(page)` - Login como doctor
- `loginAsAdmin(page)` - Login como administrador
- `loginAsReceptionist(page)` - Login como recepcionista
- `navigateToAgenda(page)` - Navegar a la agenda

**Uso en tests:**
```typescript
import { loginAsDoctor, navigateToAgenda } from './helpers/auth-setup'

test.beforeEach(async ({ page }) => {
  await loginAsDoctor(page)
  await navigateToAgenda(page)
})
```

### Credenciales de Test

Configuradas en `auth-setup.ts`:

```typescript
Doctor: ana.rodriguez@email.com / password
Admin: admin@clinicasanrafael.com / password
Receptionist: recep@clinicasanrafael.com / password
```

**Cambiar credenciales:**
Editar directamente en `tests/helpers/auth-setup.ts`

## 🎯 Ejecutar Tests

### Comandos Básicos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar test específico
npx playwright test tests/appointment-creation.spec.ts

# Ejecutar con timeout personalizado
npx playwright test tests/appointment-creation.spec.ts --timeout=60000

# Ejecutar con navegador visible
npx playwright test tests/appointment-creation.spec.ts --headed

# Ejecutar test específico
npx playwright test tests/appointment-creation.spec.ts --grep "should show Nueva Cita button"

# Ver reporte de tests
npx playwright show-report
```

### Variables de Entorno

```bash
# Base URL
PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test

# En CI/CD
CI=true npx playwright test
```

## 📊 Reportes y Debugging

### Ver Reportes HTML

```bash
npx playwright show-report
```

### Ver Traces

```bash
npx playwright show-trace test-results/[test-name]/trace.zip
```

### Screenshots y Videos

Configurado en `playwright.config.ts`:
```typescript
screenshot: 'only-on-failure',  // Screenshots solo en fallos
video: 'retain-on-failure',     // Videos solo en fallos
trace: 'on-first-retry',        // Trace en primer reintento
```

## 🔍 Debugging Tests

### Modo Debug

```bash
# Debug específico
npx playwright test tests/appointment-creation.spec.ts --debug

# Pausar en breakpoint
await page.pause()
```

### Modo UI

```bash
npx playwright test --ui
```

### Inspector

```bash
npx playwright codegen http://localhost:3000
```

## 📝 Estructura de Tests

### Organización Recomendada

```
tests/
├── helpers/
│   └── auth-setup.ts           # Helpers de autenticación
├── appointment-creation.spec.ts # Tests de creación de citas
├── authentication.spec.ts       # Tests de autenticación
└── agenda-management.spec.ts    # Tests de agenda
```

### Template de Test

```typescript
import { test, expect } from '@playwright/test'
import { loginAsDoctor, navigateToAgenda } from './helpers/auth-setup'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDoctor(page)
    await navigateToAgenda(page)
  })

  test('should do something', async ({ page }) => {
    // Test implementation
    const button = page.locator('button:has-text("Click Me")')
    await expect(button).toBeVisible()
    await button.click()
  })
})
```

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
- name: Run Playwright tests
  run: |
    CI=true npx playwright test
  env:
    PLAYWRIGHT_BASE_URL: http://localhost:3000
```

### Docker

```bash
docker run --rm -v $(pwd):/work -w /work mcr.microsoft.com/playwright:v1.40.0 \
  npx playwright test
```

## 🔧 Troubleshooting

### Problema: Tests timeout en login

**Solución:** Aumentar `navigationTimeout`:
```typescript
navigationTimeout: 90 * 1000, // 90 segundos
```

### Problema: Tests fallan por race conditions

**Solución:** Reducir workers:
```typescript
workers: 1,
fullyParallel: false,
```

### Problema: Puerto incorrecto

**Solución:** Verificar que el servidor esté en el puerto correcto:
```bash
lsof -ti :3000  # Ver qué está usando el puerto 3000
```

## 📚 Recursos

- [Documentación Playwright](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
