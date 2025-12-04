/**
 * Types for Invoice/Billing System
 * Ticket: VT-287 - Facturacion: Modelo de datos y API basica
 */

// ============================================================================
// ENUMS
// ============================================================================

export type InvoiceStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'cancelled'
  | 'refunded';

export type InvoiceType =
  | 'invoice'
  | 'receipt'
  | 'credit_note'
  | 'debit_note'
  | 'proforma';

export type PaymentMethod =
  | 'cash'
  | 'card'
  | 'transfer'
  | 'yape'
  | 'plin'
  | 'culqi'
  | 'stripe'
  | 'other';

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Invoice header record
 */
export interface Invoice {
  id: string;
  tenant_id: string;
  patient_id: string | null;

  // Identification
  invoice_number: string;
  invoice_type: InvoiceType;
  status: InvoiceStatus;

  // Dates
  issue_date: string; // YYYY-MM-DD
  due_date: string | null;
  paid_date: string | null;

  // Amounts
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  paid_amount: number;
  balance: number; // Computed: total - paid_amount

  // Currency
  currency: string;

  // Payment
  payment_method: PaymentMethod | null;
  payment_reference: string | null;

  // Related appointment
  appointment_id: string | null;

  // Customer info (denormalized)
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  customer_document_type: string | null;
  customer_document_number: string | null;
  customer_address: string | null;

  // Notes
  notes: string | null;
  internal_notes: string | null;

  // Audit
  created_by: string | null;
  updated_by: string | null;
  voided_by: string | null;
  voided_at: string | null;
  void_reason: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Invoice line item
 */
export interface InvoiceItem {
  id: string;
  invoice_id: string;

  // Item details
  item_type: 'service' | 'product' | 'other';
  description: string;

  // References
  service_id: string | null;
  product_id: string | null;

  // Pricing
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_included: boolean;

  // Totals
  subtotal: number;
  tax_amount: number;
  total: number;

  // Sort
  sort_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Invoice payment record
 */
export interface InvoicePayment {
  id: string;
  invoice_id: string;

  // Payment
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  reference: string | null;

  // Provider
  provider: string | null;
  provider_transaction_id: string | null;

  // Notes
  notes: string | null;

  // Audit
  received_by: string | null;

  // Timestamps
  created_at: string;
}

/**
 * Invoice with related data
 */
export interface InvoiceWithRelations extends Invoice {
  items?: InvoiceItem[];
  payments?: InvoicePayment[];
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  appointment?: {
    id: string;
    appointment_date: string;
    start_time: string;
    service_name: string;
  };
  created_by_user?: {
    first_name: string;
    last_name: string;
  };
}

// ============================================================================
// INTERNAL DATA TYPES (for invoice-generator)
// ============================================================================

/**
 * Internal type for creating invoices (used by invoice-generator - VT-288)
 */
export interface CreateInvoiceData {
  tenant_id: string;
  patient_id: string;
  appointment_id: string | null;
  invoice_number: string;
  invoice_type: InvoiceType;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total: number;
  status: InvoiceStatus;
  payment_method: PaymentMethod;
  payment_reference: string | null;
  notes: string | null;
  items: CreateInvoiceItemData[];
}

/**
 * Internal type for invoice items (used by invoice-generator - VT-288)
 */
export interface CreateInvoiceItemData {
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Request to create an invoice
 */
export interface CreateInvoiceRequest {
  // Required
  invoice_type?: InvoiceType;
  issue_date?: string;

  // Patient (optional for walk-ins)
  patient_id?: string;

  // Customer info (if no patient_id)
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document_type?: string;
  customer_document_number?: string;
  customer_address?: string;

  // Optional
  due_date?: string;
  discount_amount?: number;
  tax_rate?: number;
  currency?: string;
  notes?: string;
  internal_notes?: string;

  // Related appointment
  appointment_id?: string;

