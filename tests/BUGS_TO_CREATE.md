# Bugs a Crear en Jira

Estos bugs fueron identificados durante la estabilización de tests E2E (VT-277).

---

## Bug 1: PUT /api/patients/:id endpoint not implemented

**Type:** Bug
**Priority:** High
**Summary:** PUT /api/patients/:id endpoint not implemented (returns 405)

**Description:**
The patient status toggle feature in the UI calls `PUT /api/patients/:id` but this endpoint only has a GET handler.

**Current behavior:**
- PUT request returns 405 Method Not Allowed
- Patient status cannot be toggled from the UI

**Expected behavior:**
- PUT endpoint should update patient data including `is_active` status

**Affected files:**
- `src/app/api/patients/[patientId]/route.ts` (only has GET method)
- `src/components/patients/PatientsClient.tsx` (handleToggleStatus function)

**Test affected:**
- `tests/patient-management.spec.ts` - "should handle patient status toggle" (currently skipped)

---

## Bug 2: POST /api/patients returns error when creating patient via UI

**Type:** Bug
**Priority:** High
**Summary:** POST /api/patients returns error when creating patient via UI

**Description:**
When adding a new patient through the UI modal, the API returns an error and the modal shows "Error al guardar paciente".

**Steps to reproduce:**
1. Go to /patients
2. Click "Agregar Paciente"
3. Fill in all required fields (Nombre, Apellido, Email, Documento)
4. Click "Agregar"

**Current behavior:**
- Error message appears: "Error al guardar paciente"
- Modal stays open
- Patient is not created

**Expected behavior:**
- Patient should be created successfully
- Modal should close
- Patient list should update with new patient

**Test affected:**
- `tests/patient-management.spec.ts` - "should add new patient successfully" (currently skipped)

---

## Bug 3: Mobile E2E tests have flaky locators

**Type:** Bug
**Priority:** Medium
**Summary:** Mobile E2E tests have flaky locators (4 tests failing)

**Description:**
Several mobile tests have locator issues that cause intermittent failures.

**Failing tests:**
1. `agenda-mobile.spec.ts:117` - debe mostrar horarios correctamente en mobile
2. `appointments-mobile.spec.ts:30` - botón Atender debe ser accesible en mobile
3. `appointments-mobile.spec.ts:153` - debe mantener performance en mobile
4. `appointments-mobile.spec.ts:165` - debe poder volver a agenda desde appointments en mobile

**Common issues:**
- Locators expecting elements that may not exist in mobile view
- Navigation links not visible/clickable in mobile viewport
- Performance assertions may be too strict

**Suggested fix:**
- Review mobile UI to ensure all expected elements exist
- Update locators to match actual mobile UI structure
- Make performance assertions more flexible

---

## Summary

| Bug | Priority | Impact |
|-----|----------|--------|
| PUT /api/patients/:id not implemented | High | Status toggle broken |
| POST /api/patients error | High | Cannot add patients via UI |
| Mobile test locators | Medium | 4 tests failing |
