'use client'

import { Check, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PricingPlan } from '@/constants/pricing'

interface PlanSelectorCardProps {
  plan: PricingPlan
  isSelected: boolean
  isAnnual: boolean
  onSelect: () => void
}

export default function PlanSelectorCard({
  plan,
  isSelected,
  isAnnual,
  onSelect
}: PlanSelectorCardProps) {
  const price = isAnnual ? plan.price.annual : plan.price.monthly
  const isFreePlan = plan.price.monthly === 0

  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={`plan-card-${plan.id}`}
      className={`
        relative p-6 rounded-2xl text-left transition-all
        transform hover:scale-[1.02] hover:shadow-lg
        ${isSelected
          ? 'bg-gradient-to-br from-[#40C9C6]/10 to-[#A6E3A1]/10 border-2 border-[#40C9C6] shadow-xl'
          : 'bg-white border-2 border-gray-200 hover:border-[#40C9C6]/30'
        }
      `}
    >
      {/* Popular Badge - Top Right */}
      {plan.popular && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Más Popular
        </div>
      )}

      {/* Selected Checkmark - Top Left */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-br from-[#40C9C6] to-[#A6E3A1] rounded-full flex items-center justify-center shadow-lg"
        >
          <Check className="w-5 h-5 text-white stroke-[3]" />
        </motion.div>
      )}

      {/* Plan Name & Tagline */}
      <div className="mb-4">
        <h4 className={`text-xl font-bold mb-1 transition-colors ${
          isSelected ? 'text-[#40C9C6]' : 'text-gray-900'
        }`}>
          {plan.name}
        </h4>
        <p className="text-sm text-gray-600">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-4">
        {isFreePlan ? (
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">Gratis</span>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">${price}</span>
              <span className="ml-1 text-gray-600 text-base">/mes</span>
            </div>
            {isAnnual && (
              <p className="text-xs text-[#40C9C6] font-medium mt-1">
                Ahorra 15% vs. mensual
              </p>
            )}
          </>
        )}
      </div>

      {/* Features (max 6) */}
      <ul className="space-y-2 mb-4">
        {plan.features.slice(0, 6).map((feature, index) => (
          <li key={index} className="flex items-start text-xs">
            <Check className="h-4 w-4 text-[#40C9C6] mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
        {plan.features.length > 6 && (
          <li className="text-xs text-gray-500 italic">
            + {plan.features.length - 6} features más
          </li>
        )}
      </ul>

      {/* Ideal For (Bottom section) */}
      <div className={`
        text-xs mt-4 pt-4 border-t transition-colors
        ${isSelected
          ? 'border-[#40C9C6]/20 text-gray-700'
          : 'border-gray-200 text-gray-500'
        }
      `}>
        <span className="font-semibold">Ideal para:</span> {plan.idealFor}
      </div>

      {/* Free Plan Note */}
      {isFreePlan && (
        <div className="mt-3 text-xs text-center text-gray-500">
          Sin tarjeta de crédito requerida
        </div>
      )}

      {/* Enterprise Note */}
      {plan.enterprise && (
        <div className="mt-3 text-xs text-center text-gray-600">
          💼 Incluye onboarding personalizado
        </div>
      )}
    </button>
  )
}
