/**
 * API Route: GET /api/features/check
 *
 * Verifica si el tenant del usuario tiene acceso a una o más features.
 *
 * Query params:
 * - feature: Single feature to check (ej: ?feature=medical_records)
 * - features: Comma-separated features (ej: ?features=medical_records,ai_suggestions)
 *
 * Response:
 * - Single feature: { hasFeature: boolean, requiredPlan?: string }
 * - Multiple features: { features: Record<string, boolean> }
 */

import { NextRequest, NextResponse } from 'next/server';
import { FeatureGate } from '@/lib/feature-gating';
import { FeatureKey } from '@/constants/pricing';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
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

    const tenantId = profile.tenant_id;

    // 3. Parsear query params
    const url = new URL(request.url);
    const singleFeature = url.searchParams.get('feature') as FeatureKey | null;
    const multipleFeatures = url.searchParams.get('features');

    // 4a. Single feature check
    if (singleFeature) {
      const hasFeature = await FeatureGate.hasFeature(tenantId, singleFeature);
      const requiredPlan = hasFeature ? null : FeatureGate.getRequiredPlan(singleFeature);

      return NextResponse.json({
        hasFeature,
        feature: singleFeature,
        requiredPlan,
      });
    }

    // 4b. Multiple features check
    if (multipleFeatures) {
      const featureList = multipleFeatures.split(',') as FeatureKey[];
      const results: Record<string, boolean> = {};

      for (const feature of featureList) {
        results[feature] = await FeatureGate.hasFeature(tenantId, feature);
      }

      return NextResponse.json({ features: results });
    }

    // 4c. No feature specified - return all features
    const allFeatures = await FeatureGate.getTenantFeatures(tenantId);
    return NextResponse.json({ features: allFeatures });
  } catch (error) {
    console.error('[/api/features/check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
