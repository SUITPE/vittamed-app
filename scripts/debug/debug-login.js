const { chromium } = require('playwright');

async function debugLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Debugging login page...');

    // Listen for all console messages and errors
    page.on('console', msg => {
      console.log(`BROWSER [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('PAGE ERROR:', error.message);
      console.log('Stack:', error.stack);
    });

    // Listen for request failures
    page.on('requestfailed', request => {
      console.log('REQUEST FAILED:', request.url(), request.failure());
    });

    // Listen for network requests
    page.on('request', request => {
      if (request.method() === 'POST') {
        console.log('POST REQUEST:', request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/auth/login')) {
        console.log('LOGIN API RESPONSE:', response.status(), response.statusText());
      }
    });

    await page.goto('http://localhost:3000/auth/login');

    console.log('✅ Page loaded successfully');

    // Check if form elements exist
    const emailInput = await page.$('input[data-testid="email-input"]');
    const passwordInput = await page.$('input[data-testid="password-input"]');
    const submitButton = await page.$('button[data-testid="login-submit"]');

    console.log('📝 Form elements:', {
      email: emailInput ? 'Found' : 'Missing',
      password: passwordInput ? 'Found' : 'Missing',
      submit: submitButton ? 'Found' : 'Missing'
    });

    if (emailInput && passwordInput && submitButton) {
      console.log('📝 Filling credentials...');
      await page.fill('input[data-testid="email-input"]', 'admin@clinicasanrafael.com');
      await page.fill('input[data-testid="password-input"]', 'password');

      console.log('🔄 Clicking submit button...');
      await page.click('button[data-testid="login-submit"]');

      // Wait longer to see what happens
      console.log('⏳ Waiting for response...');
      await page.waitForTimeout(8000);

      const currentUrl = page.url();
      console.log('📍 Final URL:', currentUrl);
    } else {
      console.log('❌ Form elements missing');
    }

    // Take a screenshot for debugging
    await page.screenshot({ path: 'login-debug.png' });
    console.log('📸 Screenshot saved as login-debug.png');

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await browser.close();
  }
}

debugLogin();