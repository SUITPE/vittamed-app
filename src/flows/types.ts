// Context7 Flow Types for VittaSami

export interface FlowContext {
  user?: {
    id: string
    email: string
    role: 'admin_tenant' | 'doctor' | 'patient'
    tenant_id?: string
  }
  tenant?: {
    id: string
    name: string
    type: 'clinic' | 'spa' | 'consultorio'
  }
  appointment?: {
    id: string
    doctor_id: string
    patient_id: string
    service_id: string
    date: string
    time: string
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  }
  payment?: {
    amount: number
    currency: string
    status: 'pending' | 'processing' | 'completed' | 'failed'
    stripe_payment_intent_id?: string
  }
  notifications?: Array<{
    type: 'confirmation' | 'reminder' | 'cancellation'
    channel: 'email' | 'whatsapp' | 'sms'
    recipient: string
    sent: boolean
  }>
}

export interface FlowStep {
  name: string
  action: (context: FlowContext) => Promise<FlowContext>
  rollback?: (context: FlowContext) => Promise<FlowContext>
  validate?: (context: FlowContext) => boolean
}

export interface BusinessFlow {
  name: string
  steps: FlowStep[]
  context: FlowContext
}

// Business Flow Events
export type FlowEvent =
  | 'appointment.created'
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'payment.initiated'
  | 'payment.completed'
  | 'payment.failed'
  | 'notification.sent'
  | 'user.authenticated'
  | 'doctor.availability_updated'