'use client'

import { motion } from 'framer-motion'
import { Heart, Target, Eye, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SobreNosotrosPage() {
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
              Nuestra energía vital es mejorar la salud y el bienestar
            </Heading>
            <p className="text-xl text-gray-600">
              Empoderando a profesionales y centros con tecnología inteligente
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Historia */}
      <Section spacing="lg" background="white">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-8">
              <Heading level="h2" className="mb-4">
                Nuestra <GradientText>historia</GradientText>
              </Heading>
            </div>

            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed">
                VittaSami nace de la necesidad de transformar la forma en que los profesionales de la
                salud y el bienestar gestionan su práctica. Creemos que la tecnología debe ser una
                aliada, no un obstáculo.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Desarrollamos una plataforma inteligente que combina agenda, gestión de pacientes,
                asistente con IA y pagos integrados en una sola herramienta moderna y fácil de usar.
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Nuestro propósito es empoderar a médicos, nutricionistas, terapeutas, centros
                estéticos y profesionales del bienestar para que dediquen más tiempo a lo que
                realmente importa: cuidar a sus pacientes.
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Misión, Visión, Valores */}
      <Section spacing="lg" background="gray">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: Target,
              title: 'Misión',
              description:
                'Democratizar el acceso a tecnología de salud digital, permitiendo que profesionales de todos los tamaños puedan ofrecer una experiencia moderna a sus pacientes.',
              color: 'from-[#40C9C6] to-[#33a19e]',
            },
            {
              icon: Eye,
              title: 'Visión',
              description:
                'Ser la plataforma líder en LATAM para la gestión de salud y bienestar, conectando profesionales, pacientes y tecnología en un ecosistema inteligente.',
              color: 'from-[#A6E3A1] to-[#8aca85]',
            },
            {
              icon: Heart,
              title: 'Valores',
              description:
                'Empatía, innovación, transparencia y compromiso con la excelencia. Creemos en la tecnología centrada en las personas, no en los sistemas.',
              color: 'from-[#003A47] to-[#40C9C6]',
            },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="card-hover h-full">
                <CardContent className="p-8">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-r ${item.color} flex items-center justify-center mb-4`}
                  >
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <Heading level="h3" className="mb-3">
                    {item.title}
                  </Heading>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* Equipo */}
      <Section spacing="lg" background="white">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h2" className="mb-4">
              Equipo <GradientText>fundador</GradientText>
            </Heading>
            <p className="text-lg text-gray-600 mb-8">
              Un equipo apasionado por la tecnología y el bienestar
            </p>

            <Card className="card-hover">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <p className="text-gray-700">
                  Nuestro equipo está conformado por profesionales con experiencia en tecnología de
                  salud, desarrollo de software y gestión médica.
                </p>
                <div className="mt-6">
                  <Link href="/carreras">
                    <Button className="gradient-primary text-white border-0">
                      <Users className="w-4 h-4 mr-2" />
                      Únete al equipo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* CTA */}
      <Section spacing="lg" background="primary" className="text-white">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Heading level="h2" className="text-white mb-4">
              ¿Quieres colaborar con nosotros?
            </Heading>
            <p className="text-xl text-white/90 mb-8">
              Estamos siempre abiertos a nuevas ideas, alianzas y talento
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/carreras">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-[#003A47] hover:bg-gray-50"
                >
                  Ver oportunidades
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contacto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  Contáctanos
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  )
}
