/**
 * API Route: /api/invoices/[invoiceId]
 * Ticket: VT-287 - Facturacion: Modelo de datos y API basica
 *
 * GET - Get invoice details
 * PATCH - Update invoice
 * DELETE - Delete draft invoice
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import type { InvoiceWithRelations } from '@/types/invoice';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateInvoiceSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'partial', 'overdue', 'cancelled', 'refunded']).optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  discount_amount: z.number().min(0).optional(),
  notes: z.string().optional().nullable(),
  internal_notes: z.string().optional().nullable(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional().nullable(),
  customer_phone: z.string().optional().nullable(),
  customer_document_type: z.string().optional().nullable(),
  customer_document_number: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
});

// ============================================================================
// GET - Get Invoice Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  console.log('[GET /api/invoices/[invoiceId]] START:', invoiceId);

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;

    // 2. Fetch invoice with relations
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*),
        payments:invoice_payments(*),
        patient:patients(id, first_name, last_name, email, phone),
        created_by_user:custom_users!invoices_created_by_fkey(first_name, last_name)
      `)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !invoice) {
      console.error('[GET /api/invoices/[invoiceId]] Not found:', error);
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice: invoice as InvoiceWithRelations });

  } catch (error) {
    console.error('[GET /api/invoices/[invoiceId]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Update Invoice
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  console.log('[PATCH /api/invoices/[invoiceId]] START:', invoiceId);

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
    const parseResult = UpdateInvoiceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const adminClient = await createAdminClient();

    // 4. Get current invoice
    const { data: currentInvoice, error: fetchError } = await adminClient
      .from('invoices')
      .select('status, total')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !currentInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 5. Validate status transitions
    if (data.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ['pending', 'cancelled'],
        pending: ['paid', 'partial', 'overdue', 'cancelled'],
        partial: ['paid', 'overdue', 'cancelled'],
        overdue: ['paid', 'partial', 'cancelled'],
        paid: ['refunded'],
        cancelled: [],
        refunded: [],
      };

      const allowed = validTransitions[currentInvoice.status] || [];
      if (!allowed.includes(data.status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentInvoice.status} to ${data.status}` },
          { status: 400 }
        );
      }
    }

    // 6. Prepare update data
    const updateData: Record<string, unknown> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.due_date !== undefined) updateData.due_date = data.due_date;
    if (data.discount_amount !== undefined) {
      updateData.discount_amount = data.discount_amount;
      // Recalculate total
      updateData.total = currentInvoice.total - data.discount_amount;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.internal_notes !== undefined) updateData.internal_notes = data.internal_notes;
    if (data.customer_name !== undefined) updateData.customer_name = data.customer_name;
    if (data.customer_email !== undefined) updateData.customer_email = data.customer_email;
    if (data.customer_phone !== undefined) updateData.customer_phone = data.customer_phone;
    if (data.customer_document_type !== undefined) updateData.customer_document_type = data.customer_document_type;
    if (data.customer_document_number !== undefined) updateData.customer_document_number = data.customer_document_number;
    if (data.customer_address !== undefined) updateData.customer_address = data.customer_address;

    // 7. Update invoice
    const { data: updatedInvoice, error: updateError } = await adminClient
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .select(`
        *,
        items:invoice_items(*),
        payments:invoice_payments(*)
      `)
      .single();

    if (updateError) {
      console.error('[PATCH /api/invoices/[invoiceId]] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    console.log('[PATCH /api/invoices/[invoiceId]] SUCCESS');
    return NextResponse.json({
      invoice: updatedInvoice as InvoiceWithRelations,
      message: 'Invoice updated successfully',
    });

  } catch (error) {
    console.error('[PATCH /api/invoices/[invoiceId]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Delete Draft Invoice
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  const { invoiceId } = await params;
  console.log('[DELETE /api/invoices/[invoiceId]] START:', invoiceId);

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;

    // 2. Check role (only admin can delete)
    const allowedRoles = ['admin_tenant', 'super_admin'];
    if (!allowedRoles.includes(user.profile.role)) {
      return NextResponse.json({ error: 'Only administrators can delete invoices' }, { status: 403 });
    }

    const adminClient = await createAdminClient();

    // 3. Get invoice and check status
    const { data: invoice, error: fetchError } = await adminClient
      .from('invoices')
      .select('status')
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // 4. Only allow deleting drafts
    if (invoice.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft invoices can be deleted' },
        { status: 400 }
      );
    }

    // 5. Delete invoice (items will cascade)
    const { error: deleteError } = await adminClient
      .from('invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('[DELETE /api/invoices/[invoiceId]] Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }

    console.log('[DELETE /api/invoices/[invoiceId]] SUCCESS');
    return NextResponse.json({ message: 'Invoice deleted successfully' });

  } catch (error) {
    console.error('[DELETE /api/invoices/[invoiceId]] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
