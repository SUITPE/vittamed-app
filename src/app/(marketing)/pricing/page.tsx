'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Button } from '@/components/ui/Button'
import { PricingCard } from '@/components/pricing/PricingCard'
import { PricingToggle } from '@/components/pricing/PricingToggle'
import { FeatureComparison } from '@/components/pricing/FeatureComparison'
import { PricingFAQ } from '@/components/pricing/PricingFAQ'
import { PRICING_PLANS } from '@/constants/pricing'

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <>
      {/* Hero Section */}
      <Section spacing="lg" background="gradient">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h1" gradient="primary" className="mb-6">
              Elige el plan ideal para tu centro o práctica
            </Heading>
            <p className="text-xl text-gray-600 mb-8">
              Comienza gratis y agrega funcionalidades cuando las necesites
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <PricingToggle isAnnual={isAnnual} onToggle={setIsAnnual} className="mb-12" />
          </motion.div>
        </div>
      </Section>

      {/* Pricing Cards */}
      <Section spacing="lg" background="white" className="-mt-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PRICING_PLANS.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <PricingCard plan={plan} isAnnual={isAnnual} />
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Feature Comparison */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Comparación completa de <GradientText>características</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encuentra el plan perfecto comparando todas las funcionalidades
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <FeatureComparison />
        </motion.div>
      </Section>

      {/* FAQ Section */}
      <Section spacing="lg" background="white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Heading level="h2" className="mb-4">
              Preguntas <GradientText>frecuentes</GradientText>
            </Heading>
            <p className="text-lg text-gray-600">
              Todo lo que necesitas saber sobre nuestros planes
            </p>
          </div>

          <PricingFAQ />
        </div>
      </Section>

      {/* CTA Section */}
      <Section spacing="lg" background="primary" className="text-white">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h2" className="text-white mb-6">
              ¿Listo para empezar?
            </Heading>
            <p className="text-xl text-white/90 mb-8">
              Únete a cientos de profesionales que ya transformaron su práctica
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-6 bg-white text-[#003A47] hover:bg-gray-50"
                >
                  Comenzar Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg px-8 py-6 border-white text-white hover:bg-white/10"
                >
                  Hablar con Ventas
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-sm text-white/80">
              ✓ Sin compromiso • ✓ Cancela cuando quieras • ✓ Soporte en español
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
