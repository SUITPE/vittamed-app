'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'

export function InvestorCTA() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch('/api/contact-investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, message }),
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
        setName('')
        setMessage('')
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('error')
    }
  }

  return (
    <Card className="border-2 border-[#40C9C6]">
      <CardHeader className="text-center pb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl">Solicita nuestro Pitch Deck completo</CardTitle>
        <p className="text-gray-600 mt-2">
          Envíanos tus datos y te compartiremos información detallada sobre la oportunidad de
          inversión.
        </p>
      </CardHeader>

      <CardContent>
        {status === 'success' ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Gracias por tu interés!
            </h3>
            <p className="text-gray-600">
              Te enviaremos el pitch deck a tu correo en las próximas horas.
            </p>
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Error al enviar</h3>
            <p className="text-gray-600 mb-4">
              Hubo un problema al procesar tu solicitud. Por favor, intenta nuevamente.
            </p>
            <Button onClick={() => setStatus('idle')} variant="outline">
              Reintentar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                required
                disabled={status === 'loading'}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                disabled={status === 'loading'}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje (opcional)
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Cuéntanos sobre tu fondo o interés en invertir..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#40C9C6] focus:border-transparent"
                disabled={status === 'loading'}
              />
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary text-white border-0"
              size="lg"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Solicitar Pitch Deck
                </>
              )}
            </Button>

            <p className="text-xs text-center text-gray-500 mt-4">
              También puedes escribirnos directamente a:{' '}
              <a
                href="mailto:alvaro@abp.pe"
                className="text-[#40C9C6] hover:underline font-medium"
              >
                alvaro@abp.pe
              </a>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
