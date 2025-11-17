'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

/**
 * Contenido de la página de éxito (usa searchParams)
 */
function CheckoutSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const tenantId = searchParams.get('tenant_id')
  const planName = searchParams.get('plan')
  const amount = searchParams.get('amount')

  useEffect(() => {
    // Countdown para redirección automática
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (tenantId) {
            router.push(`/dashboard/${tenantId}`)
          } else {
            router.push('/dashboard')
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router, tenantId])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            ¡Pago Exitoso!
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-[#40C9C6]" />
            <span className="text-sm font-semibold text-gray-700">
              Tu negocio está listo
            </span>
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-xl p-6 mb-6 border border-[#40C9C6]/20"
          >
            <p className="text-gray-600 mb-4">
              Tu suscripción ha sido procesada exitosamente
            </p>

            {planName && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Plan:</span>
                <span className="text-sm font-semibold text-gray-900">{planName}</span>
              </div>
            )}

            {amount && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monto:</span>
                <span className="text-sm font-semibold text-gray-900">
                  S/ {(parseFloat(amount) / 100).toFixed(2)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-6"
          >
            Serás redirigido a tu dashboard en {countdown} segundos...
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Link
              href={tenantId ? `/dashboard/${tenantId}` : '/dashboard'}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] hover:shadow-xl transition-all transform hover:scale-105"
            >
              Ir al Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <p className="text-xs text-gray-500">
              Recibirás un email de confirmación con los detalles de tu suscripción.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Página de éxito después de un pago exitoso con Culqi
 * Wrapped in Suspense boundary for useSearchParams()
 */
export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}
