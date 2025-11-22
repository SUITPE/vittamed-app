/**
 * API Route: POST /api/features/check
 *
 * Verifica si el tenant tiene acceso a una feature específica
 * Usado por el hook useFeature() en el frontend
 *
 * Body:
 * {
 *   "feature": "medical_records"
 * }
 *
 * Response:
 * {
 *   "has_access": true,
 *   "required_plan": "care"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { FeatureKey } from '@/constants/pricing';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
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

    // 3. Parsear body
    const body = await request.json();
    const feature = body.feature as FeatureKey;

    if (!feature) {
      return NextResponse.json(
        { error: 'Missing feature parameter' },
        { status: 400 }
      );
    }

    // 4. Verificar acceso a la feature
    const hasAccess = await FeatureGate.hasFeature(tenantId, feature);
    const requiredPlan = FeatureGate.getRequiredPlan(feature);

    return NextResponse.json({
      has_access: hasAccess,
      required_plan: requiredPlan,
      feature,
    });
  } catch (error: any) {
    console.error('[API /features/check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
