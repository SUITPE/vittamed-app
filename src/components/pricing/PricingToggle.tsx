'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface PricingToggleProps {
  isAnnual: boolean
  onToggle: (isAnnual: boolean) => void
  className?: string
}

export function PricingToggle({ isAnnual, onToggle, className }: PricingToggleProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <button
        onClick={() => onToggle(false)}
        className={cn(
          'text-base font-medium transition-colors',
          !isAnnual ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        Mensual
      </button>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(!isAnnual)}
        className={cn(
          'relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#40C9C6] focus:ring-offset-2',
          isAnnual ? 'bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1]' : 'bg-gray-300'
        )}
        role="switch"
        aria-checked={isAnnual}
        aria-label="Toggle between monthly and annual pricing"
      >
        <motion.span
          className="inline-block h-6 w-6 transform rounded-full bg-white shadow-lg"
          initial={false}
          animate={{
            x: isAnnual ? 30 : 4,
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(true)}
          className={cn(
            'text-base font-medium transition-colors',
            isAnnual ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Anual
        </button>
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
          Ahorra 15%
        </Badge>
      </div>
    </div>
  )
}
