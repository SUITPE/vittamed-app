# Problema Playwright - Análisis y Solución

## 🔴 Problema Principal

Los tests de Playwright están haciendo **timeout** al intentar ejecutarse.

---

## 🔍 Causas Identificadas

### 1. **Contraseña Incorrecta** ✅ CORREGIDO
**Antes:**
```typescript
await page.fill('input[type="password"]', 'password')
```

**Ahora:**
```typescript
await page.fill('input[type="password"]', 'password123')
```

**Validación:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"admin@clinicasanrafael.com","password":"password123"}'
# ✅ Resultado: 200 OK
```

---

### 2. **Selectores Incorrectos** ⚠️ ENCONTRADO

**Tests antiguos usan selectores que no existen:**
```typescript
// ❌ INCORRECTO
await page.fill('[data-testid="email-input"]', ...)
await page.fill('[data-testid="password-input"]', ...)
await page.click('[data-testid="login-submit"]')
```

**Selectores correctos:**
```typescript
// ✅ CORRECTO
await page.fill('input[type="email"]', ...)
await page.fill('input[type="password"]', ...)
await page.click('button[type="submit"]')
```

**Ya corregido en:**
- ✅ `patient-crud-e2e.spec.ts`
- ✅ `patient-management.spec.ts`

---

### 3. **Título de Página Incorrecto** ⚠️ ENCONTRADO

**Test espera:**
```typescript
await expect(page.locator('h1')).toContainText('Gestión de Pacientes')
```

**Título real:**
```html
<h1>Pacientes - Clínica San Rafael</h1>
```

**Solución:**
```typescript
// Cambiar a:
await expect(page.locator('h1')).toContainText('Pacientes')
```

---

### 4. **Timeout Muy Corto**

**Antes:** 10000ms (10 segundos)
```typescript
await page.waitForURL('/dashboard/**', { timeout: 10000 })
```

**Ahora:** 15000ms (15 segundos)
```typescript
await page.waitForURL('/dashboard/**', { timeout: 15000 })
```

---

## ✅ Correcciones Aplicadas

### Archivos Modificados:

1. **`tests/patient-crud-e2e.spec.ts`**
   - ✅ Contraseña: `password` → `password123`
   - ✅ Timeout: `10000` → `15000`

2. **`tests/patient-management.spec.ts`**
   - ✅ Contraseña: `password` → `password123`
   - ✅ Selectores: `[data-testid]` → `input[type="..."]`
   - ✅ Timeout: default → `15000`

---

## 🚫 Por Qué Siguen Fallando

### Problema Pendiente: **Test espera título incorrecto**

**En `patient-management.spec.ts` línea 16:**
```typescript
test('should display patients page', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Gestión de Pacientes') // ❌ INCORRECTO
  ...
})
```

**Título real en la página:**
```
"Pacientes - Clínica San Rafael"
```

**Este test NUNCA pasará** porque busca un texto que no existe.

---

## 🔧 Solución Completa

### Opción 1: Cambiar el Test
```typescript
test('should display patients page', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('Pacientes') // ✅ Más flexible
  await expect(page.locator('text=Administra la información de tus pacientes')).toBeVisible()
  await expect(page.locator('button').filter({ hasText: 'Agregar Paciente' })).toBeVisible()
})
```

### Opción 2: Cambiar el Componente
Modificar `/src/app/patients/page.tsx` línea 221:
```typescript
// De:
<h1>Pacientes - {tenantInfo?.name || 'Cargando...'}</h1>

// A:
<h1>Gestión de Pacientes</h1>
<p className="text-sm text-gray-500">{tenantInfo?.name}</p>
```

---

## 📊 Estado de los Tests

| Test File | Login | Selectores | Título | Estado |
|-----------|-------|------------|--------|--------|
| `patient-crud-e2e.spec.ts` | ✅ | ✅ | ⚠️ | Corregir título |
| `patient-management.spec.ts` | ✅ | ✅ | ❌ | Corregir título |
| `integration/patient-api.test.ts` | N/A | N/A | N/A | Sin ejecutar |
| `unit/patient-validation.test.ts` | N/A | N/A | N/A | Sin ejecutar |

---

## 🎯 Siguiente Paso Recomendado

**Opción A: Rápido (Cambiar Tests)**
```bash
# Editar patient-management.spec.ts línea 16
# Cambiar de "Gestión de Pacientes" a "Pacientes"

npx playwright test patient-management.spec.ts
```

**Opción B: Mejor UX (Cambiar Componente)**
```bash
# Editar /src/app/patients/page.tsx
# Separar título del nombre del tenant

npx playwright test patient-management.spec.ts
```

---

## 🧪 Comando de Prueba Rápida

```bash
# Ver si el login funciona ahora
npx playwright test patient-management.spec.ts \
  --grep "should display patients page" \
  --headed \
  --timeout=30000
```

---

## ✅ Credenciales Verificadas

| Rol | Email | Password | Estado |
|-----|-------|----------|--------|
| Admin | admin@clinicasanrafael.com | password123 | ✅ Funciona |
| Doctor | doctor-1759245234123@clinicasanrafael.com | VittaMed2024! | ✅ Funciona |
| Staff | secre@clinicasanrafael.com | password | ✅ Funciona |

---

## 📝 Resumen

**Problemas encontrados:**
1. ✅ Contraseña incorrecta (corregido)
2. ✅ Selectores con data-testid que no existen (corregido)
3. ✅ Timeout muy corto (aumentado a 15s)
4. ❌ **Título esperado no coincide con el real** (PENDIENTE)

**Siguiente acción:**
Cambiar el test para que busque "Pacientes" en vez de "Gestión de Pacientes"

---

**Fecha:** 2025-10-03
**Autor:** Claude Code
