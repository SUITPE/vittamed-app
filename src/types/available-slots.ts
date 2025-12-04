/**
 * Types for Available Slots API
 *
 * TASK: VT-192
 * Epic: Gestión Avanzada de Agenda
 *
 * Endpoint: GET /api/doctors/:id/available-slots
 */

/**
 * Suggestion type for time range
 */
export type SlotSuggestionType = 'next_week' | 'two_weeks' | 'month';

/**
 * Query parameters for available slots endpoint
 */
export interface AvailableSlotsQueryParams {
  /** Base date to start searching from (YYYY-MM-DD) */
  base_date: string;
  /** Service duration in minutes */
  duration_minutes: number;
  /** How far ahead to search */
  suggestion_type: SlotSuggestionType;
  /** Optional: Limit number of slots per day */
  max_per_day?: number;
  /** Optional: Tenant ID (for multi-tenant access) */
  tenant_id?: string;
}

/**
 * A single available time slot
 */
export interface AvailableSlot {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of week (0-6, where 0 is Sunday) */
  day_of_week: number;
  /** Day name in Spanish */
  day_name: string;
  /** Start time in HH:MM format */
  start_time: string;
  /** End time in HH:MM format */
  end_time: string;
  /** Whether this is a preferred/recommended slot */
  is_preferred?: boolean;
}

/**
 * Slots grouped by date
 */
export interface DailySlots {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Day of week (0-6) */
  day_of_week: number;
  /** Day name in Spanish */
  day_name: string;
  /** Number of available slots */
  slot_count: number;
  /** Available slots for this day */
  slots: AvailableSlot[];
}

/**
 * Response from available slots endpoint
 */
export interface AvailableSlotsResponse {
  success: boolean;
  data?: {
    /** Doctor ID */
    doctor_id: string;
    /** Doctor name (if available) */
    doctor_name?: string;
    /** Tenant ID */
    tenant_id: string;
    /** Date range searched */
    date_range: {
      start: string;
      end: string;
    };
    /** Duration in minutes */
    duration_minutes: number;
    /** Total available slots found */
    total_slots: number;
    /** Slots grouped by date */
    days: DailySlots[];
    /** Flat list of next available slots (for quick access) */
    next_available?: AvailableSlot[];
  };
  error?: string;
}

/**
 * Day names in Spanish
 */
export const DAY_NAMES_ES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

/**
 * Get date range end based on suggestion type
 */
export function getDateRangeEnd(baseDate: Date, suggestionType: SlotSuggestionType): Date {
  const endDate = new Date(baseDate);

  switch (suggestionType) {
    case 'next_week':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'two_weeks':
      endDate.setDate(endDate.getDate() + 14);
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
  }

  return endDate;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateYMD(date: Date): string {
  return date.toISOString().split('T')[0];
}
