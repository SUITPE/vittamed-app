import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import {
  createCharge,
  getPlanPriceInCents,
  isChargeSuccessful,
  getCardInfoFromCharge,
  formatAmountToSoles,
} from '@/lib/culqi-server';
import { z } from 'zod';

/**
 * API Route: POST /api/culqi/create-charge
 *
 * Procesa un pago con Culqi y actualiza la suscripción del tenant
 *
 * Input:
 *  - token_id: Token generado por Culqi.js (string)
 *  - plan_key: Clave del plan (free, care, pro, enterprise)
 *  - tenant_id: ID del tenant (opcional, se obtiene del usuario autenticado)
 *  - email: Email del usuario
 *
 * Output:
 *  - success: boolean
 *  - charge_id: ID del cargo en Culqi
 *  - tenant: Datos del tenant actualizado
 */

// Schema de validación con Zod
const CreateChargeSchema = z.object({
  token_id: z.string().min(1, 'Token de Culqi requerido'),
  plan_key: z.enum(['free', 'care', 'pro', 'enterprise'] as const, {
    message: 'Plan inválido',
  }),
  tenant_id: z.string().uuid().optional(),
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json();

    const validation = CreateChargeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token_id, plan_key, tenant_id, email } = validation.data;

    console.log('💳 Procesando pago para plan:', plan_key);

    // 2. Verificar autenticación
    const supabase = await createClient();
    const user = await customAuth.getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Autenticación requerida' },
        { status: 401 }
      );
    }

    // 3. Obtener tenant_id del usuario si no se proporcionó
    const finalTenantId = tenant_id || user.profile?.tenant_id;

    if (!finalTenantId) {
      return NextResponse.json(
        { error: 'No se pudo determinar el tenant. Crea uno primero.' },
        { status: 400 }
      );
    }

    // 4. Validar que el tenant existe
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', finalTenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('❌ Tenant no encontrado:', tenantError);
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      );
    }

    // 5. Calcular monto según el plan
    const amount = getPlanPriceInCents(plan_key);

    // Si es plan free, no procesar pago
    if (plan_key === 'free') {
      // Actualizar tenant a plan free (sin cargo)
      const { data: updatedTenant, error: updateError } = await supabase
        .from('tenants')
        .update({
          subscription_plan_key: 'free',
          subscription_status: 'active',
          subscription_starts_at: new Date().toISOString(),
          subscription_ends_at: null,
        })
        .eq('id', finalTenantId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error al actualizar tenant:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar suscripción' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Plan Free activado correctamente',
        tenant: updatedTenant,
      });
    }

    // 6. Crear cargo en Culqi (planes pagados)
    console.log('💰 Monto a cobrar:', formatAmountToSoles(amount));

    const charge = await createCharge({
      tokenId: token_id,
      amount,
      email,
      description: `Plan ${plan_key.toUpperCase()} - VittaSami`,
      metadata: {
        tenant_id: finalTenantId,
        plan_key,
        user_email: email,
      },
    });

    // 7. Verificar que el cargo fue exitoso
    if (!isChargeSuccessful(charge)) {
      console.error('❌ Cargo no exitoso:', charge);
      return NextResponse.json(
        {
          error: 'El pago no se procesó correctamente',
          details: charge.outcome,
        },
        { status: 400 }
      );
    }

    // 8. Extraer información de la tarjeta
    const cardInfo = getCardInfoFromCharge(charge);

    // 9. Actualizar tenant con la suscripción
    const now = new Date().toISOString();
    const subscriptionEndsAt = new Date();
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30); // 30 días

    const { data: updatedTenant, error: updateError } = await supabase
      .from('tenants')
      .update({
        subscription_plan_key: plan_key,
        subscription_status: 'active',
        subscription_starts_at: now,
        subscription_ends_at: subscriptionEndsAt.toISOString(),
        culqi_charge_id: charge.id,
        payment_method: cardInfo?.brand || 'unknown',
        last_payment_date: now,
      })
      .eq('id', finalTenantId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error al actualizar tenant:', updateError);
      // El pago se procesó pero no se pudo actualizar el tenant
      return NextResponse.json(
        {
          error: 'Pago procesado pero error al actualizar suscripción. Contacta soporte.',
          charge_id: charge.id,
        },
        { status: 500 }
      );
    }

    console.log('✅ Suscripción activada correctamente');

    // 10. Retornar éxito
    return NextResponse.json({
      success: true,
      message: `Plan ${plan_key.toUpperCase()} activado correctamente`,
      charge_id: charge.id,
      amount: formatAmountToSoles(amount),
      card: cardInfo,
      tenant: updatedTenant,
    });

  } catch (error: any) {
    console.error('❌ Error en /api/culqi/create-charge:', error);

    return NextResponse.json(
      {
        error: error.message || 'Error al procesar el pago',
      },
      { status: 500 }
    );
  }
}
