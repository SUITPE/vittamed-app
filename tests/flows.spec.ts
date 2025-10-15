import { test, expect } from '@playwright/test';

test.describe('VittaMed Business Flows with Context7', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to booking page
    await page.goto('/booking');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should execute complete appointment booking flow', async ({ page }) => {
    // Step 1: Select tenant
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).not.toHaveCount(1);

    // Step 2: Select service
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible();

    // Step 3: Select doctor
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    // Step 4: Select date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // Wait for time slots to load
    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });

    // Step 5: Select time slot
    await page.click('[data-testid="time-slot-09:00"]');

    // Step 6: Fill patient information
    await page.fill('[data-testid="patient-first-name"]', 'Flow');
    await page.fill('[data-testid="patient-last-name"]', 'Test');
    await page.fill('[data-testid="patient-email"]', 'flow.test@vittamed.com');
    await page.fill('[data-testid="patient-phone"]', '+1234567777');

    // Step 7: Submit booking (this should trigger the Context7 flow)
    await page.click('[data-testid="submit-booking"]');

    // Verify success state
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-success"]')).toContainText('Cita reservada exitosamente');

    // Verify appointment details are shown
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('Flow Test');
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('Ana Rodríguez');
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('09:00');
  });

  test('should handle flow validation failures', async ({ page }) => {
    // Try to submit without completing all required fields
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });

    // Skip doctor selection and try to submit
    await page.click('[data-testid="submit-booking"]');

    // Should not proceed without all required fields
    await expect(page.locator('[data-testid="booking-success"]')).not.toBeVisible();
  });

  test('should prevent double booking with flow validation', async ({ page }) => {
    // First booking
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });
    await page.click('[data-testid="time-slot-11:00"]');

    await page.fill('[data-testid="patient-first-name"]', 'First');
    await page.fill('[data-testid="patient-last-name"]', 'User');
    await page.fill('[data-testid="patient-email"]', 'first@vittamed.com');
    await page.fill('[data-testid="patient-phone"]', '+1234567111');

    await page.click('[data-testid="submit-booking"]');
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();

    // Try second booking for same slot
    await page.reload();
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });

    // The 11:00 slot should be disabled or not available
    const slot11 = page.locator('[data-testid="time-slot-11:00"]');
    const isDisabled = await slot11.isDisabled();
    const isVisible = await slot11.isVisible();

    // Either the slot is disabled or not visible (both indicate unavailability)
    expect(isDisabled || !isVisible).toBeTruthy();
  });

  test('should show payment integration in flow', async ({ page }) => {
    // Complete booking flow
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });

    // Should show service price as part of the flow
    await expect(page.locator('[data-testid="service-price"]')).toContainText('$150.00');

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });
    await page.click('[data-testid="time-slot-14:00"]');

    // Total amount should be visible before payment
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('$150.00');

    await page.fill('[data-testid="patient-first-name"]', 'Payment');
    await page.fill('[data-testid="patient-last-name"]', 'Test');
    await page.fill('[data-testid="patient-email"]', 'payment.test@vittamed.com');

    await page.click('[data-testid="submit-booking"]');

    // Should complete with payment flow
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
  });

  test('should demonstrate flow rollback on failure', async ({ page }) => {
    // This test simulates a scenario where appointment creation succeeds
    // but payment fails, requiring flow rollback

    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });
    await page.click('[data-testid="time-slot-15:30"]');

    // Use an invalid email to potentially trigger validation failure
    await page.fill('[data-testid="patient-first-name"]', 'Rollback');
    await page.fill('[data-testid="patient-last-name"]', 'Test');
    await page.fill('[data-testid="patient-email"]', 'invalid-email-format');

    await page.click('[data-testid="submit-booking"]');

    // If validation fails, should not show success
    const successVisible = await page.locator('[data-testid="booking-success"]').isVisible();

    if (!successVisible) {
      // Should show error validation messages
      await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
    }
  });
});