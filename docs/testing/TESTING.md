# 🧪 VittaMed Testing Guide

## 📚 Table of Contents
- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

VittaMed uses a comprehensive testing strategy with multiple testing frameworks:

- **Vitest** - Unit & Component tests
- **Playwright** - E2E tests
- **React Testing Library** - Component testing utilities

**Current Coverage:**
- Unit Tests: ~15%
- E2E Tests: ~25%
- **Target:** 80% overall coverage

---

## 🧪 Test Types

### 1. Unit Tests (Vitest)
Test individual functions, utilities, and business logic in isolation.

**Location:** `src/__tests__/`

**Examples:**
- `src/__tests__/lib/custom-auth.test.ts` - Authentication utilities
- `src/__tests__/components/Button.test.tsx` - UI components

### 2. E2E Tests (Playwright)
Test complete user flows from start to finish.

**Location:** `tests/`

**Examples:**
- `tests/authentication.spec.ts` - Login/logout flows
- `tests/booking.spec.ts` - Appointment booking
- `tests/dashboard.spec.ts` - Dashboard functionality

---

## 🚀 Running Tests

### Unit Tests

```bash
# Run unit tests in watch mode
npm run test:unit

# Run unit tests once
npm run test:unit:run

# Run with UI
npm run test:unit:ui

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all
```

---

## ✍️ Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'

describe('MyFunction', () => {
  it('should return correct value', () => {
    const result = myFunction(input)
    expect(result).toBe(expectedOutput)
  })

  it('should handle edge cases', () => {
    expect(() => myFunction(invalidInput)).toThrow()
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/auth/login')

  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL('/dashboard')
})
```

---

## 📊 Coverage Reports

### Viewing Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

### Coverage Thresholds

Current thresholds (in `vitest.config.ts`):
```typescript
coverage: {
  thresholds: {
    lines: 60,
    functions: 60,
    branches: 60,
    statements: 60,
  }
}
```

### Coverage Goals

| Quarter | Target |
|---------|--------|
| Q4 2025 | 60% |
| Q1 2026 | 75% |
| Q2 2026 | 85% |

---

## 🔄 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Workflow:** `.github/workflows/test.yml`

### Test Jobs

1. **Unit Tests**
   - Runs Vitest tests
   - Generates coverage
   - Uploads to Codecov

2. **E2E Tests**
   - Runs Playwright tests
   - Uploads test artifacts

3. **Type Check**
   - Validates TypeScript

---

## 🎯 Testing Best Practices

### Do's ✅

- ✅ Write tests before fixing bugs (TDD)
- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Test edge cases and error conditions
- ✅ Maintain high coverage for critical paths

### Don'ts ❌

- ❌ Don't test framework code
- ❌ Don't test third-party libraries
- ❌ Don't write flaky tests
- ❌ Don't skip error cases
- ❌ Don't test implementation details
- ❌ Don't have tests depend on each other

---

## 📁 Test File Structure

```
VittaMedApp/
├── src/
│   └── __tests__/
│       ├── setup.ts              # Test setup & mocks
│       ├── lib/                  # Utility tests
│       │   └── custom-auth.test.ts
│       ├── components/           # Component tests
│       │   └── Button.test.tsx
│       └── flows/                # Business logic tests
│           └── AppointmentFlow.test.ts
├── tests/                        # E2E tests
│   ├── authentication.spec.ts
│   ├── booking.spec.ts
│   └── dashboard.spec.ts
├── vitest.config.ts             # Vitest configuration
└── playwright.config.ts         # Playwright configuration
```

---

## 🔧 Debugging Tests

### Unit Tests

```bash
# Run single test file
npm run test:unit src/__tests__/lib/custom-auth.test.ts

# Run tests matching pattern
npm run test:unit -- --grep "authentication"

# Debug in VS Code
# Add breakpoint and use "Debug Test" code lens
```

### E2E Tests

```bash
# Run with debug mode
npx playwright test --debug

# Run specific test
npx playwright test tests/authentication.spec.ts

# View trace
npx playwright show-trace trace.zip
```

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Coverage Report](./coverage/index.html)

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** Tests fail with "Cannot find module"
```bash
# Solution: Check path aliases in vitest.config.ts
```

**Issue:** E2E tests timeout
```bash
# Solution: Increase timeout in playwright.config.ts
test: {
  timeout: 60000
}
```

**Issue:** Coverage not generated
```bash
# Solution: Ensure @vitest/coverage-v8 is installed
npm install --save-dev @vitest/coverage-v8
```

---

*Updated: October 1, 2025*
