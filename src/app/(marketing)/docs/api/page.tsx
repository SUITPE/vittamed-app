'use client'

import { motion } from 'framer-motion'
import { Code, Zap, Lock, Globe } from 'lucide-react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ApiDocsPage() {
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
              <Code className="w-8 h-8 text-[#40C9C6]" />
              <Heading level="h1" gradient="primary">
                Documentación API de VittaSami
              </Heading>
            </div>
            <p className="text-xl text-gray-600">
              Conecta tu sistema o app con la plataforma de bienestar inteligente
            </p>
          </motion.div>
        </div>
      </Section>

      <Section spacing="lg" background="white">
        <div className="max-w-4xl mx-auto">
          <Card className="card-hover">
            <CardContent className="p-12">
              <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-6">
                  <Code className="w-10 h-10 text-white" />
                </div>
                <Heading level="h2" className="mb-4">
                  La documentación oficial estará disponible <GradientText>pronto</GradientText>
                </Heading>
                <p className="text-lg text-gray-600">
                  Mientras tanto, puedes contactarnos para integraciones personalizadas
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 mb-10">
                {[
                  {
                    icon: Zap,
                    title: 'API REST',
                    description: 'Endpoints modernos con autenticación JWT',
                  },
                  {
                    icon: Lock,
                    title: 'Seguridad',
                    description: 'Cifrado SSL y tokens de acceso',
                  },
                  {
                    icon: Globe,
                    title: 'Webhooks',
                    description: 'Notificaciones en tiempo real',
                  },
                  {
                    icon: Code,
                    title: 'SDKs',
                    description: 'Librerías para JS, Python y PHP',
                  },
                ].map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-[#40C9C6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="bg-[#40C9C6]/5 border-2 border-[#40C9C6]/20 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-4">
                  ¿Necesitas una integración personalizada ahora?
                </p>
                <Link href="/contacto">
                  <Button className="gradient-primary text-white border-0">
                    Contactar al equipo técnico
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  )
}
