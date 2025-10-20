'use client'

import { motion } from 'framer-motion'
import { Shield, Lock, Server, Eye } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'

export default function SeguridadPage() {
  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Heading level="h1" gradient="primary">Seguridad y Protección de Datos</Heading>
          </motion.div>
        </div>
      </Section>

      <Section spacing="lg" background="white">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-8">
                <Shield className="w-8 h-8 text-white" />
              </div>

              <Heading level="h2" className="mb-6 text-center">
                La seguridad de tu información es nuestra <GradientText>prioridad</GradientText>
              </Heading>

              <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
                VittaSami utiliza cifrado SSL, copias de seguridad automáticas y cumplimiento con las normas de privacidad médica y de bienestar.
              </p>

              <div className="grid gap-6 md:grid-cols-2 mb-8">
                {[
                  {
                    icon: Lock,
                    title: 'Cifrado SSL/TLS',
                    desc: 'Toda la comunicación está cifrada de extremo a extremo',
                  },
                  {
                    icon: Server,
                    title: 'Backups Automáticos',
                    desc: 'Copias de seguridad diarias de toda tu información',
                  },
                  {
                    icon: Eye,
                    title: 'Privacidad por Diseño',
                    desc: 'Solo tú y tu equipo tienen acceso a tus datos',
                  },
                  {
                    icon: Shield,
                    title: 'Cumplimiento GDPR',
                    desc: 'Cumplimos con estándares internacionales de protección de datos',
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-[#40C9C6]" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#40C9C6]/5 border-2 border-[#40C9C6]/20 rounded-lg p-6 text-center">
                <p className="text-gray-700 mb-2">
                  Más detalles técnicos estarán disponibles pronto en nuestra documentación API
                </p>
                <p className="text-sm text-gray-600">
                  Para consultas de seguridad: <a href="mailto:seguridad@vittasami.com" className="text-[#40C9C6] hover:underline">seguridad@vittasami.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  )
}
