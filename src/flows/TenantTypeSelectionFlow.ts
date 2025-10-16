/**
 * Tenant Type Selection Flow
 *
 * Business flow for selecting tenant business type with modern UI
 */

import { BusinessType, BUSINESS_TYPE_CONFIGS, BusinessCategory } from '@/types/business'

export interface TenantTypeSelectionState {
  selectedCategory?: BusinessCategory
  selectedType?: BusinessType
  searchQuery: string
  filteredTypes: BusinessType[]
}

/**
 * TenantTypeSelectionFlow - Manages business type selection logic
 * Provides filtering, search, and selection capabilities
 */
export class TenantTypeSelectionFlow {
  private state: TenantTypeSelectionState

  constructor() {
    // Initialize with all types
    const allTypes = Object.keys(BUSINESS_TYPE_CONFIGS) as BusinessType[]
    this.state = {
      searchQuery: '',
      filteredTypes: allTypes,
      selectedType: undefined,
      selectedCategory: undefined
    }
  }

  /**
   * Start the flow with initial state
   */
  async start(initialState: Partial<TenantTypeSelectionState> = {}) {
    this.state = {
      ...this.state,
      ...initialState
    }
    return this.state
  }

  /**
   * Select a category and filter types
   */
  async selectCategory(category: BusinessCategory | undefined) {
    this.state.selectedCategory = category

    // Filter types by category
    this.state.filteredTypes = category
      ? (Object.entries(BUSINESS_TYPE_CONFIGS)
          .filter(([_, config]) => config.category === category)
          .map(([type]) => type as BusinessType))
      : (Object.keys(BUSINESS_TYPE_CONFIGS) as BusinessType[])

    // Reapply search if exists
    if (this.state.searchQuery) {
      this.applySearch()
    }

    return this.state
  }

  /**
   * Search types by query
   */
  async searchTypes(query: string) {
    this.state.searchQuery = query
    this.applySearch()
    return this.state
  }

  /**
   * Apply search filter to current filtered types
   */
  private applySearch() {
    const query = this.state.searchQuery.toLowerCase()

    // Get base types (all or filtered by category)
    let baseTypes = this.state.selectedCategory
      ? (Object.entries(BUSINESS_TYPE_CONFIGS)
          .filter(([_, config]) => config.category === this.state.selectedCategory)
          .map(([type]) => type as BusinessType))
      : (Object.keys(BUSINESS_TYPE_CONFIGS) as BusinessType[])

    // Apply search filter
    this.state.filteredTypes = query.length > 0
      ? baseTypes.filter(type => {
          const config = BUSINESS_TYPE_CONFIGS[type]
          return (
            config.label.toLowerCase().includes(query) ||
            config.description.toLowerCase().includes(query)
          )
        })
      : baseTypes
  }

  /**
   * Select a business type
   */
  async selectType(type: BusinessType) {
    this.state.selectedType = type
    return this.state
  }

  /**
   * Get filtered types
   */
  getFilteredTypes(): BusinessType[] {
    return this.state.filteredTypes
  }

  /**
   * Get selected type configuration
   */
  getSelectedTypeConfig() {
    return this.state.selectedType
      ? BUSINESS_TYPE_CONFIGS[this.state.selectedType]
      : null
  }

  /**
   * Get current state
   */
  getState(): TenantTypeSelectionState {
    return { ...this.state }
  }

  /**
   * Validate that a type is selected
   */
  validate(): boolean {
    return !!this.state.selectedType
  }
}
