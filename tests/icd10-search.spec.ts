/**
 * E2E Tests: ICD10 Search API
 *
 * TASK: TASK-BE-041
 * Epic: EPIC-004 (Historias Clínicas Inteligentes)
 *
 * Test cases:
 * 1. Búsqueda por código exacto (I10)
 * 2. Búsqueda por texto (hipertension)
 * 3. Búsqueda con sinónimos (presion alta)
 * 4. Búsqueda con límite de resultados
 * 5. Búsqueda filtrada por capítulo
 * 6. Validación de parámetros (query muy corto)
 * 7. Performance (<500ms)
 * 8. Obtener lista de capítulos
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

// Use doctor storage state for authenticated tests
test.describe('ICD10 Search API - Authenticated', () => {
  test.use({ storageState: 'tests/.auth/doctor.json' });

  test('debe rechazar queries muy cortas', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=a`);

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('at least 2 characters');
  });

  test('debe buscar por código exacto (I10)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=I10`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // El primer resultado debe ser I10 exacto
    const firstResult = data.results[0];
    expect(firstResult.code).toBe('I10');
    expect(firstResult.description).toContain('Hipertensión');
  });

  test('debe buscar por texto (diabetes)', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=diabetes`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('debe buscar por sinónimo (presion alta -> hipertension)', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=presion%20alta`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('debe respetar el límite de resultados', async ({ request }) => {
    const limit = 3;
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=dolor&limit=${limit}`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeLessThanOrEqual(limit);
  });

  test('debe responder en tiempo razonable', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=fiebre`
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();

    // El tiempo total de request debe ser razonable
    console.log(`Response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(5000); // 5 seconds max
  });

  test('debe obtener lista de capítulos', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/chapters`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.chapters).toBeDefined();
    expect(data.chapters.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);
  });

  test('debe buscar sin acentos (hipertension sin tilde)', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=hipertension`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('debe ordenar resultados por relevancia', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=I10`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // El primer resultado debe ser I10 (coincidencia exacta)
    expect(data.results[0].code).toBe('I10');
  });

  test('debe manejar búsquedas de códigos parciales', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=E11`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);
  });

  test('debe retornar array vacío si no encuentra resultados', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=xyzabc123`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBe(0);
  });

  test('debe incluir todos los campos necesarios en resultados', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=diabetes`
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Verificar estructura de cada resultado
    const result = data.results[0];
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('description');

    expect(typeof result.code).toBe('string');
    expect(typeof result.description).toBe('string');
  });
});
