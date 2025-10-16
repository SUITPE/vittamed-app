'use client'

import { useState, useEffect } from 'react'
import { BusinessType, BUSINESS_TYPE_CONFIGS, BusinessCategory, BUSINESS_CATEGORIES } from '@/types/business'
import { TenantTypeSelectionFlow } from '@/flows/TenantTypeSelectionFlow'
import { Search, Check } from 'lucide-react'

interface BusinessTypeSelectorProps {
  value: BusinessType
  onChange: (type: BusinessType) => void
}

export default function BusinessTypeSelector({ value, onChange }: BusinessTypeSelectorProps) {
  const [flow] = useState(() => new TenantTypeSelectionFlow())
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | undefined>()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTypes, setFilteredTypes] = useState<BusinessType[]>([])

  useEffect(() => {
    // Initialize flow
    flow.start({}).then(() => {
      setFilteredTypes(flow.getFilteredTypes())
    })
  }, [flow])

  const handleCategoryClick = async (category: BusinessCategory | undefined) => {
    setSelectedCategory(category)
    await flow.selectCategory(category)
    setFilteredTypes(flow.getFilteredTypes())
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    await flow.searchTypes(query)
    setFilteredTypes(flow.getFilteredTypes())
  }

  const handleTypeSelect = async (type: BusinessType) => {
    await flow.selectType(type)
    onChange(type)
  }

  const categoryLabels: Record<BusinessCategory | 'all', { label: string; icon: string }> = {
    all: { label: 'Todos', icon: '🏢' },
    medical: { label: 'Médico', icon: '🏥' },
    wellness: { label: 'Bienestar', icon: '🧘‍♀️' },
    beauty: { label: 'Belleza', icon: '💇‍♀️' },
    specialty: { label: 'Especializado', icon: '🔬' },
    veterinary: { label: 'Veterinaria', icon: '🐕' }
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar tipo de negocio..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryClick(undefined)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selectedCategory === undefined
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {categoryLabels.all.icon} {categoryLabels.all.label}
        </button>
        {BUSINESS_CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {categoryLabels[category].icon} {categoryLabels[category].label}
          </button>
        ))}
      </div>

      {/* Business Type Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {filteredTypes.map((type) => {
          const config = BUSINESS_TYPE_CONFIGS[type]
          const isSelected = value === type

          return (
            <button
              key={type}
              onClick={() => handleTypeSelect(type)}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              {/* Selected Check Mark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Icon and Title */}
              <div className="flex items-start gap-3">
                <div className="text-3xl flex-shrink-0">{config.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {config.label}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                    {config.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      ⏱️ {config.settings.default_appointment_duration} min
                    </span>
                    {config.settings.requires_insurance && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        isSelected ? 'bg-green-100 text-green-700' : 'bg-green-50 text-green-600'
                      }`}>
                        ✓ Seguros
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* No Results */}
      {filteredTypes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg mb-2">🔍</p>
          <p className="text-sm">No se encontraron tipos de negocio</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedCategory(undefined)
              handleCategoryClick(undefined)
            }}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  )
}
