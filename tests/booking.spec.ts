import { test, expect } from '@playwright/test';

test.describe('Appointment Booking System', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to booking page
    await page.goto('/booking');
  });

  test('should display booking form with all required fields', async ({ page }) => {
    // Test that the booking form shows all necessary elements
    await expect(page.locator('h1')).toContainText('Reservar Cita');

    // Check for tenant/clinic selection
    await expect(page.locator('[data-testid="tenant-select"]')).toBeVisible();

    // Check for service selection
    await expect(page.locator('[data-testid="service-select"]')).toBeVisible();

    // Check for doctor selection
    await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible();

    // Check for date picker
    await expect(page.locator('[data-testid="date-picker"]')).toBeVisible();

    // Time slots are conditional - only appear after selecting doctor and date
    // await expect(page.locator('[data-testid="time-slots"]')).toBeVisible();

    // Check for patient form
    await expect(page.locator('[data-testid="patient-form"]')).toBeVisible();
  });

  test('should show services when tenant is selected', async ({ page }) => {
    // Select a tenant
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });

    // Services should become visible and populated
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4); // 3 services + default option

    // Should have specific services for this clinic
    await expect(page.locator('[data-testid="service-select"]')).toContainText('Consulta Cardiología');
    await expect(page.locator('[data-testid="service-select"]')).toContainText('Consulta Dermatología');
  });

  test('should show available doctors when service is selected', async ({ page }) => {
    // Select tenant and service
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });

    // Doctors should become available
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4); // 3 doctors + default option

    // Should show doctor specializing in cardiology
    await expect(page.locator('[data-testid="doctor-select"]')).toContainText('Ana Rodríguez');
  });

  test('should show available time slots when date and doctor are selected', async ({ page }) => {
    // Complete the selection flow
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    // Select tomorrow's date (to ensure availability)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // Time slots should appear
    await page.waitForSelector('[data-testid="time-slots"] button', { timeout: 10000 });
    const slotCount = await page.locator('[data-testid="time-slots"] button').count();
    expect(slotCount).toBeGreaterThan(0);

    // Should show typical business hours
    await expect(page.locator('[data-testid="time-slots"]')).toContainText('09:00');
    await expect(page.locator('[data-testid="time-slots"]')).toContainText('10:00');
  });

  test('should not show time slots during lunch break', async ({ page }) => {
    // Complete selection flow
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // Should not show lunch hour slots (12:00-13:00 should be missing)
    const slotsText = await page.locator('[data-testid="time-slots"]').textContent();
    expect(slotsText).not.toContain('12:30'); // 12:30 should definitely not be there
  });

  test('should create appointment successfully with valid data', async ({ page }) => {
    // Complete the entire booking flow
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // Select a time slot
    await page.click('[data-testid="time-slot-09:00"]');

    // Fill patient information
    await page.fill('[data-testid="patient-first-name"]', 'Juan');
    await page.fill('[data-testid="patient-last-name"]', 'Pérez');
    await page.fill('[data-testid="patient-email"]', 'juan.perez@email.com');
    await page.fill('[data-testid="patient-phone"]', '+1234567999');

    // Submit the booking
    await page.click('[data-testid="submit-booking"]');

    // Should show success message
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-success"]')).toContainText('Cita reservada exitosamente');

    // Should show appointment details
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('Juan Pérez');
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('Ana Rodríguez');
    await expect(page.locator('[data-testid="appointment-details"]')).toContainText('09:00');
  });

  test('should prevent double booking of the same time slot', async ({ page }) => {
    // First, create an appointment
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // Check that the 10:00 slot is available initially
    await expect(page.locator('[data-testid="time-slot-10:00"]')).toBeEnabled();

    // Select and book the 10:00 slot
    await page.click('[data-testid="time-slot-10:00"]');
    await page.fill('[data-testid="patient-first-name"]', 'María');
    await page.fill('[data-testid="patient-last-name"]', 'García');
    await page.fill('[data-testid="patient-email"]', 'maria.garcia@email.com');
    await page.fill('[data-testid="patient-phone"]', '+1234567888');
    await page.click('[data-testid="submit-booking"]');

    // Wait for success
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();

    // Try to book the same slot again (reload page to simulate new user)
    await page.reload();
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });
    await page.fill('[data-testid="date-picker"]', tomorrowStr);

    // The 10:00 slot should now be disabled or not available
    await expect(page.locator('[data-testid="time-slot-10:00"]')).toBeDisabled();
  });

  test('should validate required patient information', async ({ page }) => {
    // Complete selection but skip patient info
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);
    await page.click('[data-testid="time-slot-09:00"]');

    // Try to submit without patient info
    await page.click('[data-testid="submit-booking"]');

    // Should show validation errors
    await expect(page.locator('[data-testid="error-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-last-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();

    // Should not create appointment
    await expect(page.locator('[data-testid="booking-success"]')).not.toBeVisible();
  });

  test('should show appointment cost before booking', async ({ page }) => {
    // Select service with known price
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });

    // Should display the service price
    await expect(page.locator('[data-testid="service-price"]')).toContainText('$150.00');

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await page.fill('[data-testid="date-picker"]', tomorrowStr);
    await page.click('[data-testid="time-slot-09:00"]');

    // Total should be displayed before patient fills info
    await expect(page.locator('[data-testid="total-amount"]')).toContainText('$150.00');
  });
});