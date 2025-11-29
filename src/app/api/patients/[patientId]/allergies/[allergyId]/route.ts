import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'
import { customAuth } from '@/lib/custom-auth'

// GET /api/patients/:patientId/allergies/:allergyId - Get a specific allergy
export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string; allergyId: string }> }
) {
  const { patientId, allergyId } = await params

  try {
    const supabase = await createAdminClient()

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch allergy with patient verification
    const { data: allergy, error: allergyError } = await supabase
      .from('patient_allergies')
      .select('*, patient:patients(tenant_id)')
      .eq('id', allergyId)
      .eq('patient_id', patientId)
      .single()

    if (allergyError || !allergy) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 })
    }

    // Check tenant access
    const tenantId = (allergy.patient as { tenant_id: string })?.tenant_id
    if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ allergy })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/patients/:patientId/allergies/:allergyId - Update an allergy
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ patientId: string; allergyId: string }> }
) {
  const { patientId, allergyId } = await params

  try {
    const supabase = await createAdminClient()

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only authorized staff can update allergies
    if (!['doctor', 'admin_tenant', 'super_admin', 'receptionist'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only authorized staff can update allergy records'
      }, { status: 403 })
    }

    // Verify allergy exists and belongs to patient
    const { data: existingAllergy, error: fetchError } = await supabase
      .from('patient_allergies')
      .select('*, patient:patients(tenant_id)')
      .eq('id', allergyId)
      .eq('patient_id', patientId)
      .single()

    if (fetchError || !existingAllergy) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 })
    }

    // Check tenant access
    const tenantId = (existingAllergy.patient as { tenant_id: string })?.tenant_id
    if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      allergen,
      allergy_type,
      reaction,
      severity,
      notes,
      first_observed,
      is_active
    } = body

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (allergen !== undefined) updateData.allergen = allergen
    if (allergy_type !== undefined) updateData.allergy_type = allergy_type
    if (reaction !== undefined) updateData.reaction = reaction
    if (severity !== undefined) updateData.severity = severity
    if (notes !== undefined) updateData.notes = notes
    if (first_observed !== undefined) updateData.first_observed = first_observed
    if (is_active !== undefined) updateData.is_active = is_active

    // Update allergy
    const { data: allergy, error: updateError } = await supabase
      .from('patient_allergies')
      .update(updateData)
      .eq('id', allergyId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating allergy:', updateError)
      return NextResponse.json({ error: 'Failed to update allergy' }, { status: 500 })
    }

    return NextResponse.json({ allergy })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/patients/:patientId/allergies/:allergyId - Delete an allergy
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ patientId: string; allergyId: string }> }
) {
  const { patientId, allergyId } = await params

  try {
    const supabase = await createAdminClient()

    const user = await customAuth.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only doctors and admins can delete allergies
    if (!['doctor', 'admin_tenant', 'super_admin'].includes(user.profile?.role || '')) {
      return NextResponse.json({
        error: 'Only doctors and administrators can delete allergy records'
      }, { status: 403 })
    }

    // Verify allergy exists and check tenant access
    const { data: existingAllergy, error: fetchError } = await supabase
      .from('patient_allergies')
      .select('*, patient:patients(tenant_id)')
      .eq('id', allergyId)
      .eq('patient_id', patientId)
      .single()

    if (fetchError || !existingAllergy) {
      return NextResponse.json({ error: 'Allergy not found' }, { status: 404 })
    }

    // Check tenant access
    const tenantId = (existingAllergy.patient as { tenant_id: string })?.tenant_id
    if (user.profile?.tenant_id !== tenantId && user.profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete allergy
    const { error: deleteError } = await supabase
      .from('patient_allergies')
      .delete()
      .eq('id', allergyId)

    if (deleteError) {
      console.error('Error deleting allergy:', deleteError)
      return NextResponse.json({ error: 'Failed to delete allergy' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
