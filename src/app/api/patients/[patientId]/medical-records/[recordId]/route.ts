import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { customAuth } from '@/lib/custom-auth'

// GET /api/patients/:patientId/medical-records/:recordId - Get a specific medical record
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string; recordId: string }> }
) {
  const { patientId, recordId } = await params

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

    // Fetch medical record with relations
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select(`
        *,
        prescriptions (*),
        diagnoses (*),
        patient:patients (id, first_name, last_name, email, date_of_birth),
        doctor:custom_users!medical_records_doctor_id_fkey (id, first_name, last_name, email)
      `)
      .eq('id', recordId)
      .eq('patient_id', patientId)
      .eq('is_visible', true)
      .single()

    if (recordError || !record) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 })
    }

    return NextResponse.json({ medical_record: record })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/patients/:patientId/medical-records/:recordId - Update a medical record
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ patientId: string; recordId: string }> }
) {
  const { patientId, recordId } = await params

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

    // Only doctors and admins can update medical records
    if (!['doctor', 'admin_tenant', 'super_admin'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only doctors and administrators can update medical records'
      }, { status: 403 })
    }

    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify tenant access
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify record exists and belongs to patient
    const { data: existingRecord, error: recordCheckError } = await supabase
      .from('medical_records')
      .select('id, patient_id')
      .eq('id', recordId)
      .eq('patient_id', patientId)
      .single()

    if (recordCheckError || !existingRecord) {
      return NextResponse.json({ error: 'Medical record not found' }, { status: 404 })
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

    // Update medical record
    const { data: updatedRecord, error: updateError } = await supabase
      .from('medical_records')
      .update({
        record_type: record_type || existingRecord.record_type,
        record_date: record_date || existingRecord.record_date,
        appointment_id: appointment_id !== undefined ? appointment_id : existingRecord.appointment_id,
        chief_complaint: chief_complaint !== undefined ? chief_complaint : existingRecord.chief_complaint,
        subjective: subjective !== undefined ? subjective : existingRecord.subjective,
        objective: objective !== undefined ? objective : existingRecord.objective,
        assessment: assessment !== undefined ? assessment : existingRecord.assessment,
        plan: plan !== undefined ? plan : existingRecord.plan,
        vital_signs: vital_signs !== undefined ? vital_signs : existingRecord.vital_signs,
        tenant_specific_data: tenant_specific_data !== undefined ? tenant_specific_data : existingRecord.tenant_specific_data,
        attachments: attachments !== undefined ? attachments : existingRecord.attachments,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating medical record:', updateError)
      return NextResponse.json({ error: 'Failed to update medical record' }, { status: 500 })
    }

    // Update prescriptions if provided
    if (prescriptions !== undefined && Array.isArray(prescriptions)) {
      // Delete existing prescriptions
      await supabase
        .from('prescriptions')
        .delete()
        .eq('medical_record_id', recordId)

      // Insert new prescriptions
      if (prescriptions.length > 0) {
        const prescriptionData = prescriptions.map(p => ({
          medical_record_id: recordId,
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
    }

    // Update diagnoses if provided
    if (diagnoses !== undefined && Array.isArray(diagnoses)) {
      // Delete existing diagnoses
      await supabase
        .from('diagnoses')
        .delete()
        .eq('medical_record_id', recordId)

      // Insert new diagnoses
      if (diagnoses.length > 0) {
        const diagnosisData = diagnoses.map(d => ({
          medical_record_id: recordId,
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
    }

    // Fetch complete updated record with relations
    const { data: completeRecord } = await supabase
      .from('medical_records')
      .select(`
        *,
        prescriptions (*),
        diagnoses (*),
        patient:patients (id, first_name, last_name, email, date_of_birth),
        doctor:custom_users!medical_records_doctor_id_fkey (id, first_name, last_name, email)
      `)
      .eq('id', recordId)
      .single()

    return NextResponse.json({ medical_record: completeRecord })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/patients/:patientId/medical-records/:recordId - Partial update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string; recordId: string }> }
) {
  // PATCH uses same logic as PUT but only updates provided fields
  return PUT(request, { params })
}

// DELETE /api/patients/:patientId/medical-records/:recordId - Soft delete a medical record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ patientId: string; recordId: string }> }
) {
  const { patientId, recordId } = await params

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

    // Only doctors and admins can delete medical records
    if (!['doctor', 'admin_tenant', 'super_admin'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only doctors and administrators can delete medical records'
      }, { status: 403 })
    }

    // Get patient info
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('tenant_id')
      .eq('id', patientId)
      .single()

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Verify tenant access
    if (user.profile?.tenant_id !== patient.tenant_id && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete (set is_visible = false)
    const { error: deleteError } = await supabase
      .from('medical_records')
      .update({
        is_visible: false,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', recordId)
      .eq('patient_id', patientId)

    if (deleteError) {
      console.error('Error deleting medical record:', deleteError)
      return NextResponse.json({ error: 'Failed to delete medical record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Medical record deleted' })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
