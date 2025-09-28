const { chromium } = require('playwright');

async function testDoctorLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing doctor login...');

    // Listen for console messages
    page.on('console', msg => {
      console.log(`BROWSER CONSOLE [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('BROWSER ERROR:', error.message);
    });

    await page.goto('http://localhost:3010/auth/login');

    console.log('📝 Filling doctor credentials...');
    await page.fill('input[data-testid="email-input"]', 'ana.rodriguez@email.com');
    await page.fill('input[data-testid="password-input"]', 'password');

    console.log('🔄 Submitting form...');
    await page.click('button[data-testid="login-submit"]');

    // Wait longer to see what happens
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('📍 Final URL:', currentUrl);

    // Check for error messages
    const errorElement = await page.$('[data-testid="login-error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error message:', errorText);
    }

    // Check cookies
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('auth-token'));
    console.log('🍪 Auth cookie present:', authCookie ? 'Yes' : 'No');

    if (currentUrl.includes('/agenda')) {
      console.log('✅ Doctor login successful!');
    } else if (currentUrl.includes('/auth/login')) {
      console.log('❌ Doctor login failed - still on login page');
    } else {
      console.log('❓ Unexpected redirect:', currentUrl);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await browser.close();
  }
}

testDoctorLogin();