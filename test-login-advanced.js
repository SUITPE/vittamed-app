const { chromium } = require('playwright');

async function testLoginAdvanced() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Navegando a login page...');
    await page.goto('http://localhost:3010/auth/login');

    console.log('📝 Llenando formulario...');
    await page.fill('input[data-testid="email-input"]', 'admin@clinicasanrafael.com');
    await page.fill('input[data-testid="password-input"]', 'password');

    // Listen for console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    console.log('🔄 Enviando formulario...');
    await page.click('button[data-testid="login-submit"]');

    // Wait for navigation or timeout
    try {
      await page.waitForNavigation({ timeout: 5000 });
      console.log('✅ Navigation successful!');
    } catch (navError) {
      console.log('⚠️ No navigation detected, checking current state...');
    }

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 URL actual:', currentUrl);

    // Check if user is logged in by looking for cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('auth-token'));
    console.log('🍪 Auth cookie:', authCookie ? 'Found' : 'Not found');

    // Check for error messages
    const errorElement = await page.$('[data-testid="login-error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error encontrado:', errorText);
    } else {
      console.log('✅ No error messages');
    }

    // If still on login page, try to check what happened
    if (currentUrl.includes('/auth/login')) {
      console.log('🔍 Still on login page, checking loading state...');
      const submitButton = await page.$('button[data-testid="login-submit"]');
      const buttonText = await submitButton.textContent();
      console.log('🔘 Button text:', buttonText);
    }

    // Keep browser open to see what's happening
    console.log('🔍 Keeping browser open for inspection...');
    await page.waitForTimeout(10000);

    console.log('✅ Test completed');

  } catch (error) {
    console.error('💥 Error en test:', error);
  } finally {
    await browser.close();
  }
}

testLoginAdvanced();