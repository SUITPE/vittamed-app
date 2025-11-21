import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-server';

/**
 * API Route: POST /api/culqi/webhook
 *
 * Webhook de Culqi para recibir eventos de pagos
 *
 * Eventos soportados:
 * - charge.succeeded: Cargo exitoso
 * - charge.failed: Cargo fallido
 * - charge.refunded: Reembolso procesado
 *
 * Configuración en Culqi:
 * URL: https://app.vittasami.lat/api/culqi/webhook
 * Eventos: charge.succeeded, charge.failed, charge.refunded
 *
 * SEGURIDAD: Verifica firma HMAC-SHA256 en cada request (TASK-BE-004)
 * PROCESAMIENTO: Actualiza suscripciones automáticamente (TASK-BE-005)
 */

const CULQI_WEBHOOK_SECRET = process.env.CULQI_WEBHOOK_SECRET;

type CulqiWebhookEvent =
  | 'charge.succeeded'
  | 'charge.failed'
  | 'charge.refunded'
  | 'charge.captured'
  | 'charge.expired';

interface CulqiCharge {
  id: string;
  object: string;
  amount: number;
  currency_code: string;
  email: string;
  description: string;
  outcome?: {
    type: string;
    merchant_message: string;
    user_message: string;
  };
  metadata?: {
    tenant_id?: string;
    plan_key?: string;
    billing_cycle?: 'monthly' | 'annual';
    user_email?: string;
    [key: string]: any;
  };
}

interface WebhookPayload {
  id: string;
  object: string;
  type: CulqiWebhookEvent;
  creation_date: number;
  data: CulqiCharge;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Leer el body como texto (necesario para verificar firma)
    const rawBody = await request.text();
    const body: WebhookPayload = JSON.parse(rawBody);

    // 2. Obtener firma del header
    const signature = request.headers.get('x-culqi-signature');

