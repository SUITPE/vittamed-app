/**
 * UpgradePrompt - Componente para mostrar UI de upgrade cuando una feature está bloqueada
 *
 * Muestra un mensaje claro indicando que la feature no está disponible en el plan actual
 * y ofrece CTAs para ver planes o contactar ventas.
 *
 * @example
 * <UpgradePrompt
 *   feature="Historias Clínicas"
 *   requiredPlan="care"
 *   description="Registra y gestiona las historias clínicas de tus pacientes"
 * />
 */

'use client'

import { PlanKey } from '@/constants/pricing'
import Link from 'next/link'
import { Lock, Zap, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface UpgradePromptProps {
  /** Nombre de la feature bloqueada */
  feature: string

  /** Plan mínimo requerido para acceder */
  requiredPlan: PlanKey

  /** Descripción opcional de la feature */
  description?: string

  /** Variante de diseño: 'default' | 'compact' | 'banner' */
  variant?: 'default' | 'compact' | 'banner'
}

const PLAN_NAMES: Record<PlanKey, string> = {
  free: 'Free',
  care: 'Care',
  pro: 'Pro',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<PlanKey, string> = {
  free: 'bg-gray-100 text-gray-700',
  care: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

export function UpgradePrompt({
  feature,
  requiredPlan,
  description,
  variant = 'default',
}: UpgradePromptProps) {
  if (variant === 'banner') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 rounded-r-lg"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-full p-2">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {feature} disponible en el plan{' '}
                <span className="font-bold text-blue-600">
                  {PLAN_NAMES[requiredPlan]}
                </span>
              </p>
              {description && (
                <p className="text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
          <Link
            href="/pricing"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center gap-2"
          >
            Ver Planes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.div>
    )
  }

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center"
      >
        <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-700 mb-3">
          Disponible en el plan{' '}
          <span className="font-bold text-blue-600">
            {PLAN_NAMES[requiredPlan]}
          </span>
        </p>
        <Link
          href="/pricing"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
        >
          Ver Planes
        </Link>
      </motion.div>
    )
  }

  // Variante default
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center shadow-sm"
    >
      {/* Ícono de feature bloqueada */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          <div className="bg-blue-500 rounded-full p-4">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md">
            <Lock className="h-5 w-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Título */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {feature} no está disponible en tu plan
      </h3>

      {/* Descripción */}
      {description && (
        <p className="text-gray-600 mb-4 max-w-md mx-auto">{description}</p>
      )}

      {/* Badge del plan requerido */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <p className="text-gray-700">Actualiza a</p>
        <span
          className={`${PLAN_COLORS[requiredPlan]} px-4 py-1 rounded-full text-sm font-bold`}
        >
          {PLAN_NAMES[requiredPlan]}
        </span>
        <p className="text-gray-700">para desbloquear</p>
      </div>

      {/* CTAs */}
      <div className="flex gap-3 justify-center flex-wrap">
        <Link
          href="/pricing"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          Ver Planes y Precios
          <ArrowRight className="h-5 w-5" />
        </Link>

        {requiredPlan === 'enterprise' && (
          <Link
            href="/contacto?plan=enterprise"
            className="bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium"
          >
            Contactar Ventas
          </Link>
        )}
      </div>

      {/* Mensaje adicional */}
      <p className="text-xs text-gray-500 mt-6">
        Puedes cambiar de plan en cualquier momento desde tu configuración
      </p>
    </motion.div>
  )
}
