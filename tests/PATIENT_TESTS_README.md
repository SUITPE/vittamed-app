# Patient CRUD Tests Documentation

## Overview

Complete test suite for Patient management functionality with the new mandatory `document` field.

## Test Structure

### 1. Unit Tests (`tests/unit/patient-validation.test.ts`)

**Purpose**: Test validation logic and data sanitization in isolation

**Test Coverage**:
- ✅ Required field validation (first_name, last_name, email, **document**)
- ✅ Email format validation
- ✅ Phone number format validation
- ✅ Date validation
- ✅ Data sanitization (trim whitespace, lowercase email)
- ✅ Multiple validation errors handling

**Key Tests**:
```typescript
- validatePatientData() with valid complete patient
- validatePatientData() with missing required fields
- validatePatientData() with missing document (NEW)
- isValidEmail() with various formats
- isValidPhone() with international formats
- sanitizePatientData() preserving document format
```

**Run Command**:
```bash
npm run test:unit -- patient-validation.test.ts
```

---

### 2. Integration Tests (`tests/integration/patient-api.test.ts`)

**Purpose**: Test API endpoints with database integration

**Test Coverage**:
- ✅ POST /api/patients - Create with document validation
- ✅ GET /api/patients - List patients with document field
- ✅ GET /api/patients/[id] - Get single patient
- ✅ PUT /api/patients/[id] - Update patient including document
- ✅ Tenant isolation
- ✅ Authorization checks
- ✅ Data integrity through CRUD cycle

**Key Tests**:
```typescript
✓ Create patient with all required fields including document
✓ Fail when document field is missing (400)
✓ Prevent duplicate email in same tenant
✓ Update patient document number
✓ Search patients by document
✓ Preserve document through create-update cycle
```

**Run Command**:
```bash
npm run test:integration -- patient-api.test.ts
```

---

### 3. E2E Tests

#### 3.1 Updated Existing Tests (`tests/patient-management.spec.ts`)

**Updates Made**:
- ✅ Added "Documento" column verification
- ✅ Added "ID / Documento" field in modal
- ✅ Added document field to required fields validation
- ✅ Added search by document number test
- ✅ Added document display verification test

**Key Tests**:
```typescript
✓ should show patients table (with Documento column)
✓ should open add patient modal (with ID / Documento field)
✓ should validate required fields (includes document)
✓ should search patients by document number (NEW)
✓ should display document in patient table (NEW)
```

#### 3.2 New Comprehensive E2E Tests (`tests/patient-crud-e2e.spec.ts`)

**Purpose**: Complete user workflows from browser perspective

**Test Coverage**:
- ✅ Complete creation flow with document
- ✅ Document field validation (cannot submit without)
- ✅ Search by document number
- ✅ Edit patient and update document
- ✅ Document column display
- ✅ Status toggle preserves document
- ✅ Document in different patient states
- ✅ Patient count updates
- ✅ Partial document search
- ✅ Complete CRUD cycle with document tracking

**Key Scenarios**:
```typescript
E2E-01: Complete patient creation flow with document field
E2E-02: Document field validation - cannot submit without document
E2E-03: Search patients by document number
E2E-04: Edit patient and update document
E2E-05: Patient table displays document column
E2E-06: Toggle patient status preserves document
E2E-07: Verify document field in different patient states
E2E-08: Patient count updates after operations
E2E-09: Search by partial document number
E2E-10: Complete CRUD cycle with document tracking
```

**Run Commands**:
```bash
# Run updated existing tests
npx playwright test patient-management.spec.ts

# Run new comprehensive E2E tests
npx playwright test patient-crud-e2e.spec.ts

# Run all patient E2E tests
npx playwright test patient
```

---

## Test Execution

### Run All Patient Tests
```bash
# All E2E tests
npx playwright test patient

# With headed browser
npx playwright test patient --headed

# Specific test file
npx playwright test patient-crud-e2e.spec.ts

# With extended timeout
npx playwright test patient --timeout=60000
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit -- patient-validation.test.ts

# Integration tests only
npm run test:integration -- patient-api.test.ts

# E2E tests only
npx playwright test patient-management.spec.ts
npx playwright test patient-crud-e2e.spec.ts
```

### Debug Tests
```bash
# Debug mode
npx playwright test patient --debug

# Show test report
npx playwright show-report
```

---

## Test Data

### Valid Test Patient
```typescript
{
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan.perez@example.com',
  document: 'DNI-12345678',        // REQUIRED
  phone: '+51 987654321',
  date_of_birth: '1990-01-01',
  address: 'Av. Principal 123',
  medical_history: 'Sin antecedentes'
}
```

### Invalid Test Cases
```typescript
// Missing document (should fail)
{
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'juan@example.com'
  // document is missing - validation error
}

// Invalid email
{
  first_name: 'Juan',
  last_name: 'Pérez',
  email: 'invalid-email',
  document: 'DOC123'
}
```

---

## Coverage Summary

| Test Type | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| Unit | 1 | 15+ | Validation logic |
| Integration | 1 | 20+ | API endpoints |
| E2E (Updated) | 1 | 14 | Existing workflows |
| E2E (New) | 1 | 10 | Complete CRUD |
| **Total** | **4** | **59+** | **Full stack** |

---

## Document Field Requirements

### Database Schema
```sql
ALTER TABLE patients ADD COLUMN document VARCHAR(255) NOT NULL;
```

### API Validation
- **POST /api/patients**: `document` is required
- **PUT /api/patients/[id]**: `document` can be updated
- **GET /api/patients**: `document` included in response

### Frontend Validation
- HTML5 `required` attribute
- Placeholder: "DNI, Pasaporte, etc."
- Located after Email field
- Searchable via search input

### Search Functionality
Patients can be searched by:
- Name (first_name + last_name)
- Email
- **Document number** (full or partial)

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Patient Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- patient-validation.test.ts

      - name: Run integration tests
        run: npm run test:integration -- patient-api.test.ts

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npx playwright test patient

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v2
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Troubleshooting

### Common Issues

1. **Test timeout errors**
   ```bash
   npx playwright test patient --timeout=60000
   ```

2. **Authentication failures**
   - Verify test credentials: `admin@clinicasanrafael.com / password`
   - Check cookie handling in beforeEach

3. **Element not found**
   - Use `page.waitForLoadState('networkidle')`
   - Add explicit waits: `await page.waitForTimeout(1000)`

4. **Document field not visible**
   - Check that field is after Email in form
   - Verify placeholder text: "DNI, Pasaporte, etc."

---

## Next Steps

1. ✅ Add document field to Patient interface
2. ✅ Update API validation
3. ✅ Create unit tests
4. ✅ Create integration tests
5. ✅ Update E2E tests
6. ✅ Add comprehensive E2E suite
7. 🔄 Run full test suite
8. 📝 Document results

---

## Test Results Template

```
Patient CRUD Test Suite Results
================================

Unit Tests: ___/15 passed
Integration Tests: ___/20 passed
E2E Tests (Updated): ___/14 passed
E2E Tests (New): ___/10 passed

Total: ___/59 tests passed
Coverage: ___%

Duration: ___ seconds
```

---

## Maintenance

- Update tests when document validation rules change
- Add new test cases for edge cases
- Keep test data realistic and varied
- Monitor test execution times
- Review and update annually
