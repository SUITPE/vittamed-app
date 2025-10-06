import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { customAuth } from '@/lib/custom-auth'

// GET /api/patients/:patientId/medical-records - Get all medical records for a patient
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params

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

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get patient to verify tenant access
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Check if user has access to this patient's tenant
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch medical records with relations
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select(`
        *,
        prescriptions (*),
        diagnoses (*),
        patient:patients (id, first_name, last_name, email, date_of_birth),
        doctor:user_profiles!medical_records_doctor_id_fkey (id, first_name, last_name, email)
      `)
      .eq('patient_id', patientId)
      .eq('is_visible', true)
      .order('record_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.error('Error fetching medical records:', recordsError)
      return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 })
    }

    return NextResponse.json({ medical_records: records || [] })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/patients/:patientId/medical-records - Create a new medical record
export async function POST(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await params

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

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only doctors and admins can create medical records
    if (!['doctor', 'admin_tenant', 'super_admin'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only doctors and administrators can create medical records'
      }, { status: 403 })
    }

    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id, first_name, last_name')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify tenant access
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      record_type,
      record_date,
      appointment_id,
      chief_complaint,
      subjective,
      objective,
      assessment,
      plan,
      vital_signs,
      tenant_specific_data,
      attachments,
      prescriptions,
      diagnoses
    } = body

    // Validate required fields
    if (!record_type || !record_date) {
      return NextResponse.json({
        error: 'Missing required fields: record_type, record_date'
      }, { status: 400 })
    }

    // Create medical record
    const { data: medicalRecord, error: recordError } = await supabase
      .from('medical_records')
      .insert({
        patient_id: patientId,
        tenant_id: patient.tenant_id,
        appointment_id: appointment_id || null,
        record_type,
        record_date,
        doctor_id: user.id,
        doctor_name: `${user.profile?.first_name} ${user.profile?.last_name}`,
        chief_complaint: chief_complaint || null,
        subjective: subjective || null,
        objective: objective || null,
        assessment: assessment || null,
        plan: plan || null,
        vital_signs: vital_signs || {},
        tenant_specific_data: tenant_specific_data || {},
        attachments: attachments || [],
        created_by: user.id
      })
      .select()
      .single()

    if (recordError) {
      console.error('Error creating medical record:', recordError)
      return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 })
    }

    // Create prescriptions if provided
    if (prescriptions && Array.isArray(prescriptions) && prescriptions.length > 0) {
      const prescriptionData = prescriptions.map(p => ({
        medical_record_id: medicalRecord.id,
        patient_id: patientId,
        tenant_id: patient.tenant_id,
        medication_name: p.medication_name,
        dosage: p.dosage,
        frequency: p.frequency,
        duration: p.duration || null,
        quantity: p.quantity || null,
        instructions: p.instructions || null,
        prescribed_by: user.id
      }))

      await supabase.from('prescriptions').insert(prescriptionData)
    }

    // Create diagnoses if provided
    if (diagnoses && Array.isArray(diagnoses) && diagnoses.length > 0) {
      const diagnosisData = diagnoses.map(d => ({
        medical_record_id: medicalRecord.id,
        patient_id: patientId,
        tenant_id: patient.tenant_id,
        diagnosis_code: d.diagnosis_code || null,
        diagnosis_name: d.diagnosis_name,
        diagnosis_type: d.diagnosis_type || null,
        severity: d.severity || null,
        notes: d.notes || null,
        status: d.status || 'active',
        diagnosed_date: d.diagnosed_date || record_date,
        diagnosed_by: user.id
      }))

      await supabase.from('diagnoses').insert(diagnosisData)
    }

    // Fetch complete record with relations
    const { data: completeRecord } = await supabase
      .from('medical_records')
      .select(`
        *,
        prescriptions (*),
        diagnoses (*)
      `)
      .eq('id', medicalRecord.id)
      .single()

    return NextResponse.json({ medical_record: completeRecord }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
