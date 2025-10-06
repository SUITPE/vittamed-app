// Types for VT-35: Business Catalog System
import type { AppointmentStatus } from './database'

// Re-export AppointmentStatus for external use
export type { AppointmentStatus }

export interface UnitMeasure {
  id: string
  name: string
  abbreviation: string
  type: 'weight' | 'volume' | 'length' | 'unit' | 'container' | 'pharmaceutical'
  created_at: string
  updated_at: string
}

export interface ProductBrand {
  id: string
  name: string
  description?: string
  logo_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Populated relations
  parent?: ProductCategory
  children?: ProductCategory[]
}

export interface ServiceCategory {
  id: string
  name: string
  description?: string
  parent_id?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Populated relations
  parent?: ServiceCategory
  children?: ServiceCategory[]
}

export interface Product {
  id: string
  tenant_id: string
  name: string
  brand_id?: string
  barcode?: string
  unit_measure_id: string
  quantity_per_unit: number
  short_description?: string
  description?: string
  category_id?: string
  price: number
  cost?: number
  stock_quantity: number
  min_stock_level: number
  max_stock_level?: number
  image_url?: string
  sku?: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Populated relations
  brand?: ProductBrand
  unit_measure?: UnitMeasure
  category?: ProductCategory
  images?: ProductImage[]
}

export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text?: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

export type ServiceType = 'clinic' | 'spa' | 'consultorio' | 'general'

export interface Service {
  id: string
  tenant_id: string
  name: string
  description?: string
  duration_minutes: number
  price?: number
  is_active: boolean
  service_type: ServiceType
  category_id?: string
  short_description?: string
  image_url?: string
  is_featured: boolean
  requires_appointment: boolean
  created_at: string
  updated_at: string
  // Populated relations
  category?: ServiceCategory
  images?: ServiceImage[]
}

export interface ServiceImage {
  id: string
  service_id: string
  image_url: string
  alt_text?: string
  is_primary: boolean
  sort_order: number
  created_at: string
}

// Form types for creating/updating entities
export interface CreateProductData {
  name: string
  brand_id?: string
  barcode?: string
  unit_measure_id: string
  quantity_per_unit: number
  short_description?: string
  description?: string
  category_id?: string
  price: number
  cost?: number
  stock_quantity?: number
  min_stock_level?: number
  max_stock_level?: number
  image_url?: string
  sku?: string
  is_active?: boolean
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}

export interface CreateServiceData {
  name: string
  description?: string
  duration_minutes: number
  price?: number
  is_active?: boolean
  service_type: ServiceType
  category_id?: string
  short_description?: string
  image_url?: string
  is_featured?: boolean
  requires_appointment?: boolean
}

export interface UpdateServiceData extends Partial<CreateServiceData> {
  id: string
}

export interface CreateBrandData {
  name: string
  description?: string
  logo_url?: string
  is_active?: boolean
}

export interface UpdateBrandData extends Partial<CreateBrandData> {
  id: string
}

export interface CreateCategoryData {
  name: string
  description?: string
  parent_id?: string
  is_active?: boolean
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string
}

export interface CreateUnitMeasureData {
  name: string
  abbreviation: string
  type: UnitMeasure['type']
}

export interface UpdateUnitMeasureData extends Partial<CreateUnitMeasureData> {
  id: string
}

// Filter and search types
export interface ProductFilters {
  search?: string
  category_id?: string
  brand_id?: string
  is_active?: boolean
  min_price?: number
  max_price?: number
  low_stock?: boolean
}

export interface ServiceFilters {
  search?: string
  category_id?: string
  service_type?: ServiceType
  is_active?: boolean
  is_featured?: boolean
  min_price?: number
  max_price?: number
  requires_appointment?: boolean
}

// API response types
export interface CatalogSummary {
  total_products: number
  total_services: number
  active_products: number
  active_services: number
  low_stock_products: number
  featured_services: number
  total_categories: number
  total_brands: number
}

// Image upload types
export interface ImageUploadResult {
  url: string
  filename: string
  size: number
  type: string
}

export interface MultipleImageUpload {
  images: ImageUploadResult[]
  primary_image_index?: number
}

