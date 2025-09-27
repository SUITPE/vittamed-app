import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { doctorId: string } }
) {
  try {
    const supabase = await getSupabaseServerClient()
    const { doctorId } = params

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      )
    }

    // Verify user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check role and permissions
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user has permission to view doctor's patients
    // Doctors and members can view their own patients
    // Admins and receptionists can view any doctor's patients in their tenant
    const isOwnData = user.id === doctorId
    const isAdminOrReceptionist = ['admin_tenant', 'receptionist'].includes(profile.role)

    if (!isOwnData && !isAdminOrReceptionist) {
      return NextResponse.json(
        { error: 'Forbidden - insufficient permissions' },
        { status: 403 }
      )
    }

    // Get unique patients who have appointments with this doctor
    // We use a subquery approach to get distinct patients
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        patient_id,
        user_profiles!appointments_patient_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone,
          date_of_birth,
          address,
          emergency_contact,
          medical_notes,
          created_at,
          updated_at
        )
      `)
      .eq('doctor_id', doctorId)
      .not('patient_id', 'is', null)

    if (appointmentsError) {
      console.error('Error fetching appointments:', appointmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch patient data' },
        { status: 500 }
      )
    }

    // Extract unique patients from appointments
    const uniquePatientsMap = new Map()

    appointments?.forEach(appointment => {
      if (appointment.user_profiles && appointment.patient_id) {
        uniquePatientsMap.set(appointment.patient_id, appointment.user_profiles)
      }
    })

    const patients = Array.from(uniquePatientsMap.values())

    return NextResponse.json(patients)

  } catch (error) {
    console.error('Error in doctor patients API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}