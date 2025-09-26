export type TenantType = 'clinic' | 'spa' | 'consultorio';

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export interface Tenant {
  id: string;
  name: string;
  tenant_type: TenantType;
  address?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  specialty?: string;
  license_number?: string;
  created_at: string;
  updated_at: string;
}

export interface DoctorTenant {
  id: string;
  doctor_id: string;
  tenant_id: string;
  is_active: boolean;
  hourly_rate?: number;
  created_at: string;
  doctor?: Doctor;
  tenant?: Tenant;
}

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  doctor_id: string;
  patient_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  notes?: string;
  total_amount?: number;
  paid_amount?: number;
  payment_status?: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
  doctor?: Doctor;
  patient?: Patient;
  service?: Service;
}

export interface DoctorAvailability {
  id: string;
  doctor_tenant_id: string;
  day_of_week: number; // 0 = Sunday, 6 = Saturday
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  doctor_tenant?: DoctorTenant;
}

export interface DoctorBreak {
  id: string;
  doctor_tenant_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_type: string;
  is_active: boolean;
  created_at: string;
  doctor_tenant?: DoctorTenant;
}

export interface Notification {
  id: string;
  appointment_id: string;
  type: string; // 'confirmation', 'reminder', 'cancellation'
  channel: string; // 'email', 'whatsapp', 'sms'
  recipient: string;
  message: string;
  sent_at?: string;
  status: string; // 'pending', 'sent', 'failed'
  created_at: string;
  appointment?: Appointment;
}