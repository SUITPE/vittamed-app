'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'
import Link from 'next/link'

/**
 * Contenido de la página de error (usa searchParams)
 */
function CheckoutErrorContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const errorMessage = searchParams.get('message') || 'Ocurrió un error al procesar el pago'
  const errorCode = searchParams.get('code')

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-6"
          >
            <XCircle className="w-12 h-12 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Error en el Pago
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-6"
          >
            No pudimos procesar tu pago
          </motion.p>

          {/* Error Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mb-6 text-left"
          >
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 mb-2">Detalles del error:</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
                {errorCode && (
                  <p className="text-xs text-red-600 mt-2">Código: {errorCode}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Common Issues */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gray-50 rounded-xl p-6 mb-6 text-left"
          >
            <p className="font-semibold text-gray-900 mb-3">Causas comunes:</p>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Fondos insuficientes en la tarjeta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Datos de la tarjeta incorrectos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Tarjeta vencida o bloqueada</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400 mt-1">•</span>
                <span>Límite de compras en línea excedido</span>
              </li>
            </ul>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="space-y-3"
          >
            <button
              onClick={() => router.back()}
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] hover:shadow-xl transition-all transform hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
              Intentar de Nuevo
            </button>

            <Link
              href="/admin/create-tenant"
              className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all"
            >
              Volver al Inicio
            </Link>
          </motion.div>

          {/* Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <p className="text-xs text-gray-500 mb-2">
              ¿Necesitas ayuda? Contáctanos:
            </p>
            <div className="flex items-center justify-center gap-4 text-xs">
              <a href="mailto:soporte@vittasami.com" className="text-[#40C9C6] hover:underline">
                soporte@vittasami.com
              </a>
              <span className="text-gray-300">|</span>
              <a href="https://wa.me/51999999999" className="text-[#40C9C6] hover:underline">
                WhatsApp
              </a>
            </div>
          </motion.div>

          {/* Note about Free Plan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl"
          >
            <p className="text-xs text-blue-800">
              <strong>💡 Recuerda:</strong> Puedes empezar con el plan Free (sin pago) y actualizar cuando quieras.
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

/**
 * Página de error después de un pago fallido con Culqi
 * Wrapped in Suspense boundary for useSearchParams()
 */
export default function CheckoutErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <CheckoutErrorContent />
    </Suspense>
  )
}
