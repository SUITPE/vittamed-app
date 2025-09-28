const { chromium } = require('playwright');

async function testProductionAuth() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing production authentication...');

    // Listen for console messages
    page.on('console', msg => {
      console.log(`BROWSER [${msg.type()}]:`, msg.text());
    });

    page.on('pageerror', error => {
      console.log('BROWSER ERROR:', error.message);
    });

    await page.goto('http://localhost:3000/auth/login');

    console.log('📝 Filling admin credentials...');
    await page.fill('input[data-testid="email-input"]', 'admin@clinicasanrafael.com');
    await page.fill('input[data-testid="password-input"]', 'password');

    console.log('🔄 Submitting form...');
    await page.click('button[data-testid="login-submit"]');

    // Wait for response
    await page.waitForTimeout(5000);

    const currentUrl = page.url();
    console.log('📍 Final URL:', currentUrl);

    // Check for error messages
    const errorElement = await page.$('[data-testid="login-error"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('❌ Error message:', errorText);
    }

    if (currentUrl.includes('/dashboard/')) {
      console.log('✅ Authentication working - redirected to dashboard!');
      return true;
    } else if (currentUrl.includes('/auth/login')) {
      console.log('❌ Authentication failed - still on login page');
      return false;
    } else {
      console.log('❓ Unexpected redirect:', currentUrl);
      return false;
    }

  } catch (error) {
    console.error('💥 Error:', error);
    return false;
  } finally {
    await browser.close();
  }
}

testProductionAuth().then(success => {
  if (success) {
    console.log('\n🎉 Production authentication is working!');
  } else {
    console.log('\n🔧 Production authentication needs more work');
  }
});