// VT-36: Member-Service Association Types

export interface MemberService {
  id: string
  member_user_id: string
  service_id: string
  tenant_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  // Populated relations
  service?: Service
  member?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string
  }
}

// Form types for member-service associations
export interface CreateMemberServiceData {
  member_user_id: string
  service_id: string
  tenant_id: string
  is_active?: boolean
}

export interface UpdateMemberServiceData {
  is_active?: boolean
}

// API response types
export interface MemberServiceResponse {
  member_services: MemberService[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Query filters for member services
export interface MemberServiceFilters {
  member_user_id?: string
  service_id?: string
  tenant_id?: string
  is_active?: boolean
  search?: string // Search by member name or service name
}

// Extended service type with member associations
export interface ServiceWithMembers extends Service {
  assigned_members?: {
    id: string
    member_user_id: string
    is_active: boolean
    member: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string | null
    }
  }[]
}

// Extended member type with service associations
export interface MemberWithServices {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string
  tenant_id: string | null
  assigned_services?: {
    id: string
    service_id: string
    is_active: boolean
    service: Service
  }[]
}

// For booking validation - services available for a specific member
export interface MemberAvailableService {
  service_id: string
  service_name: string
  service_description?: string
  service_duration_minutes: number
  service_price?: number
  is_active: boolean
}

// ==========================================
// VT-18: MEMBER AVAILABILITY TYPES
// ==========================================

// Core member availability interface
export interface MemberAvailability {
  id: string
  member_user_id: string
  tenant_id: string
  day_of_week: number // 0 = Sunday, 6 = Saturday
  start_time: string // HH:MM format
  end_time: string // HH:MM format
  is_active: boolean
  created_at: string
  updated_at: string
  // Populated relations
  member?: {
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
    role: string
  }
}

// Member breaks interface
export interface MemberBreak {
  id: string
  member_user_id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  break_type: 'lunch' | 'break' | 'other'
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Form types for member availability
export interface CreateMemberAvailabilityData {
  member_user_id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

export interface UpdateMemberAvailabilityData {
  day_of_week?: number
  start_time?: string
  end_time?: string
  is_active?: boolean
}

export interface CreateMemberBreakData {
  member_user_id: string
  tenant_id: string
  day_of_week: number
  start_time: string
  end_time: string
  break_type?: 'lunch' | 'break' | 'other'
  description?: string
  is_active?: boolean
}

// VT-38: Appointment Lifecycle Management Types

// Appointment status history entry
export interface AppointmentStatusHistory {
  id: string
  appointment_id: string
  tenant_id: string
  status: AppointmentStatus
  previous_status: AppointmentStatus | null
  changed_by_user_id: string | null
  changed_by_role: string | null
  reason?: string
  notes?: string
  automated: boolean
  change_source: 'manual' | 'system' | 'api' | 'webhook'
  created_at: string
}

// Extended view with user and appointment details
export interface AppointmentLifecycleView {
  history_id: string
  appointment_id: string
  tenant_id: string
  status: AppointmentStatus
  previous_status: AppointmentStatus | null
  reason?: string
  notes?: string
  automated: boolean
  change_source: 'manual' | 'system' | 'api' | 'webhook'
  status_changed_at: string
  // User who made the change
  changed_by_first_name?: string
  changed_by_last_name?: string
  changed_by_email?: string
  changed_by_role?: string
  // Appointment context
  appointment_date: string
  start_time: string
  end_time: string
  total_amount?: number
  service_name?: string
  // Patient context
  patient_first_name?: string
  patient_last_name?: string
  patient_email?: string
}

// Status transition data for API calls
export interface StatusTransitionData {
  appointment_id: string
  new_status: AppointmentStatus
  reason?: string
  notes?: string
  automated?: boolean
  change_source?: 'manual' | 'system' | 'api' | 'webhook'
}

// Status transition validation
export interface StatusTransitionRule {
  from: AppointmentStatus
  to: AppointmentStatus
  allowed: boolean
  required_role?: string[]
  validation_required?: boolean
  reason_required?: boolean
}

// Appointment with lifecycle summary
export interface AppointmentWithLifecycle {
  id: string
  tenant_id: string
  doctor_id?: string
  member_id?: string
  assigned_member_id?: string
  patient_id: string
  service_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes?: string
  total_amount?: number
  paid_amount?: number
  payment_status?: string
  stripe_payment_intent_id?: string
  created_at: string
  updated_at: string
  // Lifecycle information
  status_history: AppointmentStatusHistory[]
  last_status_change?: string
  changed_by?: string
  status_change_count: number
}

// VT-40: Allow Bookings Flag Types

// Member with booking availability flag
export interface MemberBookingSettings {
  member_user_id: string
  tenant_id: string
  first_name?: string
  last_name?: string
  email?: string
  allow_bookings: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  assigned_services_count: number
  availability_entries_count: number
}

// Member information including booking settings
export interface MemberWithBookingFlag {
  id: string
  tenant_id: string
  first_name?: string
  last_name?: string
  email?: string
  role: string
  is_active: boolean
  allow_bookings: boolean
  created_at: string
  updated_at: string
  // Service associations
  member_services?: MemberService[]
  // Availability settings
  member_availability?: MemberAvailability[]
}

// Update to Member interface to include allow_bookings
export interface Member {
  id: string
  tenant_id: string
  first_name?: string
  last_name?: string
  email?: string
  role: string
  is_active: boolean
  allow_bookings: boolean // VT-40: Added allow_bookings flag
  created_at: string
  updated_at: string
}

// Member booking availability data for APIs
export interface BookableMemberData {
  member_user_id: string
  first_name?: string
  last_name?: string
  email?: string
  allow_bookings: boolean
  is_active: boolean
  member_service_active: boolean
  // Optional availability information
  availability?: MemberTimeSlot[]
}

// Update member creation/update data types
export interface CreateMemberData {
  tenant_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: 'member'
  is_active?: boolean
  allow_bookings?: boolean // VT-40: Allow setting on creation
}

export interface UpdateMemberData {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  is_active?: boolean
  allow_bookings?: boolean // VT-40: Allow updating booking permission
}

// Member booking settings update specifically
export interface UpdateMemberBookingSettingsData {
  allow_bookings: boolean
  reason?: string // Optional reason for the change
  notes?: string // Optional admin notes
}

// Response when updating member booking settings
export interface MemberBookingSettingsUpdateResponse {
  success: boolean
  member: MemberWithBookingFlag
  previous_setting: boolean
  new_setting: boolean
  updated_by: {
    id: string
    role: string
  }
  updated_at: string
  message: string
}

// VT-43: Appointment Reminders System Types

// Reminder notification data interface
export interface ReminderNotificationData {
  recipientEmail?: string
  recipientPhone?: string
  tenantId: string
  appointmentId: string
  channel: 'email' | 'sms' | 'whatsapp'
  templateData: EmailReminderTemplateData | SMSReminderTemplateData
}

// Reminder configuration
export interface ReminderConfiguration {
  id: string
  tenant_id: string
  applies_to: 'tenant_default' | 'user_preference'
  user_id?: string
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  email_hours_before: number
  sms_hours_before: number
  whatsapp_hours_before: number
  send_multiple_reminders: boolean
  max_reminders: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Scheduled reminder entry
export interface ScheduledReminder {
  id: string
  appointment_id: string
  tenant_id: string
  reminder_config_id?: string
  channel: 'email' | 'sms' | 'whatsapp'
  recipient: string
  scheduled_send_time: string
  status: 'scheduled' | 'processing' | 'sent' | 'failed' | 'cancelled'
  sent_at?: string
  error_message?: string
  retry_count: number
  max_retries: number
  notification_id?: string
  created_at: string
  updated_at: string
}

// Tenant branding for notifications
export interface TenantBranding {
  id: string
  tenant_id: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  email_from_name?: string
  email_signature?: string
  custom_footer?: string
  sms_sender_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Reminder configuration forms
export interface CreateReminderConfigurationData {
  tenant_id: string
  applies_to: 'tenant_default' | 'user_preference'
  user_id?: string
  email_enabled?: boolean
  sms_enabled?: boolean
  whatsapp_enabled?: boolean
  email_hours_before?: number
  sms_hours_before?: number
  whatsapp_hours_before?: number
  send_multiple_reminders?: boolean
  max_reminders?: number
}

export interface UpdateReminderConfigurationData {
  email_enabled?: boolean
  sms_enabled?: boolean
  whatsapp_enabled?: boolean
  email_hours_before?: number
  sms_hours_before?: number
  whatsapp_hours_before?: number
  send_multiple_reminders?: boolean
  max_reminders?: number
  is_active?: boolean
}

// Tenant branding forms
export interface CreateTenantBrandingData {
  tenant_id: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  email_from_name?: string
  email_signature?: string
  custom_footer?: string
  sms_sender_name?: string
}

export interface UpdateTenantBrandingData {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  email_from_name?: string
  email_signature?: string
  custom_footer?: string
  sms_sender_name?: string
  is_active?: boolean
}

// Effective reminder configuration (combines user and tenant settings)
export interface EffectiveReminderConfig {
  email_enabled: boolean
  sms_enabled: boolean
  whatsapp_enabled: boolean
  email_hours_before: number
  sms_hours_before: number
  whatsapp_hours_before: number
  send_multiple_reminders: boolean
  max_reminders: number
  config_source: 'user_preference' | 'tenant_default' | 'system_default'
}

// Reminder data for processing
export interface ReminderData {
  appointment_id: string
  tenant_id: string
  channel: 'email' | 'sms' | 'whatsapp'
  recipient: string
  appointment_details: {
    date: string
    time: string
    service_name: string
    provider_name: string
    provider_type: 'doctor' | 'member'
    duration: number
    location?: string
  }
  patient_details: {
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }
  tenant_branding?: TenantBranding
}

// Reminder template data
export interface EmailReminderTemplateData {
  tenant: {
    name: string
    logo_url?: string
    primary_color: string
    secondary_color: string
    email_from_name?: string
    email_signature?: string
    custom_footer?: string
  }
  appointment: {
    id: string
    date: string
    time: string
    service_name: string
    provider_name: string
    provider_type: 'doctor' | 'member'
    duration: number
    location?: string
    notes?: string
  }
  patient: {
    first_name: string
    last_name: string
    full_name: string
  }
  reminder: {
    hours_before: number
    channel: string
  }
}

export interface SMSReminderTemplateData {
  tenant: {
    name: string
    sms_sender_name?: string
    phone?: string
  }
  appointment: {
    date: string
    time: string
    service_name: string
    provider_name: string
    provider_type: 'doctor' | 'member'
  }
  patient: {
    first_name: string
  }
  reminder: {
    hours_before: number
  }
}

// Reminder processing result
export interface ReminderProcessingResult {
  scheduled_reminder_id: string
  success: boolean
  notification_id?: string
  error_message?: string
  sent_at?: string
}

export interface UpdateMemberBreakData {
  day_of_week?: number
  start_time?: string
  end_time?: string
  break_type?: 'lunch' | 'break' | 'other'
  description?: string
  is_active?: boolean
}

// Query filters for member availability
export interface MemberAvailabilityFilters {
  member_user_id?: string
  tenant_id?: string
  day_of_week?: number
  is_active?: boolean
}

// API response types
export interface MemberAvailabilityResponse {
  availability: MemberAvailability[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Time slot generation types (for booking interfaces)
export interface MemberTimeSlot {
  time: string // HH:MM format
  is_available: boolean
  conflicts?: {
    type: 'appointment' | 'break' | 'unavailable'
    description?: string
  }[]
}

// Member with availability information
export interface MemberWithAvailability {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string
  tenant_id: string | null
  availability?: MemberAvailability[]
  breaks?: MemberBreak[]
}

// For booking validation - combined availability and service data
export interface MemberBookingAvailability {
  member_id: string
  member_name: string
  available_services: MemberAvailableService[]
  weekly_availability: {
    [day: number]: {
      periods: Array<{
        start_time: string
        end_time: string
      }>
      breaks: Array<{
        start_time: string
        end_time: string
        break_type: string
      }>
    }
  }
}