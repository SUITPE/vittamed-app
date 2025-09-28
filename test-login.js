const { chromium } = require('playwright');

async function testLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Navegando a login page...');
    await page.goto('http://localhost:3009/auth/login');

    console.log('📝 Llenando formulario...');
    await page.fill('input[data-testid="email-input"]', 'admin@clinicasanrafael.com');
    await page.fill('input[data-testid="password-input"]', 'password');

    console.log('🔄 Enviando formulario...');
    await page.click('button[data-testid="login-submit"]');

    // Esperar por el redirect o error
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);

    // Verificar si hay errores
    const errorElement = await page.$('[data-testid="login-error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error encontrado:', errorText);
    }

    console.log('✅ Test completado');

  } catch (error) {
    console.error('💥 Error en test:', error);
  } finally {
    await browser.close();
  }
}

testLogin();