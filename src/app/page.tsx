'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Icons } from '@/components/ui/Icons'
import { MAIN_FEATURES, USE_CASES, PLATFORM_STATS } from '@/constants/features'
import PublicHeader from '@/components/marketing/PublicHeader'

export default function LandingPage() {
  return (
    <>
      <PublicHeader />
      {/* Hero Section */}
      <Section spacing="xl" background="gradient" className="relative overflow-hidden">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h1" gradient="primary" className="mb-6">
              Gestión moderna para salud y bienestar
            </Heading>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-xl leading-8 text-gray-600"
          >
            Agenda, evolución y pagos, todo en una sola plataforma inteligente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/auth/register">
              <Button size="lg" className="gradient-primary text-white border-0 text-lg px-8 py-6">
                Comenzar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver Planes
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-600"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#40C9C6]" />
              <span>Agenda gratuita y sin límites</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#40C9C6]" />
              <span>Sin tarjeta de crédito</span>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Stats Section */}
      <Section spacing="md" background="white">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {PLATFORM_STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Features Section */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-16">
          <Heading level="h2" className="mb-4">
            Todo lo que tu centro necesita para{' '}
            <GradientText gradient="primary">crecer</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Una herramienta versátil para clínicas, consultorios y centros de bienestar
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {MAIN_FEATURES.map((feature, index) => {
            const Icon = Icons[feature.icon as keyof typeof Icons]
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full card-hover">
                  <CardHeader>
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4`}
                    >
                      {Icon && <Icon className="w-6 h-6 text-white" />}
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* Use Cases Section */}
      <Section spacing="lg" background="white">
        <div className="text-center mb-16">
          <Heading level="h2" className="mb-4">
            Perfecto para <GradientText gradient="primary">todo tipo de práctica</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Ya seas médico, terapeuta, nutricionista o centro de bienestar
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
                      {useCase.examples.slice(0, 3).map((example, i) => (
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

      {/* CTA Section */}
      <Section spacing="lg" background="primary" className="text-white">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h2" className="text-white mb-6">
              Transforma la forma en que gestionas tu práctica
            </Heading>
            <p className="text-xl text-white/90 mb-8">
              Empieza gratis hoy y descubre cómo VittaSami simplifica tu día a día
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
