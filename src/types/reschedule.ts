/**
 * Types for Appointment Reschedule/Rebook System
 * Ticket: VT-182 - DB: Campos de Reschedule/Rebook en appointments
 */

import type { Appointment, AppointmentStatus } from './database';

// ============================================================================
// RESCHEDULE REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Request body for rescheduling an appointment
 */
export interface RescheduleAppointmentRequest {
  // Required: New date/time
  new_date: string; // YYYY-MM-DD
  new_start_time: string; // HH:MM
  new_end_time?: string; // HH:MM (optional, calculated from service duration if not provided)

  // Optional: Change provider
  new_doctor_id?: string;
  new_member_id?: string;
  new_assigned_member_id?: string;

  // Required: Reason for reschedule
  reason: string;

  // Optional: Additional notes
  notes?: string;

  // Optional: Notification preferences
  send_notification?: boolean;
  notification_channels?: ('email' | 'sms' | 'whatsapp')[];
}

/**
 * Request body for rebooking an appointment (after completion/no-show)
 */
export interface RebookAppointmentRequest {
  // Required: New date/time
  new_date: string;
  new_start_time: string;
  new_end_time?: string;

  // Optional: Change provider
  new_doctor_id?: string;
  new_member_id?: string;
  new_assigned_member_id?: string;

  // Optional: Change service
  new_service_id?: string;

  // Optional: Notes
  notes?: string;

  // Optional: Notification preferences
  send_notification?: boolean;
}

/**
 * Response for reschedule/rebook operations
 */
export interface RescheduleAppointmentResponse {
  success: boolean;
  new_appointment: Appointment;
  original_appointment: Appointment;
  reschedule_count: number;
  message: string;
  notification_sent?: boolean;
}

// ============================================================================
// RESCHEDULE HISTORY AND CHAIN TYPES
// ============================================================================

/**
 * Represents a single entry in the reschedule chain
 */
export interface RescheduleChainEntry {
  appointment_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reschedule_reason?: string;
  rescheduled_at?: string;
  rescheduled_by_name?: string;
  is_rebook: boolean;
  created_at: string;
}

/**
 * Complete reschedule chain for an appointment
 */
export interface AppointmentRescheduleChain {
  original_appointment_id: string;
  current_appointment_id: string;
  total_reschedules: number;
  chain: RescheduleChainEntry[];
}

/**
 * Extended appointment type with reschedule chain
 */
export interface AppointmentWithRescheduleHistory extends Appointment {
  reschedule_chain?: RescheduleChainEntry[];
  original_appointment?: {
    id: string;
    appointment_date: string;
    start_time: string;
    created_at: string;
  };
  rescheduled_from?: {
    id: string;
    appointment_date: string;
    start_time: string;
    status: AppointmentStatus;
  };
  rescheduled_by_user?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

// ============================================================================
// VALIDATION AND BUSINESS RULES
// ============================================================================

/**
 * Result of checking if an appointment can be rescheduled
 */
export interface RescheduleEligibility {
  can_reschedule: boolean;
  reasons: string[];
  max_reschedules_reached?: boolean;
  cutoff_time_passed?: boolean;
  status_not_allowed?: boolean;
}

/**
 * Configuration for reschedule policies
 */
export interface ReschedulePolicy {
  max_reschedules_per_appointment: number; // 0 = unlimited
  min_hours_before_appointment: number; // Minimum hours before appointment to allow reschedule
  allowed_source_statuses: AppointmentStatus[]; // Statuses from which reschedule is allowed
  requires_reason: boolean;
  notify_patient: boolean;
  notify_provider: boolean;
}

/**
 * Default reschedule policy values
 */
export const DEFAULT_RESCHEDULE_POLICY: ReschedulePolicy = {
  max_reschedules_per_appointment: 3,
  min_hours_before_appointment: 24,
  allowed_source_statuses: ['pending', 'confirmed'],
  requires_reason: true,
  notify_patient: true,
  notify_provider: true,
};

// ============================================================================
// API QUERY TYPES
// ============================================================================

/**
 * Filters for listing rescheduled appointments
 */
export interface RescheduleFilters {
  tenant_id?: string;
  patient_id?: string;
  doctor_id?: string;
  member_id?: string;
  date_from?: string;
  date_to?: string;
  min_reschedule_count?: number;
  is_rebook?: boolean;
  include_chain?: boolean;
}

/**
 * Response for listing rescheduled appointments
 */
export interface RescheduledAppointmentsResponse {
  appointments: AppointmentWithRescheduleHistory[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  stats?: {
    total_reschedules: number;
    total_rebooks: number;
    avg_reschedules_per_appointment: number;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an appointment can be rescheduled based on its status
 */
export function canRescheduleStatus(status: AppointmentStatus): boolean {
  return ['pending', 'confirmed'].includes(status);
}

/**
 * Check if an appointment can be rebooked based on its status
 */
export function canRebookStatus(status: AppointmentStatus): boolean {
  return ['completed', 'no_show', 'cancelled'].includes(status);
}

/**
 * Get display label for reschedule count
 */
export function getRescheduleCountLabel(count: number): string {
  if (count === 0) return 'Original';
  if (count === 1) return 'Reprogramada 1 vez';
  return `Reprogramada ${count} veces`;
}

/**
 * Check if reschedule limit is reached
 */
export function isRescheduleLimitReached(
  currentCount: number,
  maxReschedules: number
): boolean {
  if (maxReschedules === 0) return false; // 0 = unlimited
  return currentCount >= maxReschedules;
}

/**
 * Calculate hours until appointment
 */
export function hoursUntilAppointment(
  appointmentDate: string,
  startTime: string
): number {
  const appointmentDateTime = new Date(`${appointmentDate}T${startTime}`);
  const now = new Date();
  const diffMs = appointmentDateTime.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60));
}

/**
 * Check reschedule eligibility
 */
export function checkRescheduleEligibility(
  appointment: Appointment,
  policy: ReschedulePolicy = DEFAULT_RESCHEDULE_POLICY
): RescheduleEligibility {
  const reasons: string[] = [];

  // Check status
  const statusAllowed = policy.allowed_source_statuses.includes(appointment.status);
  if (!statusAllowed) {
    reasons.push(`El estado "${appointment.status}" no permite reprogramacion`);
  }

  // Check reschedule limit
  const rescheduleCount = appointment.reschedule_count || 0;
  const maxReached = isRescheduleLimitReached(
    rescheduleCount,
    policy.max_reschedules_per_appointment
  );
  if (maxReached) {
    reasons.push(
      `Se alcanzo el limite de ${policy.max_reschedules_per_appointment} reprogramaciones`
    );
  }

  // Check cutoff time
  const hoursUntil = hoursUntilAppointment(
    appointment.appointment_date,
    appointment.start_time
  );
  const cutoffPassed = hoursUntil < policy.min_hours_before_appointment;
  if (cutoffPassed) {
    reasons.push(
      `Se requieren al menos ${policy.min_hours_before_appointment} horas de anticipacion`
    );
  }

  return {
    can_reschedule: reasons.length === 0,
    reasons,
    max_reschedules_reached: maxReached,
    cutoff_time_passed: cutoffPassed,
    status_not_allowed: !statusAllowed,
  };
}
