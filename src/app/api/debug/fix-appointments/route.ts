import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(_request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // IDs from the logs
    const appointmentIds = [
      '17736f25-2405-47a5-a82a-2fbcafdc9c14',
      '28dacfc1-de2b-4a8b-b149-756d3aa923cf'
    ]

    console.log(`Fixing appointments: ${appointmentIds.join(', ')}`)

    // 2. Get a patient from the patients table for this tenant
    const { data: patients, error: patientsError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email')
      .eq('tenant_id', '33bfa2ef-c9c2-4eaa-8178-eed6d6df8d9e')
      .limit(1)

    if (patientsError || !patients || patients.length === 0) {
      return NextResponse.json({
        error: 'No patients found in the patients table for this tenant',
        details: patientsError?.message
      }, { status: 404 })
    }

    const patient = patients[0]
    console.log(`Using patient: ${patient.email} (${patient.id})`)

    // 3. Update all appointments to use this patient
    const updates = []
    for (const appointmentId of appointmentIds) {
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ patient_id: patient.id })
        .eq('id', appointmentId)

      if (updateError) {
        console.error(`Error updating appointment ${appointmentId}:`, updateError)
      } else {
        updates.push(appointmentId)
        console.log(`✅ Updated appointment ${appointmentId}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} appointments`,
      patient: {
        id: patient.id,
        name: `${patient.first_name} ${patient.last_name}`,
        email: patient.email
      },
      updatedAppointments: updates
    })

  } catch (error: any) {
    console.error('Error fixing appointments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
