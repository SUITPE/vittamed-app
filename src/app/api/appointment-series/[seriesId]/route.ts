/**
 * API Route: /api/appointment-series/[seriesId]
 * Ticket: VT-96 - API CRUD de Series Recurrentes
 *
 * GET    - Get series details
 * PATCH  - Update series configuration
 * DELETE - Cancel series (and optionally future appointments)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase-server';
import { customAuth } from '@/lib/custom-auth';
import { SeriesStatus } from '@/types/appointment-series';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const UpdateSeriesSchema = z.object({
  recurrence_type: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']).optional(),
  recurrence_interval: z.number().int().min(1).max(12).optional(),
  recurrence_days: z.array(z.number().int().min(0).max(6)).optional(),
  base_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora inválido').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido').optional(),
  max_occurrences: z.number().int().min(1).max(100).optional(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
  notes: z.string().max(500).optional(),
});

// ============================================================================
// GET - Get Series Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;

    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = user.profile?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 });
    }

    const supabase = await createAdminClient();

    // 2. Fetch series with relations
    const { data: series, error } = await supabase
      .from('appointment_series')
      .select(`
        *,
        patient:patients!appointment_series_patient_id_fkey(id, first_name, last_name, email, phone),
        doctor:doctors!appointment_series_doctor_id_fkey(id, first_name, last_name),
        member:custom_users!appointment_series_member_id_fkey(id, first_name, last_name),
        service:services!appointment_series_service_id_fkey(id, name, duration, price),
        created_by_user:custom_users!appointment_series_created_by_fkey(id, first_name, last_name)
      `)
      .eq('id', seriesId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !series) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    // 3. Fetch appointments for this series
    const { data: appointments, error: apptError } = await supabase
      .from('appointments')
      .select('id, start_time, end_time, status, series_occurrence')
      .eq('series_id', seriesId)
      .order('series_occurrence', { ascending: true });

    if (apptError) {
      console.error('[API] Error fetching series appointments:', apptError);
    }

    // 4. Calculate statistics
    const stats = {
      total_appointments: appointments?.length || 0,
      completed: appointments?.filter(a => a.status === 'completed').length || 0,
      pending: appointments?.filter(a => a.status === 'pending').length || 0,
      cancelled: appointments?.filter(a => a.status === 'cancelled').length || 0,
      no_show: appointments?.filter(a => a.status === 'no_show').length || 0,
    };

    return NextResponse.json({
      series: {
        ...series,
        appointments: appointments || [],
        stats,
      },
    });
  } catch (error: unknown) {
    console.error('[API] Unexpected error in GET /api/appointment-series/[seriesId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ============================================================================
// PATCH - Update Series
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;

    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = user.profile?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 });
    }

    // 2. Validate request body
    const body = await request.json();
    const validationResult = UpdateSeriesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const updates = validationResult.data;
    const supabase = await createAdminClient();

    // 3. Verify series exists and user has access
    const { data: existingSeries, error: fetchError } = await supabase
      .from('appointment_series')
      .select('id, status, tenant_id')
      .eq('id', seriesId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !existingSeries) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    // 4. Check if series is editable
    if (existingSeries.status === 'cancelled' || existingSeries.status === 'completed') {
      return NextResponse.json(
        { error: `No se puede editar una serie ${existingSeries.status === 'cancelled' ? 'cancelada' : 'completada'}` },
        { status: 400 }
      );
    }

    // 5. Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.recurrence_type !== undefined) updateData.recurrence_type = updates.recurrence_type;
    if (updates.recurrence_interval !== undefined) updateData.recurrence_interval = updates.recurrence_interval;
    if (updates.recurrence_days !== undefined) updateData.recurrence_days = updates.recurrence_days;
    if (updates.base_time !== undefined) updateData.base_time = `${updates.base_time}:00`;
    if (updates.end_date !== undefined) updateData.end_date = updates.end_date;
    if (updates.max_occurrences !== undefined) updateData.max_occurrences = updates.max_occurrences;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    // 6. Update series
    const { data: updatedSeries, error: updateError } = await supabase
      .from('appointment_series')
      .update(updateData)
      .eq('id', seriesId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Error updating series:', updateError);
      return NextResponse.json({ error: 'Error al actualizar serie' }, { status: 500 });
    }

    console.log(`[API] Series ${seriesId} updated`);

    return NextResponse.json({
      success: true,
      series: updatedSeries,
    });
  } catch (error: unknown) {
    console.error('[API] Unexpected error in PATCH /api/appointment-series/[seriesId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Cancel Series
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  try {
    const { seriesId } = await params;

    // 1. Authenticate user
    const user = await customAuth.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = user.profile?.tenant_id;
    if (!tenantId) {
      return NextResponse.json({ error: 'Usuario sin tenant asignado' }, { status: 403 });
    }

    const supabase = await createAdminClient();
    const { searchParams } = new URL(request.url);
    const cancelFutureOnly = searchParams.get('future_only') === 'true';

    // 2. Verify series exists
    const { data: series, error: fetchError } = await supabase
      .from('appointment_series')
      .select('id, status, tenant_id')
      .eq('id', seriesId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !series) {
      return NextResponse.json({ error: 'Serie no encontrada' }, { status: 404 });
    }

    if (series.status === 'cancelled') {
      return NextResponse.json({ error: 'La serie ya está cancelada' }, { status: 400 });
    }

    // 3. Update series status
    const { error: updateError } = await supabase
      .from('appointment_series')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', seriesId);

    if (updateError) {
      console.error('[API] Error cancelling series:', updateError);
      return NextResponse.json({ error: 'Error al cancelar serie' }, { status: 500 });
    }

    // 4. Cancel associated appointments
    let appointmentsQuery = supabase
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('series_id', seriesId)
      .in('status', ['pending', 'confirmed']); // Only cancel pending/confirmed

    if (cancelFutureOnly) {
      appointmentsQuery = appointmentsQuery.gte('start_time', new Date().toISOString());
    }

    const { error: apptUpdateError, count: cancelledCount } = await appointmentsQuery;

    if (apptUpdateError) {
      console.error('[API] Error cancelling series appointments:', apptUpdateError);
    }

    console.log(`[API] Series ${seriesId} cancelled, ${cancelledCount || 0} appointments cancelled`);

    return NextResponse.json({
      success: true,
      message: 'Serie cancelada exitosamente',
      cancelled_appointments: cancelledCount || 0,
    });
  } catch (error: unknown) {
    console.error('[API] Unexpected error in DELETE /api/appointment-series/[seriesId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
