/**
 * API Route: /api/invoices
 * Ticket: VT-287 - Facturacion: Modelo de datos y API basica
 *
 * POST - Create a new invoice
 * GET - List invoices with filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import type {
  CreateInvoiceResponse,
  ListInvoicesResponse,
  InvoiceWithRelations,
} from '@/types/invoice';
import { calculateItemTotals } from '@/types/invoice';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateInvoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  item_type: z.enum(['service', 'product', 'other']).optional().default('service'),
  service_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  discount_percent: z.number().min(0).max(100).optional().default(0),
  tax_included: z.boolean().optional().default(true),
});

const CreateInvoiceSchema = z.object({
  invoice_type: z.enum(['invoice', 'receipt', 'credit_note', 'debit_note', 'proforma']).optional().default('invoice'),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  patient_id: z.string().uuid().optional(),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  customer_document_type: z.string().optional(),
  customer_document_number: z.string().optional(),
  customer_address: z.string().optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  discount_amount: z.number().min(0).optional().default(0),
  tax_rate: z.number().min(0).max(100).optional().default(18),
  currency: z.string().optional().default('PEN'),
  notes: z.string().optional(),
  internal_notes: z.string().optional(),
  appointment_id: z.string().uuid().optional(),
  items: z.array(CreateInvoiceItemSchema).min(1),
});

// ============================================================================
// POST - Create Invoice
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[POST /api/invoices] START');

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // 2. Check role
    const allowedRoles = ['admin_tenant', 'staff', 'receptionist', 'super_admin'];
    if (!allowedRoles.includes(user.profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 3. Parse and validate
    const body = await request.json();
    const parseResult = CreateInvoiceSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const data = parseResult.data;
    const adminClient = await createAdminClient();

    // 4. Generate invoice number
    const { data: invoiceNumber, error: seqError } = await adminClient
      .rpc('generate_invoice_number', {
        p_tenant_id: tenantId,
        p_invoice_type: data.invoice_type,
      });

    if (seqError) {
      console.error('[POST /api/invoices] Sequence error:', seqError);
      return NextResponse.json({ error: 'Failed to generate invoice number' }, { status: 500 });
    }

    // 5. Get patient info if patient_id provided
    let customerInfo = {
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_document_type: data.customer_document_type,
      customer_document_number: data.customer_document_number,
      customer_address: data.customer_address,
    };

    if (data.patient_id) {
      const { data: patient } = await adminClient
        .from('patients')
        .select('first_name, last_name, email, phone, document_type, document_number, address')
        .eq('id', data.patient_id)
        .single();

      if (patient) {
        customerInfo = {
          customer_name: customerInfo.customer_name || `${patient.first_name} ${patient.last_name}`,
          customer_email: customerInfo.customer_email || patient.email,
          customer_phone: customerInfo.customer_phone || patient.phone,
          customer_document_type: customerInfo.customer_document_type || patient.document_type,
          customer_document_number: customerInfo.customer_document_number || patient.document_number,
          customer_address: customerInfo.customer_address || patient.address,
        };
      }
    }

    // 6. Calculate item totals
    const processedItems = data.items.map((item, index) => {
      const totals = calculateItemTotals(
        item.quantity,
        item.unit_price,
        item.discount_percent || 0,
        data.tax_rate,
        item.tax_included !== false
      );

      return {
        item_type: item.item_type,
        description: item.description,
        service_id: item.service_id || null,
        product_id: item.product_id || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
        discount_amount: totals.discountAmount,
        tax_included: item.tax_included !== false,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total: totals.total,
        sort_order: index,
      };
    });

    // 7. Calculate invoice totals
    const subtotal = processedItems.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = processedItems.reduce((sum, item) => sum + item.tax_amount, 0);
    const itemsTotal = processedItems.reduce((sum, item) => sum + item.total, 0);
    const total = itemsTotal - (data.discount_amount || 0);

    // 8. Create invoice
    const { data: invoice, error: invoiceError } = await adminClient
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        patient_id: data.patient_id || null,
        invoice_number: invoiceNumber,
        invoice_type: data.invoice_type,
        status: 'draft',
        issue_date: data.issue_date || new Date().toISOString().split('T')[0],
        due_date: data.due_date || null,
        subtotal,
        tax_rate: data.tax_rate,
        tax_amount: taxAmount,
        discount_amount: data.discount_amount || 0,
        total,
        paid_amount: 0,
        currency: data.currency,
        appointment_id: data.appointment_id || null,
        ...customerInfo,
        notes: data.notes || null,
        internal_notes: data.internal_notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('[POST /api/invoices] Insert error:', invoiceError);
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }

    // 9. Create invoice items
    const itemsToInsert = processedItems.map(item => ({
      ...item,
      invoice_id: invoice.id,
    }));

    const { error: itemsError } = await adminClient
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('[POST /api/invoices] Items insert error:', itemsError);
      // Rollback invoice
      await adminClient.from('invoices').delete().eq('id', invoice.id);
      return NextResponse.json({ error: 'Failed to create invoice items' }, { status: 500 });
    }

    // 10. Fetch complete invoice with items
    const { data: completeInvoice } = await adminClient
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', invoice.id)
      .single();

    const response: CreateInvoiceResponse = {
      invoice: completeInvoice as InvoiceWithRelations,
      message: 'Invoice created successfully',
    };

    console.log('[POST /api/invoices] SUCCESS:', invoice.invoice_number);
    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('[POST /api/invoices] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ============================================================================
// GET - List Invoices
// ============================================================================

export async function GET(request: NextRequest) {
  console.log('[GET /api/invoices] START');

  try {
    // 1. Authenticate
    const user = await customAuth.getCurrentUser();
    if (!user || !user.profile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const tenantId = user.profile.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 400 });
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const patientId = searchParams.get('patient_id');
    const status = searchParams.get('status');
    const invoiceType = searchParams.get('invoice_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const search = searchParams.get('search');
    const includeItems = searchParams.get('include_items') === 'true';
    const sortBy = searchParams.get('sort_by') || 'issue_date';
    const sortOrder = searchParams.get('sort_order') || 'desc';

    // 3. Build query
    const supabase = await createClient();

    let selectQuery = `
      *,
      patient:patients(id, first_name, last_name, email, phone)
    `;

    if (includeItems) {
      selectQuery += `, items:invoice_items(*)`;
    }

    let query = supabase
      .from('invoices')
      .select(selectQuery, { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Apply filters
    if (patientId) {
      query = query.eq('patient_id', patientId);
    }
    if (status) {
      const statuses = status.split(',');
      query = query.in('status', statuses);
    }
    if (invoiceType) {
      const types = invoiceType.split(',');
      query = query.in('invoice_type', types);
    }
    if (dateFrom) {
      query = query.gte('issue_date', dateFrom);
    }
    if (dateTo) {
      query = query.lte('issue_date', dateTo);
    }
    if (search) {
      query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    const { data: invoices, count, error } = await query;

    if (error) {
      console.error('[GET /api/invoices] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }

    // 4. Calculate summary
    const { data: summary } = await supabase
      .from('invoices')
      .select('status, total, paid_amount')
      .eq('tenant_id', tenantId);

    let summaryStats = {
      total_invoiced: 0,
      total_paid: 0,
      total_pending: 0,
      total_overdue: 0,
    };

    if (summary) {
      summary.forEach(inv => {
        summaryStats.total_invoiced += inv.total || 0;
        summaryStats.total_paid += inv.paid_amount || 0;
        if (inv.status === 'pending' || inv.status === 'partial') {
          summaryStats.total_pending += (inv.total || 0) - (inv.paid_amount || 0);
        }
        if (inv.status === 'overdue') {
          summaryStats.total_overdue += (inv.total || 0) - (inv.paid_amount || 0);
        }
      });
    }

    const response: ListInvoicesResponse = {
      invoices: invoices as InvoiceWithRelations[],
      total: count || 0,
      page,
      limit,
      has_more: (count || 0) > offset + limit,
      summary: summaryStats,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('[GET /api/invoices] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
