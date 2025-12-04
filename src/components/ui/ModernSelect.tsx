'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from './Icons'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  sublabel?: string
  icon?: ReactNode
  avatar?: string
  disabled?: boolean
}

interface ModernSelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  renderOption?: (option: SelectOption) => ReactNode
}

/**
 * ModernSelect - A beautiful, searchable dropdown component
 *
 * Features:
 * - Search/filter functionality
 * - Custom option rendering (avatars, icons, sublabels)
 * - Keyboard navigation
 * - Smooth animations with Framer Motion
 * - VittaSami brand colors
 * - Accessible (ARIA labels)
 */
export function ModernSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  searchable = false,
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  className,
  disabled = false,
  renderOption
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Find selected option
  const selectedOption = options.find(opt => opt.value === value)

  // Filter options based on search
  const filteredOptions = searchable && search
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase()) ||
        opt.sublabel?.toLowerCase().includes(search.toLowerCase())
      )
    : options

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, searchable])

  // Reset highlight when search changes
  useEffect(() => {
    setHighlightedIndex(0)
  }, [search])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedItem = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (isOpen && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        } else {
          setIsOpen(true)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setSearch('')
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev)
        }
        break
      case 'Tab':
        setIsOpen(false)
        setSearch('')
        break
    }
  }

  const handleSelect = (optionValue: string) => {
    const option = options.find(opt => opt.value === optionValue)
    if (option?.disabled) return

    onChange(optionValue)
    setIsOpen(false)
    setSearch('')
  }

  const defaultRenderOption = (option: SelectOption) => (
    <div className="flex items-center gap-3">
      {option.avatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#40C9C6] to-[#33a19e] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
          {option.avatar}
        </div>
      )}
      {option.icon && (
        <div className="text-gray-400 flex-shrink-0">
          {option.icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[#003A47] truncate">{option.label}</p>
        {option.sublabel && (
          <p className="text-xs text-gray-500 truncate">{option.sublabel}</p>
        )}
      </div>
    </div>
  )

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 text-left bg-white border rounded-xl transition-all duration-200",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-[#40C9C6]/20 focus:border-[#40C9C6]",
          isOpen && "ring-2 ring-[#40C9C6]/20 border-[#40C9C6]",
          disabled
            ? "bg-gray-50 cursor-not-allowed opacity-60"
            : "hover:border-[#40C9C6]/50 cursor-pointer",
          !isOpen && "border-gray-200"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex-1 min-w-0">
          {selectedOption ? (
            renderOption ? renderOption(selectedOption) : defaultRenderOption(selectedOption)
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icons.chevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Search Input */}
            {searchable && (
              <div className="p-3 border-b border-gray-100">
                <div className="relative">
                  <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-[#40C9C6]/20 focus:border-[#40C9C6]
                             placeholder:text-gray-400"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <ul
              ref={listRef}
              className="max-h-64 overflow-y-auto py-2"
              role="listbox"
            >
              {filteredOptions.length === 0 ? (
                <li className="px-4 py-3 text-sm text-gray-500 text-center">
                  {emptyMessage}
                </li>
              ) : (
                filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors duration-100 relative",
                      option.disabled && "opacity-50 cursor-not-allowed",
                      !option.disabled && index === highlightedIndex && "bg-[#40C9C6]/10",
                      !option.disabled && option.value === value && "bg-[#40C9C6]/5",
                      !option.disabled && "hover:bg-[#40C9C6]/10"
                    )}
                  >
                    {renderOption ? renderOption(option) : defaultRenderOption(option)}

                    {/* Check mark for selected */}
                    {option.value === value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute right-4 top-1/2 -translate-y-1/2"
                      >
                        <Icons.check className="w-4 h-4 text-[#40C9C6]" />
                      </motion.div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * DoctorSelect - Pre-configured ModernSelect for doctor selection
 */
interface Doctor {
  id: string
  first_name: string
  last_name: string
  specialty?: string
}

interface DoctorSelectProps {
  value: string
  onChange: (value: string) => void
  doctors: Doctor[]
  showAllOption?: boolean
  allOptionLabel?: string
  className?: string
  disabled?: boolean
}

export function DoctorSelect({
  value,
  onChange,
  doctors,
  showAllOption = true,
  allOptionLabel = 'Todos los doctores',
  className,
  disabled
}: DoctorSelectProps) {
  const options: SelectOption[] = [
    ...(showAllOption ? [{
      value: '',
      label: allOptionLabel,
      icon: <Icons.users className="w-5 h-5" />
    }] : []),
    ...doctors.map(doctor => ({
      value: doctor.id,
      label: `Dr. ${doctor.first_name} ${doctor.last_name}`,
      sublabel: doctor.specialty || 'Médico general',
      avatar: `${doctor.first_name[0]}${doctor.last_name[0]}`
    }))
  ]

  return (
    <ModernSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="Seleccionar doctor..."
      searchable={doctors.length > 5}
      searchPlaceholder="Buscar doctor..."
      emptyMessage="No se encontró el doctor"
      className={className}
      disabled={disabled}
    />
  )
}

export default ModernSelect
