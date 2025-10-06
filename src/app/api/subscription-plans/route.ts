import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/subscription-plans - Get all subscription plans with their features
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get all active subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })

    if (plansError) {
      console.error('Error fetching subscription plans:', plansError)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    // Get all plan features
    const { data: planFeatures, error: featuresError } = await supabase
      .from('plan_features')
      .select(`
        plan_key,
        is_included,
        feature_key,
        feature_flags (
          feature_key,
          feature_name,
          description,
          category,
          is_premium
        )
      `)

    if (featuresError) {
      console.error('Error fetching plan features:', featuresError)
      return NextResponse.json({ error: 'Failed to fetch plan features' }, { status: 500 })
    }

    // Group features by plan
    const plansWithFeatures = plans?.map(plan => {
      const features = planFeatures
        ?.filter(pf => pf.plan_key === plan.plan_key && pf.is_included)
        .map(pf => pf.feature_flags)
        .filter(Boolean) || []

      return {
        ...plan,
        features
      }
    })

    return NextResponse.json({ plans: plansWithFeatures })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
