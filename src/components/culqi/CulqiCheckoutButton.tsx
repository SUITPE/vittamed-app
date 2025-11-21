'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, X } from 'lucide-react'
import CulqiPaymentForm from './CulqiPaymentForm'

export interface CulqiCheckoutButtonProps {
  planName: string
  amount: number
  onSuccess: (token: string) => void
  onError: (error: string) => void
  buttonText?: string
  disabled?: boolean
}

/**
 * CulqiCheckoutButton - Botón que abre modal con formulario de pago
 *
 * @param planName - Nombre del plan
 * @param amount - Monto en soles
 * @param onSuccess - Callback con token de pago
 * @param onError - Callback con error
 * @param buttonText - Texto del botón (opcional)
 * @param disabled - Si está deshabilitado
 */
export default function CulqiCheckoutButton({
  planName,
  amount,
  onSuccess,
  onError,
  buttonText,
  disabled = false,
}: CulqiCheckoutButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = (token: string) => {
    setShowModal(false)
    onSuccess(token)
  }

  const handleError = (error: string) => {
    // Keep modal open to show error
    onError(error)
  }

  const handleCancel = () => {
    setShowModal(false)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
      >
        <CreditCard className="w-5 h-5" />
        {buttonText || 'Continuar al Pago'}
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              // Close modal if clicking backdrop
              if (e.target === e.currentTarget) {
                handleCancel()
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCancel}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>

              {/* Payment Form */}
              <CulqiPaymentForm
                planName={planName}
                amount={amount}
                onSuccess={handleSuccess}
                onError={handleError}
                onCancel={handleCancel}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
