'use client'

import { motion } from 'framer-motion'
import { FileText, Download, Video, BookOpen } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'

export default function GuiasPage() {
  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h1" gradient="primary" className="mb-6">
              Guías y recursos para aprovechar VittaSami al máximo
            </Heading>
            <p className="text-xl text-gray-600">
              Tutoriales, materiales descargables y mejores prácticas
            </p>
          </motion.div>
        </div>
      </Section>

      <Section spacing="lg" background="white">
        <div className="max-w-3xl mx-auto">
          <Card className="card-hover">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>

              <Heading level="h2" className="mb-4">
                <GradientText>Próximamente</GradientText> encontrarás aquí
              </Heading>

              <p className="text-lg text-gray-600 mb-8">
                Estamos preparando una biblioteca completa de recursos para ayudarte a sacar el máximo provecho de VittaSami
              </p>

              <div className="grid gap-6 md:grid-cols-3 text-left">
                {[
                  {
                    icon: FileText,
                    title: 'Guías PDF',
                    description: 'Manuales completos paso a paso',
                  },
                  {
                    icon: Video,
                    title: 'Video tutoriales',
                    description: 'Aprende viendo ejemplos reales',
                  },
                  {
                    icon: Download,
                    title: 'Plantillas',
                    description: 'Materiales listos para usar',
                  },
                ].map((resource, index) => (
                  <motion.div
                    key={resource.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="text-center"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center mx-auto mb-3">
                      <resource.icon className="w-6 h-6 text-[#40C9C6]" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{resource.title}</h4>
                    <p className="text-sm text-gray-600">{resource.description}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  )
}
