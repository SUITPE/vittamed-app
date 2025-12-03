/**
 * API Route: /api/invoices/[invoiceId]/payments
 * Ticket: VT-287 - Facturacion: Modelo de datos y API basica
 *
 * POST - Record a payment
 * GET - List payments for an invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const RecordPaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'yape', 'plin', 'culqi', 'stripe', 'other']),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// POST - Record Payment
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  console.log('[POST /api/invoices/[invoiceId]/payments] START:', invoiceId);

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;

    // 2. Check role
    const allowedRoles = ['admin_tenant', 'staff', 'receptionist', 'super_admin'];
    if (!allowedRoles.includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 3. Parse and validate
    const body = await request.json();
    const parseResult = RecordPaymentSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const adminClient = await createAdminClient();

    // 4. Get invoice and verify it can receive payments
    const { data: invoice, error: fetchError } = await adminClient
      .from('invoices')
      .select('id, status, total, paid_amount, balance')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const canReceivePayment = ['pending', 'partial', 'overdue'].includes(invoice.status);
    if (!canReceivePayment) {
      return NextResponse.json(
        { error: `Cannot record payment for invoice with status: ${invoice.status}` },
        { status: 400 }
      );
    }

    // 5. Validate payment amount
    if (data.amount > invoice.balance) {
      return NextResponse.json(
        { error: `Payment amount (${data.amount}) exceeds balance (${invoice.balance})` },
        { status: 400 }
      );
    }

    // 6. Create payment record
    const { data: payment, error: paymentError } = await adminClient
      .from('invoice_payments')
      .insert({
        invoice_id: invoiceId,
        amount: data.amount,
        payment_method: data.payment_method,
        payment_date: data.payment_date || new Date().toISOString().split('T')[0],
        reference: data.reference || null,
        notes: data.notes || null,
        received_by: user.id,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('[POST payments] Insert error:', paymentError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // 7. Get updated invoice (trigger will have updated totals)
    const { data: updatedInvoice } = await adminClient
      .from('invoices')
      .select('id, status, total, paid_amount, balance')
      .eq('id', invoiceId)
      .single();

    console.log('[POST payments] SUCCESS - Payment recorded');
    return NextResponse.json({
      payment,
      invoice: updatedInvoice,
      message: updatedInvoice?.status === 'paid'
        ? 'Payment recorded. Invoice is now fully paid.'
        : 'Payment recorded successfully.',
    }, { status: 201 });

  } catch (error) {
    console.error('[POST payments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET - List Payments
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;
    const supabase = await createClient();

    // 2. Verify invoice belongs to tenant
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 3. Get payments
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select(`
        *,
        received_by_user:custom_users!invoice_payments_received_by_fkey(first_name, last_name)
      `)
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('[GET payments] Error:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments });

  } catch (error) {
    console.error('[GET payments] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
