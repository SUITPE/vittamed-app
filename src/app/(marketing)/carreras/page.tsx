'use client'

import { motion } from 'framer-motion'
import { Briefcase, Heart, Zap, Users, Mail } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function CarrerasPage() {
  return (
    <>
      <Section spacing="xl" background="gradient">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Heading level="h1" gradient="primary" className="mb-6">
              Únete al equipo que está transformando la salud y el bienestar
            </Heading>
            <p className="text-xl text-gray-600">
              Construye tecnología que impacta positivamente la vida de miles de personas
            </p>
          </motion.div>
        </div>
      </Section>

      <Section spacing="lg" background="white">
        <div className="max-w-3xl mx-auto">
          <Card className="card-hover">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <Heading level="h2" className="mb-4">
                <GradientText>Próximamente</GradientText> vacantes activas
              </Heading>
              <p className="text-lg text-gray-600 mb-8">
                Por ahora no hay vacantes activas, pero siempre buscamos personas con pasión por la tecnología y el bienestar.
              </p>

              <div className="grid gap-6 md:grid-cols-3 mb-8">
                {[
                  { icon: Heart, title: 'Propósito', desc: 'Impacta vidas reales' },
                  { icon: Zap, title: 'Innovación', desc: 'Tecnología de punta' },
                  { icon: Users, title: 'Equipo', desc: 'Cultura colaborativa' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#40C9C6]/10 flex items-center justify-center mx-auto mb-3">
                      <item.icon className="w-6 h-6 text-[#40C9C6]" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="bg-[#40C9C6]/5 border-2 border-[#40C9C6]/20 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  ¿Te gustaría formar parte del equipo VittaSami?
                </p>
                <a href="mailto:talento@vittasami.com">
                  <Button className="gradient-primary text-white border-0">
                    <Mail className="w-4 h-4 mr-2" />
                    talento@vittasami.com
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </>
  )
}
