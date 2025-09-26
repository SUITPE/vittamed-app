import { FlowContext, FlowStep, BusinessFlow } from './types'
import { flowEngine } from './FlowEngine'

// Step implementations
const validateAvailabilityStep: FlowStep = {
  name: 'validate_availability',
  action: async (context: FlowContext): Promise<FlowContext> => {
    if (!context.appointment) {
      throw new Error('Appointment data required')
    }

    // Check doctor availability
    const response = await fetch(
      `/api/availability?doctorId=${context.appointment.doctor_id}&date=${context.appointment.date}&tenantId=${context.tenant?.id}`
    )

    if (!response.ok) {
      throw new Error('Failed to check availability')
    }

    const availableSlots = await response.json()
    const requestedTime = context.appointment.time

    if (!availableSlots.includes(requestedTime)) {
      throw new Error('Requested time slot is not available')
    }

    return {
      ...context,
      appointment: {
        ...context.appointment,
        status: 'pending'
      }
    }
  },
  validate: (context: FlowContext) => {
    return !!(context.appointment && context.tenant)
  }
}

const createAppointmentStep: FlowStep = {
  name: 'create_appointment',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tenant_id: context.tenant?.id,
        doctor_id: context.appointment?.doctor_id,
        service_id: context.appointment?.service_id,
        appointment_date: context.appointment?.date,
        start_time: context.appointment?.time,
        patient_first_name: context.user?.email?.split('@')[0] || 'Patient',
        patient_last_name: 'User',
        patient_email: context.user?.email || 'patient@example.com',
        patient_phone: '+1234567890'
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create appointment')
    }

    const appointment = await response.json()

    // Emit event
    flowEngine.emit('appointment.created', context)

    return {
      ...context,
      appointment: {
        ...context.appointment!,
        id: appointment.id,
        status: 'pending'
      }
    }
  },
  rollback: async (context: FlowContext): Promise<FlowContext> => {
    if (context.appointment?.id) {
      // Cancel the appointment if it was created
      await fetch(`/api/appointments/${context.appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'cancelled' })
      })
    }
    return context
  }
}

const initiatePaymentStep: FlowStep = {
  name: 'initiate_payment',
  action: async (context: FlowContext): Promise<FlowContext> => {
    // For now, simulate payment initiation
    // In real implementation, this would create Stripe Payment Intent

    const paymentIntent = {
      amount: context.payment?.amount || 0,
      currency: context.payment?.currency || 'usd',
      status: 'processing' as const,
      stripe_payment_intent_id: `pi_simulate_${Date.now()}`
    }

    // Emit event
    flowEngine.emit('payment.initiated', context)

    return {
      ...context,
      payment: paymentIntent
    }
  },
  validate: (context: FlowContext) => {
    return !!(context.payment?.amount && context.payment.amount > 0)
  }
}

const sendConfirmationStep: FlowStep = {
  name: 'send_confirmation',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const notifications = [{
      type: 'confirmation' as const,
      channel: 'email' as const,
      recipient: context.user?.email || '',
      sent: true
    }]

    // Simulate sending email notification
    console.log(`📧 Sending confirmation email to: ${context.user?.email}`)
    console.log(`📅 Appointment: ${context.appointment?.date} at ${context.appointment?.time}`)

    // Emit event
    flowEngine.emit('notification.sent', context)

    return {
      ...context,
      notifications
    }
  }
}

// Define the complete appointment booking flow
export const appointmentBookingFlow: BusinessFlow = {
  name: 'appointment_booking',
  steps: [
    validateAvailabilityStep,
    createAppointmentStep,
    initiatePaymentStep,
    sendConfirmationStep
  ],
  context: {}
}

// Register the flow
flowEngine.registerFlow(appointmentBookingFlow)