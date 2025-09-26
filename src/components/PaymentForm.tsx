'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  appointmentId: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ appointmentId, amount, onSuccess, onError }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          amount
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error creating payment')
      }

      const { clientSecret } = await response.json()

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
      })

      if (error) {
        onError(error.message || 'Error processing payment')
      } else {
        onSuccess()
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-2">Resumen del Pago</h3>
        <div className="flex justify-between">
          <span>Total a pagar:</span>
          <span className="font-bold">${amount} MXN</span>
        </div>
      </div>

      <div className="space-y-4">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? 'Procesando...' : `Pagar $${amount} MXN`}
      </button>
    </form>
  )
}

export default function PaymentForm(props: PaymentFormProps) {
  const options = {
    mode: 'payment' as const,
    amount: Math.round(props.amount * 100),
    currency: 'mxn',
    appearance: {
      theme: 'stripe' as const,
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  )
}