const { chromium } = require('playwright');

async function testLoginDebug() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Navegando a login page...');

    // Listen for console messages and errors
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('BROWSER ERROR:', error.message);
    });

    await page.goto('http://localhost:3010/auth/login');
    console.log('✅ Page loaded');

    // Wait for the form to be visible
    await page.waitForSelector('form');
    console.log('✅ Form found');

    // Check if JavaScript is working by evaluating a simple expression
    const jsTest = await page.evaluate(() => window.location.href);
    console.log('✅ JavaScript working:', jsTest);

    // Fill the form
    console.log('📝 Llenando formulario...');
    await page.fill('input[data-testid="email-input"]', 'admin@clinicasanrafael.com');
    await page.fill('input[data-testid="password-input"]', 'password');

    // Check if the form has the onSubmit handler
    const hasOnSubmit = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form && form.onsubmit !== null;
    });
    console.log('📋 Form has onSubmit handler:', hasOnSubmit);

    console.log('🔄 Enviando formulario...');
    await page.click('button[data-testid="login-submit"]');

    // Wait a bit to see what happens
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);

    // Check for cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('auth-token'));
    console.log('🍪 Auth cookie:', authCookie ? 'Found' : 'Not found');

    console.log('✅ Test completed');

  } catch (error) {
    console.error('💥 Error en test:', error);
  } finally {
    await browser.close();
  }
}

testLoginDebug();