import { FlowContext, FlowStep, BusinessFlow } from './types'
import { flowEngine } from './FlowEngine'

// Extended FlowContext for category management
interface CategoryFlowContext extends FlowContext {
  category?: {
    id?: string
    name: string
    description: string | null
    tenant_id: string
    parent_id?: string | null
    is_active: boolean
  }
  operation?: 'create' | 'update' | 'delete' | 'toggle_status'
  validationResult?: {
    valid: boolean
    errors: string[]
  }
}

// Step 1: Validate Category Data
const validateCategoryDataStep: FlowStep = {
  name: 'validate_category_data',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext
    const errors: string[] = []

    if (!categoryContext.category) {
      throw new Error('Category data is required')
    }

    const { name, tenant_id } = categoryContext.category

    // Validation rules
    if (!name || name.trim().length === 0) {
      errors.push('Category name is required')
    }

    if (name && name.length > 255) {
      errors.push('Category name must be less than 255 characters')
    }

    if (!tenant_id) {
      errors.push('Tenant ID is required - categories must belong to a tenant')
    }

    if (errors.length > 0) {
      return {
        ...categoryContext,
        validationResult: {
          valid: false,
          errors
        }
      }
    }

    return {
      ...categoryContext,
      validationResult: {
        valid: true,
        errors: []
      }
    }
  },
  validate: (context: FlowContext) => {
    const categoryContext = context as CategoryFlowContext
    return !!(categoryContext.category && categoryContext.tenant)
  }
}

// Step 2: Check for duplicate category names within tenant
const checkDuplicateCategoryStep: FlowStep = {
  name: 'check_duplicate_category',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    if (categoryContext.operation === 'delete') {
      // Skip duplicate check for delete operations
      return categoryContext
    }

    try {
      const response = await fetch(
        `/api/tenants/${categoryContext.category?.tenant_id}/categories?include_global=false`
      )

      if (response.ok) {
        const categories = await response.json()

        const duplicate = categories.find((c: any) =>
          c.name.toLowerCase() === categoryContext.category?.name.toLowerCase() &&
          c.id !== categoryContext.category?.id && // Allow same name for updates
          c.tenant_id === categoryContext.category?.tenant_id // Only check within same tenant
        )

        if (duplicate) {
          throw new Error(`Una categoría con el nombre "${categoryContext.category?.name}" ya existe en tu negocio`)
        }
      }
    } catch (error: any) {
      if (error.message.includes('ya existe')) {
        throw error
      }
      // Continue if API call fails
      console.warn('Could not check for duplicate categories:', error)
    }

    return categoryContext
  }
}

// Step 3: Validate parent category if specified
const validateParentCategoryStep: FlowStep = {
  name: 'validate_parent_category',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    // Skip if no parent_id or if deleting
    if (!categoryContext.category?.parent_id || categoryContext.operation === 'delete') {
      return categoryContext
    }

    try {
      const response = await fetch(
        `/api/catalog/service-categories/${categoryContext.category.parent_id}`
      )

      if (!response.ok) {
        throw new Error('La categoría padre no existe o no está disponible')
      }

      const parentCategory = await response.json()

      // Verify parent belongs to same tenant or is global
      if (parentCategory.tenant_id &&
          parentCategory.tenant_id !== categoryContext.category.tenant_id) {
        throw new Error('La categoría padre debe pertenecer al mismo negocio')
      }

      // Verify parent is active
      if (!parentCategory.is_active) {
        throw new Error('La categoría padre debe estar activa')
      }

    } catch (error: any) {
      throw new Error(error.message || 'Error validating parent category')
    }

    return categoryContext
  }
}

// Step 4: Create or update category in database
const persistCategoryStep: FlowStep = {
  name: 'persist_category',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    if (!categoryContext.validationResult?.valid && categoryContext.operation !== 'delete') {
      throw new Error('Validation failed: ' + categoryContext.validationResult?.errors.join(', '))
    }

    const { category, operation } = categoryContext

    let response: Response
    let endpoint: string

    switch (operation) {
      case 'create':
        endpoint = `/api/catalog/service-categories`
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category)
        })
        break

      case 'update':
        endpoint = `/api/catalog/service-categories/${category?.id}`
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(category)
        })
        break

      case 'delete':
        endpoint = `/api/catalog/service-categories/${category?.id}`
        response = await fetch(endpoint, {
          method: 'DELETE'
        })
        break

      case 'toggle_status':
        endpoint = `/api/catalog/service-categories/${category?.id}`
        response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: category?.is_active })
        })
        break

      default:
        throw new Error('Invalid operation')
    }

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to persist category')
    }

    const result = operation === 'delete' ? { category } : await response.json()

    console.log(`✅ Category ${operation} successful:`, result.id || category?.id)

    return {
      ...categoryContext,
      category: result
    }
  },
  rollback: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    // Rollback logic based on operation
    if (categoryContext.operation === 'create' && categoryContext.category?.id) {
      console.log('🔄 Rolling back category creation:', categoryContext.category.id)

      try {
        await fetch(
          `/api/catalog/service-categories/${categoryContext.category.id}`,
          { method: 'DELETE' }
        )
      } catch (error) {
        console.error('Rollback failed:', error)
      }
    }

    return categoryContext
  }
}

