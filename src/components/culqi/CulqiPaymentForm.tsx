'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Lock, AlertCircle } from 'lucide-react'
import { initializeCulqi, configureCulqi, formatAmountForCulqi, formatCurrency, CULQI_TEST_CARDS } from '@/lib/culqi'

export interface CulqiPaymentFormProps {
  planName: string
  amount: number // En soles (ej: 39.00)
  onSuccess: (token: string) => void
  onError: (error: string) => void
  onCancel?: () => void
}

/**
 * CulqiPaymentForm - Componente de formulario de pago con Culqi
 *
 * @param planName - Nombre del plan (ej: "Care", "Pro")
 * @param amount - Monto en soles (ej: 39.00)
 * @param onSuccess - Callback cuando se obtiene token exitosamente
 * @param onError - Callback cuando hay error
 * @param onCancel - Callback opcional cuando se cancela
 */
export default function CulqiPaymentForm({
  planName,
  amount,
  onSuccess,
  onError,
  onCancel,
}: CulqiPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [culqiReady, setCulqiReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTestCards, setShowTestCards] = useState(false)

  // Inicializar Culqi cuando el script esté cargado
  useEffect(() => {
    const checkCulqi = () => {
      if (typeof window !== 'undefined' && window.Culqi) {
        const initialized = initializeCulqi()
        if (initialized) {
          setCulqiReady(true)
          setupCulqiCallback()
        }
      } else {
        // Retry after a short delay
        setTimeout(checkCulqi, 100)
      }
    }

    checkCulqi()
  }, [])

  // Configurar callback global de Culqi
  const setupCulqiCallback = () => {
    // @ts-ignore - Culqi callback global
    window.culqi = function () {
      if (window.Culqi.token) {
        const token = window.Culqi.token.id
        console.log('✅ Token de Culqi recibido:', token)
        setIsProcessing(false)
        onSuccess(token)
      } else if (window.Culqi.error) {
        const errorMsg = window.Culqi.error.user_message || 'Error al procesar el pago'
        console.error('❌ Error de Culqi:', window.Culqi.error)
        setError(errorMsg)
        setIsProcessing(false)
        onError(errorMsg)
      }
    }
  }

  const handlePayment = () => {
    if (!culqiReady) {
      const errorMsg = 'Sistema de pagos no está listo. Por favor recarga la página.'
      setError(errorMsg)
      onError(errorMsg)
      return
    }

    setError(null)
    setIsProcessing(true)

    try {
      // Configurar Culqi con los datos del pago
      configureCulqi({
        title: 'VittaSami',
        currency: 'PEN',
        description: `Plan ${planName}`,
        amount: formatAmountForCulqi(amount),
      })

      // Abrir modal de Culqi
      window.Culqi.open()

      // Reset processing state if user closes modal without completing
      setTimeout(() => {
        if (isProcessing && !window.Culqi.token && !window.Culqi.error) {
          setIsProcessing(false)
        }
      }, 60000) // 1 minuto timeout
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al abrir el formulario de pago'
      setError(errorMsg)
      setIsProcessing(false)
      onError(errorMsg)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#40C9C6]/20 to-[#A6E3A1]/20 mb-4">
          <CreditCard className="w-8 h-8 text-[#40C9C6]" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Información de Pago
        </h3>
        <p className="text-gray-600">
          Completa tu suscripción al plan {planName}
        </p>
      </div>

      {/* Payment Summary */}
      <div className="bg-gradient-to-br from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-xl p-6 mb-6 border border-[#40C9C6]/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-700 font-medium">Plan {planName}</span>
          <span className="text-2xl font-bold text-gray-900">{formatCurrency(amount)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Pago seguro procesado por Culqi</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error en el pago</p>
            <p className="text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Test Cards Info (Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowTestCards(!showTestCards)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
          >
            {showTestCards ? '🔽' : '▶'} Tarjetas de prueba
          </button>

          {showTestCards && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs space-y-2"
            >
              <div className="font-semibold text-blue-900 mb-2">Tarjetas de prueba de Culqi:</div>

              <div className="bg-white rounded p-2">
                <div className="font-medium text-blue-900">✅ Visa Exitosa</div>
                <button
                  onClick={() => copyToClipboard(CULQI_TEST_CARDS.visa.number)}
                  className="text-gray-700 hover:text-blue-600 font-mono"
                >
                  {CULQI_TEST_CARDS.visa.number}
                </button>
                <div className="text-gray-600">CVV: {CULQI_TEST_CARDS.visa.cvv} | Exp: {CULQI_TEST_CARDS.visa.expiration}</div>
              </div>

              <div className="bg-white rounded p-2">
                <div className="font-medium text-blue-900">✅ Mastercard Exitosa</div>
                <button
                  onClick={() => copyToClipboard(CULQI_TEST_CARDS.mastercard.number)}
                  className="text-gray-700 hover:text-blue-600 font-mono"
                >
                  {CULQI_TEST_CARDS.mastercard.number}
                </button>
                <div className="text-gray-600">CVV: {CULQI_TEST_CARDS.mastercard.cvv} | Exp: {CULQI_TEST_CARDS.mastercard.expiration}</div>
              </div>

              <div className="bg-white rounded p-2">
                <div className="font-medium text-red-900">❌ Tarjeta Rechazada (para testing)</div>
                <button
                  onClick={() => copyToClipboard(CULQI_TEST_CARDS.declined.number)}
                  className="text-gray-700 hover:text-blue-600 font-mono"
                >
                  {CULQI_TEST_CARDS.declined.number}
                </button>
                <div className="text-gray-600">CVV: {CULQI_TEST_CARDS.declined.cvv} | Exp: {CULQI_TEST_CARDS.declined.expiration}</div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Payment Button */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={!culqiReady || isProcessing}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      >
        {!culqiReady ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Cargando sistema de pagos...
          </>
        ) : isProcessing ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Procesando...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Pagar {formatCurrency(amount)}
          </>
        )}
      </button>

      {/* Cancel Button */}
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="w-full mt-3 px-6 py-3 rounded-xl font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Cancelar
        </button>
      )}

      {/* Security Notice */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start gap-3 text-xs text-gray-600">
          <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
          <div>
            <p className="font-semibold text-gray-700">Pago 100% seguro</p>
            <p>
              Tus datos están protegidos con encriptación SSL. No almacenamos información de tarjetas.
              El procesamiento es realizado por Culqi, certificado PCI-DSS.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
