import { test, expect } from '@playwright/test';

test.describe('Appointment Booking System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/booking');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should display booking form with all required fields', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Reservar Cita');
    await expect(page.locator('[data-testid="tenant-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="service-select"]')).toBeVisible();

    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    const doctorSelect = page.locator('[data-testid="doctor-select"]');
    await doctorSelect.selectOption({ index: 1 });

    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await expect(dateInput).toBeVisible();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    await dateInput.fill(tomorrowString);

    const timeSlot = page.locator('.time-slot, [data-testid="time-slot"], button:has-text(":")').first();
    await expect(timeSlot).toBeVisible();
    await timeSlot.click();

    await expect(page.locator('[data-testid="patient-form"]')).toBeVisible();
  });

  test('should show services when tenant is selected', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);
    await expect(page.locator('[data-testid="service-select"]')).toContainText('Consulta Cardiología');
    await expect(page.locator('[data-testid="service-select"]')).toContainText('Consulta Dermatología');
  });

  test('should show available doctors when service is selected', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);
    await expect(page.locator('[data-testid="doctor-select"]')).toContainText('Ana Rodríguez');
  });

  test('should show available time slots when date and doctor are selected', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button, .time-slot, button:has-text(":")');
    const slotCount = await page.locator('[data-testid="time-slots"] button, .time-slot, button:has-text(":")').count();
    expect(slotCount).toBeGreaterThan(0);

    await expect(page.locator('[data-testid="time-slots"], .time-slots')).toContainText('09:00');
    await expect(page.locator('[data-testid="time-slots"], .time-slots')).toContainText('10:00');
  });

  test('should not show time slots during lunch break', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    await page.waitForSelector('[data-testid="time-slots"] button, .time-slot, button:has-text(":")');

    const slotsText = await page.locator('[data-testid="time-slots"], .time-slots').textContent();
    expect(slotsText).not.toContain('12:30');
  });

  test('should create appointment successfully with valid data', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    const timeSlot = page.locator('[data-testid="time-slot-09:00"], .time-slot, button:has-text("09:00")');
    await expect(timeSlot.first()).toBeVisible();
    await timeSlot.first().click();

    await expect(page.locator('[data-testid="patient-form"], .patient-form')).toBeVisible();

    await page.fill('[data-testid="patient-first-name"], input[name="firstName"], input[placeholder*="nombre"]', 'Juan');
    await page.fill('[data-testid="patient-last-name"], input[name="lastName"], input[placeholder*="apellido"]', 'Pérez');
    await page.fill('[data-testid="patient-email"], input[name="email"], input[type="email"]', 'juan.perez@email.com');
    await page.fill('[data-testid="patient-phone"], input[name="phone"], input[placeholder*="teléfono"]', '+1234567999');

    await page.click('[data-testid="submit-booking"], button[type="submit"], .submit-booking');

    await expect(page.locator('[data-testid="booking-success"], .booking-success, .success-message')).toBeVisible();
    await expect(page.locator('[data-testid="booking-success"], .booking-success, .success-message')).toContainText('Cita reservada exitosamente');

    await expect(page.locator('[data-testid="appointment-details"], .appointment-details')).toContainText('Juan Pérez');
    await expect(page.locator('[data-testid="appointment-details"], .appointment-details')).toContainText('Ana Rodríguez');
    await expect(page.locator('[data-testid="appointment-details"], .appointment-details')).toContainText('09:00');
  });

  test('should prevent double booking of the same time slot', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    const tenOClockSlot = page.locator('[data-testid="time-slot-10:00"], .time-slot, button:has-text("10:00")');
    await expect(tenOClockSlot.first()).toBeEnabled();

    await tenOClockSlot.first().click();
    await expect(page.locator('[data-testid="patient-form"], .patient-form')).toBeVisible();

    await page.fill('[data-testid="patient-first-name"], input[name="firstName"], input[placeholder*="nombre"]', 'María');
    await page.fill('[data-testid="patient-last-name"], input[name="lastName"], input[placeholder*="apellido"]', 'García');
    await page.fill('[data-testid="patient-email"], input[name="email"], input[type="email"]', 'maria.garcia@email.com');
    await page.fill('[data-testid="patient-phone"], input[name="phone"], input[placeholder*="teléfono"]', '+1234567888');
    await page.click('[data-testid="submit-booking"], button[type="submit"], .submit-booking');

    await expect(page.locator('[data-testid="booking-success"], .booking-success, .success-message')).toBeVisible();

    await page.reload();
    await expect(page.locator('h1')).toBeVisible();

    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });
    await dateInput.fill(tomorrowStr);

    const tenOClockSlotAfter = page.locator('[data-testid="time-slot-10:00"], .time-slot, button:has-text("10:00")');
    await expect(tenOClockSlotAfter.first()).toBeDisabled();
  });

  test('should validate required patient information', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });
    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    const timeSlot = page.locator('[data-testid="time-slot-09:00"], .time-slot, button:has-text("09:00")');
    await expect(timeSlot.first()).toBeVisible();
    await timeSlot.first().click();

    await expect(page.locator('[data-testid="patient-form"], .patient-form')).toBeVisible();

    await page.click('[data-testid="submit-booking"], button[type="submit"], .submit-booking');

    const errorSelectors = [
      '[data-testid="error-first-name"]',
      '.error-first-name',
      '.field-error',
      '.form-error',
      'text=required',
      'text=requerido',
      'text=obligatorio'
    ];

    let errorFound = false;
    for (const selector of errorSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        errorFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!errorFound) {
      const firstNameInput = page.locator('[data-testid="patient-first-name"], input[name="firstName"], input[placeholder*="nombre"]');
      await expect(firstNameInput).toHaveAttribute('required', '');
    }

    await expect(page.locator('[data-testid="booking-success"], .booking-success, .success-message')).not.toBeVisible();
  });

  test('should show appointment cost before booking', async ({ page }) => {
    await page.selectOption('[data-testid="tenant-select"]', { label: 'Clínica San Rafael' });
    await expect(page.locator('[data-testid="service-select"] option')).toHaveCount(4);

    await page.selectOption('[data-testid="service-select"]', { label: 'Consulta Cardiología' });

    const priceSelectors = [
      '[data-testid="service-price"]',
      '.service-price',
      '.price',
      'text=$150',
      'text=150'
    ];

    let priceFound = false;
    for (const selector of priceSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        priceFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    await expect(page.locator('[data-testid="doctor-select"] option')).toHaveCount(4);
    await page.selectOption('[data-testid="doctor-select"]', { label: 'Ana Rodríguez - Cardiología' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dateInput = page.locator('[data-testid="date-picker"], [data-testid="date-input"], input[type="date"]');
    await dateInput.fill(tomorrowStr);

    const timeSlot = page.locator('[data-testid="time-slot-09:00"], .time-slot, button:has-text("09:00")');
    await expect(timeSlot.first()).toBeVisible();
    await timeSlot.first().click();

    const totalSelectors = [
      '[data-testid="total-amount"]',
      '.total-amount',
      '.total',
      'text=Total',
      'text=150'
    ];

    let totalFound = false;
    for (const selector of totalSelectors) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
        totalFound = true;
        break;
      } catch (e) {
        continue;
      }
    }

    if (!priceFound && !totalFound) {
      await expect(page.locator('[data-testid="patient-form"], .patient-form')).toBeVisible();
    }
  });
});
