'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Icons } from './Icons'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  value: string // YYYY-MM-DD format
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: string
  maxDate?: string
}

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const dayOfWeek = DAYS_ES[date.getDay()]
  const monthName = MONTHS_ES[date.getMonth()]

  return `${dayOfWeek}, ${day} ${monthName} ${year}`
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

/**
 * DatePicker - A beautiful calendar dropdown component
 *
 * Features:
 * - Custom calendar UI with VittaSami styling
 * - Month/year navigation
 * - Today button
 * - Smooth animations
 * - Keyboard accessible
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Seleccionar fecha...',
  className,
  disabled = false,
  minDate,
  maxDate
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Parse current value or use today
  const today = new Date()
  const selectedDate = value ? (() => {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  })() : null

  // Calendar view state
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() || today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selectedDate?.getMonth() || today.getMonth())

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Update view when value changes
  useEffect(() => {
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear())
      setViewMonth(selectedDate.getMonth())
    }
  }, [value])

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectDate = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day)
    const dateStr = getLocalDateString(newDate)

    // Check min/max constraints
    if (minDate && dateStr < minDate) return
    if (maxDate && dateStr > maxDate) return

    onChange(dateStr)
    setIsOpen(false)
  }

  const handleToday = () => {
    const todayStr = getLocalDateString(today)
    onChange(todayStr)
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
    setIsOpen(false)
  }

  const isDateDisabled = (day: number): boolean => {
    const dateStr = getLocalDateString(new Date(viewYear, viewMonth, day))
    if (minDate && dateStr < minDate) return true
    if (maxDate && dateStr > maxDate) return true
    return false
  }

  const isToday = (day: number): boolean => {
    return (
      viewYear === today.getFullYear() &&
      viewMonth === today.getMonth() &&
      day === today.getDate()
    )
  }

  const isSelected = (day: number): boolean => {
    if (!selectedDate) return false
    return (
      viewYear === selectedDate.getFullYear() &&
      viewMonth === selectedDate.getMonth() &&
      day === selectedDate.getDate()
    )
  }

  // Generate calendar days
  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const days: (number | null)[] = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Add the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "w-full px-4 py-3 text-left bg-white border rounded-xl transition-all duration-200",
          "flex items-center justify-between gap-2",
          "focus:outline-none focus:ring-2 focus:ring-primary-400/20 focus:border-primary-400",
          isOpen && "ring-2 ring-primary-400/20 border-primary-400",
          disabled
            ? "bg-gray-50 cursor-not-allowed opacity-60"
            : "hover:border-primary-400/50 cursor-pointer",
          !isOpen && "border-gray-200"
        )}
      >
        <div className="flex items-center gap-3">
          <Icons.calendar className="w-5 h-5 text-primary-400" />
          <span className={value ? "text-primary-800 font-medium" : "text-gray-400"}>
            {value ? formatDateDisplay(value) : placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Icons.chevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Calendar Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 w-80 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            {/* Header with navigation */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icons.chevronLeft className="w-5 h-5 text-gray-600" />
              </button>

              <h3 className="text-lg font-semibold text-primary-800">
                {MONTHS_ES[viewMonth]} {viewYear}
              </h3>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Icons.chevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 p-2 bg-gray-50">
              {DAYS_ES.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 p-2">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day !== null && (
                    <button
                      type="button"
                      onClick={() => handleSelectDate(day)}
                      disabled={isDateDisabled(day)}
                      className={cn(
                        "w-full h-full rounded-lg text-sm font-medium transition-all duration-150",
                        "flex items-center justify-center",
                        isDateDisabled(day) && "opacity-30 cursor-not-allowed",
                        !isDateDisabled(day) && "hover:bg-primary-400/10 cursor-pointer",
                        isToday(day) && !isSelected(day) && "border-2 border-primary-400/50",
                        isSelected(day)
                          ? "bg-primary-400 text-white hover:bg-primary-500"
                          : "text-primary-800"
                      )}
                    >
                      {day}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer with Today button */}
            <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={handleToday}
                className="px-4 py-2 text-sm font-medium text-primary-400 hover:bg-primary-400/10 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DatePicker
