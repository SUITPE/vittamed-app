'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'

export default function PrivacidadPage() {
  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Heading level="h1" gradient="primary">Política de Privacidad</Heading>
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
                <GradientText>Documento en actualización</GradientText>
              </Heading>

              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed mb-6">
                  VittaSami cumple con las leyes de protección de datos de LATAM y la Unión Europea (GDPR).
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Compromiso de Privacidad</h3>
                <ul className="space-y-3 text-gray-700">
                  <li>✓ Tus datos están cifrados y protegidos</li>
                  <li>✓ No compartimos información con terceros sin tu consentimiento</li>
                  <li>✓ Cumplimos con estándares internacionales de privacidad</li>
                  <li>✓ Tienes derecho a solicitar, modificar o eliminar tus datos</li>
                </ul>

                <p className="text-gray-600 mt-8 text-center">
                  Para consultas sobre privacidad: <a href="mailto:privacidad@vittasami.com" className="text-[#40C9C6] hover:underline">privacidad@vittasami.com</a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  )
}
