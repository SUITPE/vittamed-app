import { FlowContext, FlowStep, BusinessFlow, FlowEvent } from './types'

export class FlowEngine {
  private flows: Map<string, BusinessFlow> = new Map()
  private eventListeners: Map<FlowEvent, Array<(context: FlowContext) => void>> = new Map()

  constructor() {
    this.setupEventListeners()
  }

  registerFlow(flow: BusinessFlow) {
    this.flows.set(flow.name, flow)
  }

  async executeFlow(flowName: string, initialContext: FlowContext): Promise<FlowContext> {
    const flow = this.flows.get(flowName)
    if (!flow) {
      throw new Error(`Flow '${flowName}' not found`)
    }

    let context = { ...initialContext }
    const executedSteps: FlowStep[] = []

    try {
      for (const step of flow.steps) {
        console.log(`Executing flow step: ${step.name}`)

        // Validate step if validation exists
        if (step.validate && !step.validate(context)) {
          throw new Error(`Validation failed for step: ${step.name}`)
        }

        // Execute step
        context = await step.action(context)
        executedSteps.push(step)

        console.log(`Step '${step.name}' completed successfully`)
      }

      console.log(`Flow '${flowName}' completed successfully`)
      return context

    } catch (error) {
      console.error(`Flow '${flowName}' failed at step:`, error)

      // Execute rollback for completed steps in reverse order
      for (const step of executedSteps.reverse()) {
        if (step.rollback) {
          try {
            console.log(`Rolling back step: ${step.name}`)
            context = await step.rollback(context)
          } catch (rollbackError) {
            console.error(`Rollback failed for step '${step.name}':`, rollbackError)
          }
        }
      }

      throw error
    }
  }

  on(event: FlowEvent, listener: (context: FlowContext) => void) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  emit(event: FlowEvent, context: FlowContext) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(listener => {
      try {
        listener(context)
      } catch (error) {
        console.error(`Event listener error for '${event}':`, error)
      }
    })
  }

  private setupEventListeners() {
    // Setup automatic event emission for common flow patterns
    this.on('appointment.created', (context) => {
      console.log('📅 New appointment created:', context.appointment?.id)
    })

    this.on('payment.completed', (context) => {
      console.log('💳 Payment completed:', context.payment?.stripe_payment_intent_id)
    })

    this.on('notification.sent', (context) => {
      console.log('📧 Notification sent:', context.notifications?.length)
    })
  }
}

// Singleton instance
export const flowEngine = new FlowEngine()