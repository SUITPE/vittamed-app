/**
 * API Route: GET /api/features/plan
 *
 * Obtiene información del plan actual del tenant del usuario.
 *
 * Response:
 * {
 *   plan_key: 'free' | 'care' | 'pro' | 'enterprise',
 *   status: 'active' | 'inactive' | 'trial' | 'expired',
 *   features: Record<FeatureKey, boolean | number | null>
 * }
 */

import { NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // 1. Obtener usuario autenticado
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 2. Obtener tenant_id del usuario
    const { data: profile } = await supabase
      .from('custom_users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'Tenant not found', code: 'TENANT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // 3. Obtener plan del tenant
    const planInfo = await FeatureGate.getTenantPlan(profile.tenant_id);

    return NextResponse.json(planInfo);
  } catch (error) {
    console.error('[/api/features/plan] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
