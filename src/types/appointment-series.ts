/**
 * Types for Appointment Series (Recurring Appointments)
 * Ticket: VT-91 - DB: Migración appointment_series
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Recurrence types for appointment series
 */
export type RecurrenceType = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

/**
 * Status of an appointment series
 */
export type SeriesStatus = 'active' | 'paused' | 'completed' | 'cancelled';

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Database representation of an appointment series
 */
export interface AppointmentSeries {
  id: string;

  // Tenant and participants
  tenant_id: string;
  patient_id: string;
  doctor_id: string | null;
  member_id: string | null;
  service_id: string;

  // Recurrence configuration
  recurrence_type: RecurrenceType;
  recurrence_interval: number; // 1-12
  recurrence_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat

  // Schedule
  base_time: string; // HH:MM:SS format
  duration_minutes: number;

  // Date range
  start_date: string; // YYYY-MM-DD
  end_date: string | null;
  max_occurrences: number | null;

  // Status
  status: SeriesStatus;

  // Metadata
  notes: string | null;
  created_by: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Appointment series with related data (for API responses)
 */
export interface AppointmentSeriesWithRelations extends AppointmentSeries {
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  doctor?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  member?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  service?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  appointments?: Array<{
    id: string;
    start_time: string;
    status: string;
    series_occurrence: number;
  }>;
  appointment_count?: number;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * Request body for creating an appointment series
 */
export interface CreateAppointmentSeriesRequest {
  // Required fields
  patient_id: string;
  service_id: string;
  recurrence_type: RecurrenceType;
  base_time: string; // HH:MM format
  start_date: string; // YYYY-MM-DD format

  // Provider (one required)
  doctor_id?: string;
  member_id?: string;

  // Optional recurrence config
  recurrence_interval?: number; // default: 1
  recurrence_days?: number[]; // for weekly/custom

  // End condition (one required)
  end_date?: string;
  max_occurrences?: number;

  // Optional
  duration_minutes?: number;
  notes?: string;
}

/**
 * Request body for updating an appointment series
 */
export interface UpdateAppointmentSeriesRequest {
  // Recurrence config
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_days?: number[];
  base_time?: string;

  // Date range
  end_date?: string;
  max_occurrences?: number;

  // Status
  status?: SeriesStatus;

  // Metadata
  notes?: string;
}

/**
 * Options for listing series
 */
export interface ListAppointmentSeriesOptions {
  tenant_id?: string;
  patient_id?: string;
  doctor_id?: string;
  member_id?: string;
  service_id?: string;
  status?: SeriesStatus | SeriesStatus[];
  start_date_from?: string;
  start_date_to?: string;
  include_appointments?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Response for creating a series (includes generated appointments)
 */
export interface CreateAppointmentSeriesResponse {
  series: AppointmentSeriesWithRelations;
  appointments: Array<{
    id: string;
    start_time: string;
    end_time: string;
    series_occurrence: number;
    status: string;
  }>;
  total_appointments: number;
  conflicts?: Array<{
    date: string;
    occurrence: number;
    reason: string;
  }>;
}

/**
 * Response for listing series
 */
export interface ListAppointmentSeriesResponse {
  series: AppointmentSeriesWithRelations[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get display name for recurrence type
 */
export function getRecurrenceTypeLabel(type: RecurrenceType): string {
  const labels: Record<RecurrenceType, string> = {
    daily: 'Diario',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    custom: 'Personalizado',
  };
  return labels[type];
}

/**
 * Get display name for series status
 */
export function getSeriesStatusLabel(status: SeriesStatus): string {
  const labels: Record<SeriesStatus, string> = {
    active: 'Activa',
    paused: 'Pausada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };
  return labels[status];
}

/**
 * Get day of week name
 */
export function getDayOfWeekName(day: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[day] || '';
}

/**
 * Get short day of week name
 */
export function getDayOfWeekShort(day: number): string {
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days[day] || '';
}

/**
 * Format recurrence description for display
 */
export function formatRecurrenceDescription(series: AppointmentSeries): string {
  const { recurrence_type, recurrence_interval, recurrence_days } = series;

  switch (recurrence_type) {
    case 'daily':
      return recurrence_interval === 1
        ? 'Todos los días'
        : `Cada ${recurrence_interval} días`;

    case 'weekly':
      if (recurrence_days.length === 0) {
        return recurrence_interval === 1
          ? 'Cada semana'
          : `Cada ${recurrence_interval} semanas`;
      }
      const dayNames = recurrence_days.map(getDayOfWeekShort).join(', ');
      return recurrence_interval === 1
        ? `Cada semana: ${dayNames}`
        : `Cada ${recurrence_interval} semanas: ${dayNames}`;

    case 'biweekly':
      return 'Cada 2 semanas';

    case 'monthly':
      return recurrence_interval === 1
        ? 'Cada mes'
        : `Cada ${recurrence_interval} meses`;

    case 'custom':
      if (recurrence_days.length > 0) {
        const dayNames = recurrence_days.map(getDayOfWeekShort).join(', ');
        return `Días: ${dayNames}`;
      }
      return 'Personalizado';

    default:
      return 'Recurrencia desconocida';
  }
}

/**
 * Validate recurrence configuration
 */
export function validateRecurrenceConfig(config: Partial<CreateAppointmentSeriesRequest>): string[] {
  const errors: string[] = [];

  // Check interval
  if (config.recurrence_interval !== undefined) {
    if (config.recurrence_interval < 1 || config.recurrence_interval > 12) {
      errors.push('Intervalo debe ser entre 1 y 12');
    }
  }

  // Check days for weekly/custom
  if (config.recurrence_type === 'weekly' || config.recurrence_type === 'custom') {
    if (!config.recurrence_days || config.recurrence_days.length === 0) {
      errors.push('Debe seleccionar al menos un día de la semana');
    } else {
      const invalidDays = config.recurrence_days.filter(d => d < 0 || d > 6);
      if (invalidDays.length > 0) {
        errors.push('Días de semana inválidos');
      }
    }
  }

  // Check end condition
  if (!config.end_date && !config.max_occurrences) {
    errors.push('Debe especificar fecha de fin o número máximo de ocurrencias');
  }

  // Check max_occurrences
  if (config.max_occurrences !== undefined) {
    if (config.max_occurrences < 1 || config.max_occurrences > 100) {
      errors.push('Máximo de ocurrencias debe ser entre 1 y 100');
    }
  }

  return errors;
}
