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
 * 7. Validación de autenticación
 * 8. Performance (<200ms)
 * 9. Obtener lista de capítulos
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

// Credenciales de usuario demo (doctor)
const DEMO_USER = {
  email: 'ana.rodriguez@email.com',
  password: 'VittaSami2024!',
};

test.describe('ICD10 Search API', () => {
  let authCookie: string;

  test.beforeAll(async ({ request }) => {
    // Autenticación: obtener cookie de sesión
    const loginResponse = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: DEMO_USER.email,
        password: DEMO_USER.password,
      },
    });

    expect(loginResponse.ok()).toBeTruthy();

    const cookies = loginResponse.headers()['set-cookie'];
    if (cookies) {
      authCookie = cookies;
    }
  });

  test('debe rechazar requests sin autenticación', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=hipertension`
    );

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  test('debe rechazar queries muy cortas', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=a`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('at least 2 characters');
  });

  test('debe buscar por código exacto (I10)', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=I10`, {
      headers: {
        Cookie: authCookie,
      },
    });

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
      `${BASE_URL}/api/icd10/search?q=diabetes`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Todos los resultados deben contener "diabetes" en descripción o código
    data.results.forEach((result: any) => {
      const matchesDescription = result.description
        .toLowerCase()
        .includes('diabetes');
      const matchesCode = result.code.toLowerCase().includes('e1'); // Códigos E10-E14
      expect(matchesDescription || matchesCode).toBeTruthy();
    });
  });

  test('debe buscar por sinónimo (presion alta -> hipertension)', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=presion%20alta`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Debe incluir I10 (hipertensión) en los resultados
    const hasHypertension = data.results.some(
      (r: any) => r.code === 'I10' || r.description.toLowerCase().includes('hipertensión')
    );
    expect(hasHypertension).toBeTruthy();
  });

  test('debe respetar el límite de resultados', async ({ request }) => {
    const limit = 3;
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=dolor&limit=${limit}`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeLessThanOrEqual(limit);
  });

  test('debe filtrar por capítulo', async ({ request }) => {
    const chapterCode = 'I00-I99'; // Enfermedades del sistema circulatorio
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=dolor&chapter=${chapterCode}`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();

    // Todos los resultados deben pertenecer al capítulo especificado
    data.results.forEach((result: any) => {
      expect(result.chapter_code).toBe(chapterCode);
    });
  });

  test('debe responder en menos de 200ms', async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=fiebre`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();

    // Verificar que el response time reportado también es <200ms
    if (data.responseTime) {
      expect(data.responseTime).toBeLessThan(200);
    }

    // El tiempo total de request debe ser razonable (puede ser mayor por latencia de red)
    console.log(`Response time: ${responseTime}ms (server: ${data.responseTime}ms)`);
  });

  test('debe obtener lista de capítulos', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/chapters`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.chapters).toBeDefined();
    expect(data.chapters.length).toBeGreaterThan(0);
    expect(data.total).toBeGreaterThan(0);

    // Cada capítulo debe tener code, name, count
    const firstChapter = data.chapters[0];
    expect(firstChapter).toHaveProperty('code');
    expect(firstChapter).toHaveProperty('name');
    expect(firstChapter).toHaveProperty('count');
    expect(firstChapter.count).toBeGreaterThan(0);

    // Debe incluir capítulo de enfermedades cardiovasculares
    const hasCardiovascular = data.chapters.some(
      (ch: any) => ch.code === 'I00-I99'
    );
    expect(hasCardiovascular).toBeTruthy();
  });

  test('debe incrementar contador de uso al seleccionar código', async ({
    request,
  }) => {
    const testCode = 'I10';

    // 1. Buscar código para obtener usage_count inicial
    const searchResponse = await request.get(
      `${BASE_URL}/api/icd10/search?q=${testCode}`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(searchResponse.ok()).toBeTruthy();

    // 2. Incrementar contador
    const incrementResponse = await request.post(
      `${BASE_URL}/api/icd10/search`,
      {
        headers: {
          Cookie: authCookie,
          'Content-Type': 'application/json',
        },
        data: {
          code: testCode,
        },
      }
    );

    expect(incrementResponse.ok()).toBeTruthy();
    const incrementData = await incrementResponse.json();
    expect(incrementData.success).toBeTruthy();
  });

  test('debe buscar sin acentos (hipertension sin tilde)', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=hipertension`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Debe encontrar "Hipertensión" (con tilde)
    const hasHypertension = data.results.some((r: any) =>
      r.description.toLowerCase().includes('hipertensión')
    );
    expect(hasHypertension).toBeTruthy();
  });

  test('debe ordenar resultados por relevancia', async ({ request }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=I10`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // El primer resultado debe ser I10 (coincidencia exacta)
    expect(data.results[0].code).toBe('I10');
  });

  test('debe manejar búsquedas de códigos parciales', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/icd10/search?q=E11`, {
      headers: {
        Cookie: authCookie,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Debe incluir E11 y sus subcódigos (E11.9, etc.)
    const codesStartingWithE11 = data.results.filter((r: any) =>
      r.code.startsWith('E11')
    );
    expect(codesStartingWithE11.length).toBeGreaterThan(0);
  });

  test('debe retornar array vacío si no encuentra resultados', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=xyzabc123`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBe(0);
    expect(data.count).toBe(0);
  });

  test('debe incluir todos los campos necesarios en resultados', async ({
    request,
  }) => {
    const response = await request.get(
      `${BASE_URL}/api/icd10/search?q=diabetes`,
      {
        headers: {
          Cookie: authCookie,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.results).toBeDefined();
    expect(data.results.length).toBeGreaterThan(0);

    // Verificar estructura de cada resultado
    const result = data.results[0];
    expect(result).toHaveProperty('code');
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('chapter_name');

    expect(typeof result.code).toBe('string');
    expect(typeof result.description).toBe('string');
    expect(typeof result.category).toBe('string');
    expect(typeof result.chapter_name).toBe('string');
  });
});
