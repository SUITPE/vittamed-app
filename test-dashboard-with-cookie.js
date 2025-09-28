const { chromium } = require('playwright');

async function testDashboardWithCookie() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Going to login page first...');
    await page.goto('http://localhost:3010/auth/login');

    // Set the demo cookie manually
    console.log('🍪 Setting demo auth cookie...');
    await page.context().addCookies([{
      name: 'sb-mvvxeqhsatkqtsrulcil-auth-token',
      value: 'demo-session',
      domain: 'localhost',
      path: '/',
      expires: Date.now() / 1000 + 3600 // 1 hour from now
    }]);

    console.log('🏠 Navigating directly to dashboard...');
    await page.goto('http://localhost:3010/dashboard/f47ac10b-58cc-4372-a567-0e02b2c3d479');

    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);

    if (currentUrl.includes('/dashboard/')) {
      console.log('✅ Successfully accessed dashboard!');
    } else if (currentUrl.includes('/auth/login')) {
      console.log('❌ Redirected back to login - auth not working');
    } else {
      console.log('❓ Unexpected URL');
    }

    // Check cookies again
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name.includes('auth-token'));
    console.log('🍪 Auth cookie present:', authCookie ? 'Yes' : 'No');

    console.log('✅ Test completed');

  } catch (error) {
    console.error('💥 Error en test:', error);
  } finally {
    await browser.close();
  }
}

testDashboardWithCookie();