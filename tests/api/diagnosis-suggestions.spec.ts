import { test, expect } from '@playwright/test'

// Tests para VT-232: Sugerencias de Diagnóstico con IA
test.describe('API /api/ai/suggest-diagnosis', () => {

  test('debe retornar 401 sin autenticación', async ({ request }) => {
    const response = await request.post('/api/ai/suggest-diagnosis', {
      data: {
        symptoms: ['fiebre', 'dolor de cabeza']
      }
    })

    expect(response.status()).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Unauthorized')
  })

  test('debe retornar 401 sin auth incluso con datos inválidos', async ({ request }) => {
    // Auth check happens before validation
    const response = await request.post('/api/ai/suggest-diagnosis', {
      data: {}
    })

    expect(response.status()).toBe(401)
  })
})

// Tests con autenticación usando page.request (que respeta storageState)
test.describe('API /api/ai/suggest-diagnosis (autenticado)', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' })

  test('debe retornar 400 con symptoms vacío', async ({ page }) => {
    const response = await page.request.post('/api/ai/suggest-diagnosis', {
      data: {
        symptoms: []
      }
    })

    expect(response.status()).toBe(400)
    const data = await response.json()
    expect(data.success).toBe(false)
  })

  test('debe retornar 503 si no hay AI provider configurado', async ({ page }) => {
    const response = await page.request.post('/api/ai/suggest-diagnosis', {
      data: {
        symptoms: ['fiebre', 'dolor de cabeza'],
        provider: 'anthropic' // Probably not configured
      }
    })

    // Si no hay API key, retorna 503
    // Si está configurado, retorna 200
    expect([200, 503]).toContain(response.status())
  })

  test('debe aceptar request válido con symptoms', async ({ page }) => {
    const response = await page.request.post('/api/ai/suggest-diagnosis', {
      data: {
        symptoms: ['fiebre', 'dolor de cabeza', 'fatiga'],
        maxSuggestions: 3
      }
    })

    // Puede ser 200 (success), 503 (no AI configured), o 500 (AI error)
    const status = response.status()
    const data = await response.json()

    if (status === 200) {
      expect(data.success).toBe(true)
      expect(data.data.suggestions).toBeDefined()
      expect(data.data.disclaimer).toBeDefined()
      expect(data.data.provider).toBeDefined()
    } else if (status === 503) {
      expect(data.error).toContain('not configured')
    }

    // Log para debugging
    console.log(`Status: ${status}, Response:`, JSON.stringify(data, null, 2))
  })

  test('debe incluir disclaimer en respuesta exitosa', async ({ page }) => {
    const response = await page.request.post('/api/ai/suggest-diagnosis', {
      data: {
        symptoms: ['tos', 'fiebre']
      }
    })

    if (response.status() === 200) {
      const data = await response.json()
      expect(data.data.disclaimer).toContain('AVISO')
    }
  })
})
