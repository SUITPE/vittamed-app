const { chromium } = require('playwright');

async function testUserType(email, expectedPath) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log(`\n🚀 Testing ${email}...`);
    await page.goto('http://localhost:3010/auth/login');

    await page.fill('input[data-testid="email-input"]', email);
    await page.fill('input[data-testid="password-input"]', 'password');

    await page.click('button[data-testid="login-submit"]');

    // Wait for navigation
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes(expectedPath)) {
      console.log(`✅ ${email} redirected correctly to ${expectedPath}`);
      return true;
    } else {
      console.log(`❌ ${email} did not redirect to ${expectedPath}, got: ${currentUrl}`);
      return false;
    }

  } catch (error) {
    console.error(`💥 Error testing ${email}:`, error.message);
    return false;
  } finally {
    await browser.close();
  }
}

async function testAllUserTypes() {
  console.log('🧪 Testing all user types...');

  const tests = [
    { email: 'admin@clinicasanrafael.com', expectedPath: '/dashboard/' },
    { email: 'ana.rodriguez@email.com', expectedPath: '/agenda' },
    { email: 'patient@test.com', expectedPath: '/my-appointments' }
  ];

  let allPassed = true;

  for (const test of tests) {
    const passed = await testUserType(test.email, test.expectedPath);
    if (!passed) allPassed = false;
  }

  console.log('\n📊 Test Results:');
  if (allPassed) {
    console.log('✅ All user types redirect correctly!');
  } else {
    console.log('❌ Some redirects failed');
  }

  return allPassed;
}

testAllUserTypes();