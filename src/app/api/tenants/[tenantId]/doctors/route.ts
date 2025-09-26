import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params
  try {
    const supabase = await createClient()

    const { data: doctorTenants, error } = await supabase
      .from('doctor_tenants')
      .select(`
        id,
        doctor_id,
        doctors (
          id,
          first_name,
          last_name,
          specialty
        )
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching doctors:', error)
      return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 })
    }

    // Transform the data to flatten the doctor information
    const doctors = doctorTenants?.map((dt: any) => ({
      id: dt.doctors?.id,
      first_name: dt.doctors?.first_name,
      last_name: dt.doctors?.last_name,
      specialty: dt.doctors?.specialty,
      doctor_tenant_id: dt.id
    })) || []

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}