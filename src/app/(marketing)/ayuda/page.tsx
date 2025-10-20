'use client'

import { motion } from 'framer-motion'
import { HelpCircle, Mail, MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PricingFAQ } from '@/components/pricing/PricingFAQ'

export default function AyudaPage() {
  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <HelpCircle className="w-8 h-8 text-[#40C9C6]" />
              <Heading level="h1" gradient="primary">
                Centro de ayuda
              </Heading>
            </div>
            <p className="text-xl text-gray-600">
              Encuentra respuestas rápidas a tus preguntas
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Search Bar */}
      <Section spacing="md" background="white" className="-mt-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en la base de conocimiento..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:border-[#40C9C6] focus:ring-2 focus:ring-[#40C9C6]/20 outline-none transition-all"
                  disabled
                />
              </div>
              <p className="text-sm text-gray-500 mt-2 text-center">
                Buscador disponible próximamente
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* FAQs */}
      <Section spacing="lg" background="white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Heading level="h2" className="mb-4">
              Preguntas <GradientText>frecuentes</GradientText>
            </Heading>
            <p className="text-gray-600">
              Las respuestas a las dudas más comunes sobre VittaSami
            </p>
          </div>

          <PricingFAQ />
        </div>
      </Section>

      {/* Help Categories */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-8">
          <Heading level="h3" className="mb-2">
            Categorías de <GradientText>ayuda</GradientText>
          </Heading>
          <p className="text-gray-600">Próximamente con artículos detallados</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Primeros pasos', icon: '🚀', count: 'Próximamente' },
            { name: 'Agenda', icon: '📅', count: 'Próximamente' },
            { name: 'Pagos', icon: '💳', count: 'Próximamente' },
            { name: 'IA Asistente', icon: '🤖', count: 'Próximamente' },
          ].map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{category.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{category.name}</h4>
                  <p className="text-sm text-gray-600">{category.count}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Contact Support */}
      <Section spacing="lg" background="primary" className="text-white">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h2" className="text-white mb-4">
              ¿No encontraste lo que buscabas?
            </Heading>
            <p className="text-xl text-white/90 mb-8">
              Estamos construyendo una base de conocimiento completa.
              <br />
              Mientras tanto, contáctanos directamente
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="mailto:soporte@vittasami.com">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#003A47] hover:bg-gray-50"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  soporte@vittasami.com
                </Button>
              </a>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Formulario de contacto
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