    if (!signature) {
      console.error('[Webhook] Missing signature header');
      await logWebhookAttempt({
        event_type: body.type || 'unknown',
        status: 'signature_missing',
        payload: body,
        signature_header: null,
      });
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // 3. Verificar firma HMAC-SHA256 (TASK-BE-004)
    if (!CULQI_WEBHOOK_SECRET) {
      console.error('[Webhook] CULQI_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', CULQI_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('[Webhook] Invalid signature', {
        received: signature.substring(0, 10) + '...',
        expected: expectedSignature.substring(0, 10) + '...',
      });

      // Loguear intento fallido
      await logWebhookAttempt({
        event_type: body.type || 'unknown',
        status: 'signature_failed',
        payload: body,
        signature_header: signature,
      });

      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('[Webhook] Valid signature, processing event:', body.type);

    // 4. Verificar idempotencia (TASK-BE-005)
    if (await isEventProcessed(body.id)) {
      console.log('[Webhook] Event already processed, skipping:', body.id);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // 5. Loguear webhook recibido (firma válida)
    await logWebhookAttempt({
      event_type: body.type,
      status: 'received',
      payload: body,
      signature_header: signature,
    });

    // 6. Procesar evento según tipo (TASK-BE-005)
    const eventType = body.type as CulqiWebhookEvent;
    const chargeData = body.data;

    console.log(`[Webhook] Processing event: ${eventType}`, chargeData.id);

    switch (eventType) {
      case 'charge.succeeded':
        await handleChargeSucceeded(chargeData);
        break;

      case 'charge.failed':
        await handleChargeFailed(chargeData);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(chargeData);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${eventType}`);
    }

    // 7. Actualizar log de webhook a 'processed'
    await updateWebhookLog(body.id, 'processed');

    return NextResponse.json({ received: true, status: 'processed' });
  } catch (error: any) {
    console.error('[Webhook] Processing error:', error);

    // Importante: responder con 200 para que Culqi no reintente indefinidamente
    return NextResponse.json(
      {
        received: true,
        error: error.message,
      },
      { status: 200 }
    );
  }
}

// ============================================
// Handlers de Eventos (TASK-BE-005)
// ============================================

async function handleChargeSucceeded(charge: CulqiCharge) {
  const supabase = await createAdminClient();

  // 1. Extraer metadata del cargo
  const tenantId = charge.metadata?.tenant_id;
  const planKey = charge.metadata?.plan_key; // 'care', 'pro', 'enterprise'
  const billingCycle = charge.metadata?.billing_cycle; // 'monthly', 'annual'

  if (!tenantId || !planKey) {
    throw new Error('Missing tenant_id or plan_key in charge metadata');
  }

  // 2. Calcular fechas de suscripción
  const startDate = new Date();
  const endDate = new Date();

  if (billingCycle === 'annual') {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  // 3. Actualizar tenant
  const { data: tenant, error: updateError } = await supabase
    .from('tenants')
    .update({
      subscription_plan_key: planKey,
      subscription_status: 'active',
      subscription_starts_at: startDate.toISOString(),
      subscription_ends_at: endDate.toISOString(),
      billing_cycle: billingCycle,
      last_payment_date: new Date().toISOString(),
      last_payment_amount: charge.amount / 100, // Culqi usa centavos
    })
    .eq('id', tenantId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update tenant: ${updateError.message}`);
  }

  // 4. Registrar transacción
  await supabase.from('payment_transactions').insert({
    tenant_id: tenantId,
    provider: 'culqi',
    provider_charge_id: charge.id,
    amount: charge.amount / 100,
    currency: charge.currency_code,
    status: 'succeeded',
    plan_key: planKey,
    billing_cycle: billingCycle,
    metadata: charge.metadata,
    created_at: new Date().toISOString(),
  });

  // 5. TODO: Enviar email de confirmación
  console.log(`[Webhook] Subscription activated for tenant ${tenantId}, plan: ${planKey}`);
}

async function handleChargeFailed(charge: CulqiCharge) {
  const supabase = await createAdminClient();

  const tenantId = charge.metadata?.tenant_id;

  if (!tenantId) {
    throw new Error('Missing tenant_id in charge metadata');
  }

  // 1. Actualizar tenant a payment_failed
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'payment_failed',
      last_payment_error: charge.outcome?.user_message || 'Payment failed',
      last_payment_attempt: new Date().toISOString(),
    })
    .eq('id', tenantId);

  // 2. Registrar transacción fallida
  await supabase.from('payment_transactions').insert({
    tenant_id: tenantId,
    provider: 'culqi',
    provider_charge_id: charge.id,
    amount: charge.amount / 100,
    currency: charge.currency_code,
    status: 'failed',
    error_message: charge.outcome?.user_message,
    metadata: charge.metadata,
    created_at: new Date().toISOString(),
  });

  // 3. TODO: Enviar email de notificación de pago fallido
  console.log(`[Webhook] Payment failed for tenant ${tenantId}`);
}

async function handleChargeRefunded(charge: CulqiCharge) {
  const supabase = await createAdminClient();

  const tenantId = charge.metadata?.tenant_id;

  if (!tenantId) {
    throw new Error('Missing tenant_id in charge metadata');
  }

  // 1. Cancelar suscripción
  await supabase
    .from('tenants')
    .update({
      subscription_status: 'cancelled',
      subscription_ends_at: new Date().toISOString(), // Cancelar inmediatamente
      cancellation_reason: 'refunded',
    })
    .eq('id', tenantId);

  // 2. Registrar transacción de reembolso
  await supabase.from('payment_transactions').insert({
    tenant_id: tenantId,
    provider: 'culqi',
    provider_charge_id: charge.id,
    amount: -(charge.amount / 100), // Negativo para reembolso
    currency: charge.currency_code,
    status: 'refunded',
    metadata: charge.metadata,
    created_at: new Date().toISOString(),
  });

  // 3. TODO: Enviar email de confirmación de reembolso
  console.log(`[Webhook] Refund processed for tenant ${tenantId}`);
}

// ============================================
// Helpers (TASK-BE-004)
// ============================================

async function logWebhookAttempt(data: {
  event_type: string;
  status: string;
  payload: any;
  signature_header: string | null;
}) {
  try {
    const supabase = await createAdminClient();

    await supabase.from('webhook_logs').insert({
      provider: 'culqi',
      event_type: data.event_type,
      status: data.status,
      payload: data.payload,
      signature_header: data.signature_header,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Webhook] Error logging webhook attempt:', error);
    // No lanzar error para no afectar el procesamiento
  }
}

async function updateWebhookLog(eventId: string, status: string, error?: string) {
  try {
    const supabase = await createAdminClient();

    await supabase
      .from('webhook_logs')
      .update({
        status,
        processing_error: error || null,
        processed_at: new Date().toISOString(),
      })
      .eq('payload->>id', eventId)
      .eq('provider', 'culqi');
  } catch (err) {
    console.error('[Webhook] Error updating webhook log:', err);
  }
}

async function isEventProcessed(culqiEventId: string): Promise<boolean> {
  try {
    const supabase = await createAdminClient();

    const { data } = await supabase
      .from('webhook_logs')
      .select('id')
      .eq('provider', 'culqi')
      .eq('payload->>id', culqiEventId)
      .eq('status', 'processed')
      .single();

    return !!data;
  } catch (error) {
    return false;
  }
}

/**
 * Método GET para verificar que el webhook está activo
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Culqi Webhook (VittaSami)',
    version: '2.0',
    features: ['signature_verification', 'idempotency', 'event_processing'],
    endpoints: {
      webhook: '/api/culqi/webhook',
    },
  });
}
