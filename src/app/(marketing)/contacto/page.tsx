'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MessageCircle, Send } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
// GradientText available for future use
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ContactoPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with email service
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Heading level="h1" gradient="primary" className="mb-6">
              Conversemos
            </Heading>
            <p className="text-xl text-gray-600">
              Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos pronto
            </p>
          </motion.div>
        </div>
      </Section>

      <Section spacing="lg" background="white">
        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <Card className="card-hover">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Envíanos un mensaje</h3>

                {submitted ? (
                  <div className="bg-[#40C9C6]/10 border-2 border-[#40C9C6]/30 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#40C9C6] flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-[#003A47] font-semibold mb-2">¡Gracias por contactarnos! 🎉</h4>
                    <p className="text-gray-600">Te responderemos a la brevedad</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#40C9C6] focus:ring-2 focus:ring-[#40C9C6]/20 outline-none transition-all"
                        placeholder="Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#40C9C6] focus:ring-2 focus:ring-[#40C9C6]/20 outline-none transition-all"
                        placeholder="juan@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje</label>
                      <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#40C9C6] focus:ring-2 focus:ring-[#40C9C6]/20 outline-none transition-all resize-none"
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                      />
                    </div>

                    <Button type="submit" className="w-full gradient-primary text-white border-0 py-3">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar mensaje
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="space-y-6">
              <Card className="card-hover">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-[#40C9C6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                      <a href="mailto:contacto@vittasami.com" className="text-[#40C9C6] hover:underline">
                        contacto@vittasami.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-hover bg-gradient-to-br from-[#40C9C6] to-[#A6E3A1] text-white">
                <CardContent className="p-8">
                  <h4 className="font-semibold mb-2">¿Necesitas ayuda técnica?</h4>
                  <p className="text-white/90 mb-4">
                    Para soporte técnico o preguntas sobre tu cuenta
                  </p>
                  <a href="mailto:soporte@vittasami.com" className="text-white hover:underline font-medium">
                    soporte@vittasami.com
                  </a>
                </CardContent>
              </Card>

              <Card className="card-hover">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Horario de atención</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Lunes a Viernes: 9:00 - 18:00</p>
                    <p>Sábados: 9:00 - 13:00</p>
                    <p className="text-[#40C9C6] font-medium">Tiempo de respuesta: 24-48 hrs</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
