'use client'

import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Icons } from '@/components/ui/Icons'
import { MAIN_FEATURES, USE_CASES } from '@/constants/features'

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h1" gradient="primary" className="mb-6">
              Todo lo que tu centro necesita para crecer
            </Heading>
            <p className="text-xl text-gray-600 mb-8">
              Una herramienta integral para clínicas, spas y profesionales del bienestar
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Main Features */}
      <Section spacing="lg" background="white">
        <div className="grid gap-12 lg:gap-16">
          {MAIN_FEATURES.map((feature, index) => {
            const Icon = Icons[feature.icon as keyof typeof Icons]
            const isEven = index % 2 === 0

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`grid gap-8 lg:grid-cols-2 items-center ${isEven ? '' : 'lg:grid-flow-dense'}`}
              >
                {/* Icon & Title */}
                <div className={isEven ? '' : 'lg:col-start-2'}>
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6`}
                  >
                    {Icon && <Icon className="w-8 h-8 text-white" />}
                  </div>
                  <Heading level="h2" className="mb-4">
                    {feature.title}
                  </Heading>
                  <p className="text-lg text-gray-600 mb-6">{feature.description}</p>

                  {feature.benefits && (
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-[#40C9C6] mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Visual */}
                <div className={isEven ? 'lg:col-start-2' : 'lg:col-start-1 lg:row-start-1'}>
                  <Card className="card-hover bg-gradient-to-br from-gray-50 to-white border-2">
                    <CardContent className="p-8">
                      <div className="aspect-video bg-gradient-to-br from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-lg flex items-center justify-center">
                        {Icon && <Icon className="w-24 h-24 text-[#40C9C6]/40" />}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* Use Cases Section */}
      <Section spacing="lg" background="gray" id="use-cases">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Casos de uso <GradientText gradient="primary">reales</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre cómo distintos profesionales utilizan VittaSami
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {USE_CASES.map((useCase, index) => {
            const Icon = Icons[useCase.icon as keyof typeof Icons]
            return (
              <motion.div
                key={useCase.type}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      {Icon && (
                        <div className="w-10 h-10 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[#40C9C6]" />
                        </div>
                      )}
                      <CardTitle className="text-lg">{useCase.title}</CardTitle>
                    </div>
                    <CardDescription>{useCase.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {useCase.examples.map((example, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-[#40C9C6] mr-2 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* Integrations Section */}
      <Section spacing="lg" background="white" id="integrations">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            <GradientText gradient="primary">Integraciones</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Conecta VittaSami con tus herramientas favoritas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'Stripe / Culqi', description: 'Pagos seguros', icon: 'CreditCard' },
            { name: 'WhatsApp', description: 'Notificaciones', icon: 'MessageCircle' },
            { name: 'Google Calendar', description: 'Sincronización de citas', icon: 'Calendar' },
            { name: 'APIs Personalizadas', description: 'Próximamente', icon: 'Code' },
          ].map((integration, index) => {
            const Icon = Icons[integration.icon as keyof typeof Icons]
            return (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="card-hover text-center">
                  <CardContent className="p-6">
                    {Icon && (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <h3 className="font-semibold text-gray-900 mb-1">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="mt-8 text-center"
        >
          <p className="text-gray-600">
            API pública e integraciones avanzadas disponibles próximamente
          </p>
        </motion.div>
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
              ¿Listo para transformar tu práctica?
            </Heading>
            <p className="text-xl text-white/90 mb-8">
              Comienza gratis hoy y descubre cómo VittaSami simplifica tu día a día
            </p>
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
            <p className="mt-6 text-sm text-white/80">
              ✓ Agenda ilimitada gratis • ✓ Sin tarjeta de crédito • ✓ Setup en 5 minutos
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