// Step 5: Check for dependent services
const checkDependentServicesStep: FlowStep = {
  name: 'check_dependent_services',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    // Only check dependencies for delete operations
    if (categoryContext.operation !== 'delete') {
      return categoryContext
    }

    try {
      const response = await fetch(
        `/api/tenants/${categoryContext.category?.tenant_id}/services?category_id=${categoryContext.category?.id}`
      )

      if (response.ok) {
        const data = await response.json()
        const services = data.services || []

        if (services.length > 0) {
          throw new Error(
            `No se puede eliminar esta categoría porque tiene ${services.length} servicio(s) asociado(s). ` +
            `Por favor, reasigna o elimina los servicios primero.`
          )
        }
      }
    } catch (error: any) {
      throw error
    }

    return categoryContext
  }
}

// Step 6: Emit category management event
const emitCategoryEventStep: FlowStep = {
  name: 'emit_category_event',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    // Emit appropriate event based on operation
    switch (categoryContext.operation) {
      case 'create':
        console.log('📁 Nueva categoría creada:', categoryContext.category?.name)
        break
      case 'update':
        console.log('✏️ Categoría actualizada:', categoryContext.category?.name)
        break
      case 'delete':
        console.log('🗑️ Categoría eliminada:', categoryContext.category?.name)
        break
      case 'toggle_status':
        console.log('🔄 Estado de categoría cambiado:', categoryContext.category?.name,
          categoryContext.category?.is_active ? 'activa' : 'inactiva')
        break
    }

    return categoryContext
  }
}

// Step 7: Update cache or notify affected systems
const updateDependenciesStep: FlowStep = {
  name: 'update_dependencies',
  action: async (context: FlowContext): Promise<FlowContext> => {
    const categoryContext = context as CategoryFlowContext

    // Future: Notify affected systems
    // - Update service catalog cache
    // - Notify booking system if services affected
    // - Update search indexes

    console.log('🔗 Dependencies updated for category:', categoryContext.category?.id)

    return categoryContext
  }
}

// Define category management flows
export const createCategoryFlow: BusinessFlow = {
  name: 'category_create',
  steps: [
    validateCategoryDataStep,
    checkDuplicateCategoryStep,
    validateParentCategoryStep,
    persistCategoryStep,
    emitCategoryEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const updateCategoryFlow: BusinessFlow = {
  name: 'category_update',
  steps: [
    validateCategoryDataStep,
    checkDuplicateCategoryStep,
    validateParentCategoryStep,
    persistCategoryStep,
    emitCategoryEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const deleteCategoryFlow: BusinessFlow = {
  name: 'category_delete',
  steps: [
    checkDependentServicesStep, // Check BEFORE deleting
    persistCategoryStep,
    emitCategoryEventStep,
    updateDependenciesStep
  ],
  context: {}
}

export const toggleCategoryStatusFlow: BusinessFlow = {
  name: 'category_toggle_status',
  steps: [
    persistCategoryStep,
    emitCategoryEventStep,
    updateDependenciesStep
  ],
  context: {}
}

// Register all flows
flowEngine.registerFlow(createCategoryFlow)
flowEngine.registerFlow(updateCategoryFlow)
flowEngine.registerFlow(deleteCategoryFlow)
flowEngine.registerFlow(toggleCategoryStatusFlow)

// Export helper function to execute category flows
export async function executeCategoryFlow(
  operation: 'create' | 'update' | 'delete' | 'toggle_status',
  categoryData: any,
  tenantId: string
): Promise<any> {
  const flowName = `category_${operation}`

  const context: CategoryFlowContext = {
    category: {
      ...categoryData,
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
    console.error(`Category ${operation} flow failed:`, error.message)
    throw error
  }
}