  // Items
  items: CreateInvoiceItemRequest[];
}

/**
 * Request to create an invoice item
 */
export interface CreateInvoiceItemRequest {
  description: string;
  quantity: number;
  unit_price: number;
  item_type?: 'service' | 'product' | 'other';
  service_id?: string;
  product_id?: string;
  discount_percent?: number;
  tax_included?: boolean;
}

/**
 * Request to update an invoice
 */
export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  due_date?: string;
  discount_amount?: number;
  notes?: string;
  internal_notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_document_type?: string;
  customer_document_number?: string;
  customer_address?: string;
}

/**
 * Request to record a payment
 */
export interface RecordPaymentRequest {
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  reference?: string;
  notes?: string;
}

/**
 * Request to void an invoice
 */
export interface VoidInvoiceRequest {
  reason: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response for creating an invoice
 */
export interface CreateInvoiceResponse {
  invoice: InvoiceWithRelations;
  message: string;
}

/**
 * Response for listing invoices
 */
export interface ListInvoicesResponse {
  invoices: InvoiceWithRelations[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  summary?: {
    total_invoiced: number;
    total_paid: number;
    total_pending: number;
    total_overdue: number;
  };
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Filters for listing invoices
 */
export interface InvoiceFilters {
  patient_id?: string;
  status?: InvoiceStatus | InvoiceStatus[];
  invoice_type?: InvoiceType | InvoiceType[];
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string; // Search by invoice_number, customer_name
  include_items?: boolean;
  include_payments?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'issue_date' | 'due_date' | 'total' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get display label for invoice status
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  const labels: Record<InvoiceStatus, string> = {
    draft: 'Borrador',
    pending: 'Pendiente',
    paid: 'Pagada',
    partial: 'Pago Parcial',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
    refunded: 'Reembolsada',
  };
  return labels[status];
}

/**
 * Get display label for invoice type
 */
export function getInvoiceTypeLabel(type: InvoiceType): string {
  const labels: Record<InvoiceType, string> = {
    invoice: 'Factura',
    receipt: 'Boleta',
    credit_note: 'Nota de Credito',
    debit_note: 'Nota de Debito',
    proforma: 'Proforma',
  };
  return labels[type];
}

/**
 * Get display label for payment method
 */
export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
    yape: 'Yape',
    plin: 'Plin',
    culqi: 'Culqi',
    stripe: 'Stripe',
    other: 'Otro',
  };
  return labels[method];
}

/**
 * Get status color for UI
 */
export function getInvoiceStatusColor(status: InvoiceStatus): string {
  const colors: Record<InvoiceStatus, string> = {
    draft: 'gray',
    pending: 'yellow',
    paid: 'green',
    partial: 'blue',
    overdue: 'red',
    cancelled: 'gray',
    refunded: 'purple',
  };
  return colors[status];
}

/**
 * Calculate item totals
 */
export function calculateItemTotals(
  quantity: number,
  unitPrice: number,
  discountPercent: number = 0,
  taxRate: number = 18,
  taxIncluded: boolean = true
): { subtotal: number; taxAmount: number; total: number; discountAmount: number } {
  const grossAmount = quantity * unitPrice;
  const discountAmount = grossAmount * (discountPercent / 100);
  const afterDiscount = grossAmount - discountAmount;

  let subtotal: number;
  let taxAmount: number;
  let total: number;

  if (taxIncluded) {
    // Price includes tax, extract it
    subtotal = afterDiscount / (1 + taxRate / 100);
    taxAmount = afterDiscount - subtotal;
    total = afterDiscount;
  } else {
    // Price doesn't include tax, add it
    subtotal = afterDiscount;
    taxAmount = subtotal * (taxRate / 100);
    total = subtotal + taxAmount;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
  };
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency: string = 'PEN'): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Check if invoice can be edited
 */
export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

/**
 * Check if invoice can receive payments
 */
export function canReceivePayment(status: InvoiceStatus): boolean {
  return ['pending', 'partial', 'overdue'].includes(status);
}

/**
 * Check if invoice can be voided
 */
export function canVoidInvoice(status: InvoiceStatus): boolean {
  return ['draft', 'pending', 'partial'].includes(status);
}
