/**
 * API Route: GET /api/features/list
 *
 * Obtiene todas las features disponibles para el tenant actual
 * Usado por el hook useTenantFeatures() en el frontend
 *
 * Response:
 * {
 *   "plan_key": "care",
 *   "status": "active",
 *   "features": {
 *     "medical_records": true,
 *     "ai_suggestions": false,
 *     ...
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    // 1. Obtener tenant_id del usuario autenticado
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Obtener tenant_id del perfil
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'No tenant found for user' },
        { status: 404 }
      );
    }

    const tenantId = profile.tenant_id;

    // 3. Obtener plan y features del tenant
    const planInfo = await FeatureGate.getTenantPlan(tenantId);

    return NextResponse.json(planInfo);
  } catch (error: any) {
    console.error('[API /features/list] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
