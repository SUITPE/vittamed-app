/**
 * Invoice Generator (VT-288)
 *
 * Generates invoices automatically on successful payments
 * with sequential numbering per tenant.
 *
 * Format: FAC-YYYY-NNNNN (e.g., FAC-2024-00001)
 */

import { createAdminClient } from '@/lib/supabase-server';
import type { Invoice, CreateInvoiceData, CreateInvoiceItemData } from '@/types/invoice';

interface PaymentContext {
  tenantId: string;
  patientId: string;
  appointmentId?: string;
  paymentId?: string;
  serviceName: string;
  servicePrice: number;
  quantity?: number;
  notes?: string;
}

/**
 * Get the next sequential invoice number for a tenant
 * Format: FAC-YYYY-NNNNN
 */
export async function getNextInvoiceNumber(tenantId: string): Promise<string> {
  const supabase = await createAdminClient();
  const currentYear = new Date().getFullYear();
  const prefix = `FAC-${currentYear}-`;

  // Get the highest invoice number for this tenant and year
  const { data: lastInvoice, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('tenant_id', tenantId)
    .like('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found
    console.error('[InvoiceGenerator] Error getting last invoice:', error);
    throw new Error('Failed to generate invoice number');
  }

  let nextNumber = 1;

  if (lastInvoice?.invoice_number) {
    // Extract the number from FAC-YYYY-NNNNN
    const match = lastInvoice.invoice_number.match(/FAC-\d{4}-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Pad to 5 digits
  const paddedNumber = nextNumber.toString().padStart(5, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Generate an invoice automatically from a successful payment
 */
export async function generateInvoiceFromPayment(
  context: PaymentContext
): Promise<Invoice> {
  const supabase = await createAdminClient();

  // 1. Generate invoice number
  const invoiceNumber = await getNextInvoiceNumber(context.tenantId);

  // 2. Calculate totals
  const quantity = context.quantity || 1;
  const subtotal = context.servicePrice * quantity;
  const taxRate = 0; // Can be configured per tenant
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  // 3. Create invoice
  const invoiceData: CreateInvoiceData = {
    tenant_id: context.tenantId,
    patient_id: context.patientId,
    appointment_id: context.appointmentId || null,
    invoice_number: invoiceNumber,
    invoice_type: 'invoice',
    issue_date: new Date().toISOString(),
    due_date: new Date().toISOString(), // Paid immediately
    subtotal,
    tax_rate: taxRate,
    tax_amount: taxAmount,
    discount_amount: 0,
    total,
    status: 'paid',
    payment_method: 'culqi', // TODO: Pass from payment context
    payment_reference: context.paymentId || null,
    notes: context.notes || null,
    items: [
      {
        description: context.serviceName,
        quantity,
        unit_price: context.servicePrice,
        subtotal: context.servicePrice * quantity,
        tax_amount: 0,
        total: context.servicePrice * quantity,
      },
    ],
  };

  // 4. Insert invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: invoiceData.tenant_id,
      patient_id: invoiceData.patient_id,
      appointment_id: invoiceData.appointment_id,
      invoice_number: invoiceData.invoice_number,
      invoice_type: invoiceData.invoice_type,
      issue_date: invoiceData.issue_date,
      due_date: invoiceData.due_date,
      subtotal: invoiceData.subtotal,
      tax_rate: invoiceData.tax_rate,
      tax_amount: invoiceData.tax_amount,
      discount_amount: invoiceData.discount_amount,
      total: invoiceData.total,
      status: invoiceData.status,
      payment_method: invoiceData.payment_method,
      payment_reference: invoiceData.payment_reference,
      notes: invoiceData.notes,
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    console.error('[InvoiceGenerator] Error creating invoice:', invoiceError);
    throw new Error('Failed to create invoice');
  }

  // 5. Insert invoice items
  if (invoiceData.items && invoiceData.items.length > 0) {
    const itemsToInsert = invoiceData.items.map((item: CreateInvoiceItemData) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
      tax_amount: item.tax_amount || 0,
      total: item.total,
    }));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('[InvoiceGenerator] Error creating invoice items:', itemsError);
      // Don't throw - invoice was created, just log the error
    }
  }

  console.log(`[InvoiceGenerator] Invoice ${invoiceNumber} generated for payment ${context.paymentId}`);

  return invoice as Invoice;
}

/**
 * Hook to be called after successful payment
 */
export async function onPaymentSuccess(
  tenantId: string,
  appointmentId: string,
  paymentId: string
): Promise<Invoice | null> {
  try {
    const supabase = await createAdminClient();

    // Get appointment details with service and patient
    const { data: appointment, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        service_id,
        services (
          name,
          price
        ),
        patients (
          first_name,
          last_name
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (apptError || !appointment) {
      console.error('[InvoiceGenerator] Appointment not found:', apptError);
      return null;
    }

    // Extract service info (handle potential array from join)
    const service = Array.isArray(appointment.services)
      ? appointment.services[0]
      : appointment.services;

    if (!service) {
      console.error('[InvoiceGenerator] Service not found for appointment');
      return null;
    }

    // Generate invoice
    const invoice = await generateInvoiceFromPayment({
      tenantId,
      patientId: appointment.patient_id,
      appointmentId,
      paymentId,
      serviceName: service.name,
      servicePrice: service.price,
    });

    return invoice;
  } catch (error) {
    console.error('[InvoiceGenerator] Error in onPaymentSuccess:', error);
    return null;
  }
}
