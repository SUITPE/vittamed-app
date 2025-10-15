import { FlowContext, FlowStep, BusinessFlow } from './types'
import { flowEngine } from './FlowEngine'

// Extended FlowContext for service management
interface ServiceFlowContext extends FlowContext {
  service?: {
    id?: string
    name: string
    description: string
    duration_minutes: number
    price: number
    category_id: string | null
    is_active: boolean
    tenant_id: string
  }
  operation?: 'create' | 'update' | 'delete' | 'toggle_status'
  validationResult?: {
    valid: boolean
    errors: string[]
  }
}

// Step 1: Validate Service Data
const validateServiceDataStep: FlowStep = {
  name: 'validate_service_data',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext
    const errors: string[] = []

    if (!serviceContext.service) {
      throw new Error('Service data is required')
    }

    const { name, duration_minutes, price, tenant_id } = serviceContext.service

    // Validation rules
    if (!name || name.trim().length === 0) {
      errors.push('Service name is required')
    }

    if (name && name.length > 255) {
      errors.push('Service name must be less than 255 characters')
    }

    if (!duration_minutes || duration_minutes < 15 || duration_minutes > 480) {
      errors.push('Duration must be between 15 and 480 minutes')
    }

    if (price === undefined || price < 0) {
      errors.push('Price must be a positive number')
    }

    if (!tenant_id) {
      errors.push('Tenant ID is required')
    }

    if (errors.length > 0) {
      return {
        ...serviceContext,
        validationResult: {
          valid: false,
          errors
        }
      }
    }

    return {
      ...serviceContext,
      validationResult: {
        valid: true,
        errors: []
      }
    }
  },
  validate: (context: FlowContext) => {
    const serviceContext = context as ServiceFlowContext
    return !!(serviceContext.service && serviceContext.tenant)
  }
}

// Step 2: Check for duplicate service names
const checkDuplicateServiceStep: FlowStep = {
  name: 'check_duplicate_service',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext

    if (serviceContext.operation === 'delete') {
      // Skip duplicate check for delete operations
      return serviceContext
    }

    try {
      const response = await fetch(
        `/api/tenants/${serviceContext.service?.tenant_id}/services`
      )

      if (response.ok) {
        const data = await response.json()
        const existingServices = data.services || []

        const duplicate = existingServices.find((s: any) =>
          s.name.toLowerCase() === serviceContext.service?.name.toLowerCase() &&
          s.id !== serviceContext.service?.id // Allow same name for updates
        )

        if (duplicate) {
          throw new Error(`A service with the name "${serviceContext.service?.name}" already exists`)
        }
      }
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        throw error
      }
      // Continue if API call fails (service might not exist yet)
      console.warn('Could not check for duplicate services:', error)
    }

    return serviceContext
  }
}

// Step 3: Create or update service in database
const persistServiceStep: FlowStep = {
  name: 'persist_service',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext

    if (!serviceContext.validationResult?.valid) {
      throw new Error('Validation failed: ' + serviceContext.validationResult?.errors.join(', '))
    }

    const { service, operation } = serviceContext

    let response: Response
    let endpoint: string

    switch (operation) {
      case 'create':
        endpoint = `/api/tenants/${service?.tenant_id}/services`
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        })
        break

      case 'update':
        endpoint = `/api/tenants/${service?.tenant_id}/services/${service?.id}`
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(service)
        })
        break

      case 'delete':
        endpoint = `/api/tenants/${service?.tenant_id}/services/${service?.id}`
        response = await fetch(endpoint, {
          method: 'DELETE'
        })
        break

      case 'toggle_status':
        endpoint = `/api/tenants/${service?.tenant_id}/services/${service?.id}`
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: service?.is_active })
        })
        break

      default:
        throw new Error('Invalid operation')
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to persist service')
    }

    const result = await response.json()

    console.log(`✅ Service ${operation} successful:`, result.service?.id || service?.id)

    return {
      ...serviceContext,
      service: result.service || service
    }
  },
  rollback: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext

    // Rollback logic based on operation
    if (serviceContext.operation === 'create' && serviceContext.service?.id) {
      console.log('🔄 Rolling back service creation:', serviceContext.service.id)

      try {
        await fetch(
          `/api/tenants/${serviceContext.service.tenant_id}/services/${serviceContext.service.id}`,
          { method: 'DELETE' }
        )
      } catch (error) {
        console.error('Rollback failed:', error)
      }
    }

    return serviceContext
  }
}

// Step 4: Emit service management event
const emitServiceEventStep: FlowStep = {
  name: 'emit_service_event',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext

    // Emit appropriate event based on operation
    switch (serviceContext.operation) {
      case 'create':
        console.log('📦 New service created:', serviceContext.service?.name)
        break
      case 'update':
        console.log('✏️ Service updated:', serviceContext.service?.name)
        break
      case 'delete':
        console.log('🗑️ Service deleted:', serviceContext.service?.name)
        break
      case 'toggle_status':
        console.log('🔄 Service status toggled:', serviceContext.service?.name,
          serviceContext.service?.is_active ? 'active' : 'inactive')
        break
    }

    return serviceContext
  }
}

// Step 5: Update cache or notify affected systems
const updateDependenciesStep: FlowStep = {
  name: 'update_dependencies',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const serviceContext = context as ServiceFlowContext

    // Future: Notify affected systems
    // - Update availability cache if service duration changed
    // - Notify scheduling system if service became inactive
    // - Update pricing cache

    console.log('🔗 Dependencies updated for service:', serviceContext.service?.id)

    return serviceContext
  }
}

// Define service management flows
export const createServiceFlow: BusinessFlow = {
  name: 'service_create',
  steps: [
    validateServiceDataStep,
    checkDuplicateServiceStep,
    persistServiceStep,
    emitServiceEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const updateServiceFlow: BusinessFlow = {
  name: 'service_update',
  steps: [
    validateServiceDataStep,
    checkDuplicateServiceStep,
    persistServiceStep,
    emitServiceEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const deleteServiceFlow: BusinessFlow = {
  name: 'service_delete',
  steps: [
    persistServiceStep,
    emitServiceEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const toggleServiceStatusFlow: BusinessFlow = {
  name: 'service_toggle_status',
  steps: [
    persistServiceStep,
    emitServiceEventStep,
    updateDependenciesStep
  ],
  context: {}
}

// Register all flows
flowEngine.registerFlow(createServiceFlow)
flowEngine.registerFlow(updateServiceFlow)
flowEngine.registerFlow(deleteServiceFlow)
flowEngine.registerFlow(toggleServiceStatusFlow)

// Export helper function to execute service flows
export async function executeServiceFlow(
  operation: 'create' | 'update' | 'delete' | 'toggle_status',
  serviceData: any,
  tenantId: string
): Promise<any> {
  const flowName = `service_${operation}`

  const context: ServiceFlowContext = {
    service: {
      ...serviceData,
      tenant_id: tenantId
    },
    operation,
    tenant: {
      id: tenantId,
      name: '',
      type: 'clinic'
    }
  }

  try {
    const result = await flowEngine.executeFlow(flowName, context)
    return result
  } catch (error: any) {
    console.error(`Service ${operation} flow failed:`, error.message)
    throw error
  }
}
