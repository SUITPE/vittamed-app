'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Mail } from 'lucide-react'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export default function BlogPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Integrate with email service (Mailchimp, SendGrid, etc)
    console.log('Subscribing:', email)
    setSubscribed(true)
    setEmail('')
  }

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
            <div className="flex items-center justify-center gap-2 mb-6">
              <BookOpen className="w-8 h-8 text-[#40C9C6]" />
              <Heading level="h1" gradient="primary">
                Blog VittaSami
              </Heading>
            </div>
            <p className="text-xl text-gray-600">
              Historias, consejos y tecnología para la nueva era del bienestar
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Coming Soon Section */}
      <Section spacing="lg" background="white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="card-hover">
              <CardContent className="p-12">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-white" />
                </div>

                <Heading level="h2" className="mb-4">
                  Estamos preparando <GradientText>contenido inspirador</GradientText>
                </Heading>

                <p className="text-lg text-gray-600 mb-8">
                  Pronto encontrarás aquí artículos sobre:
                </p>

                <div className="grid gap-3 text-left max-w-md mx-auto mb-8">
                  {[
                    'Salud & IA: Cómo la tecnología está transformando el bienestar',
                    'Productividad: Tips para gestionar tu práctica con éxito',
                    'Cultura VittaSami: Historias de nuestros usuarios',
                    'Tendencias: Lo último en salud digital',
                  ].map((category, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#40C9C6] mt-2" />
                      <span className="text-gray-700">{category}</span>
                    </div>
                  ))}
                </div>

                {!subscribed ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      Suscríbete para recibir las primeras publicaciones
                    </p>
                    <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                      <div className="flex-1">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#40C9C6] focus:ring-2 focus:ring-[#40C9C6]/20 outline-none transition-all"
                        />
                      </div>
                      <Button
                        type="submit"
                        className="gradient-primary text-white border-0 px-6 py-3"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Suscribirme
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="bg-[#40C9C6]/10 border-2 border-[#40C9C6]/30 rounded-lg p-6">
                    <p className="text-[#003A47] font-medium">
                      ¡Gracias por suscribirte! 🎉
                    </p>
                    <p className="text-gray-600 text-sm mt-2">
                      Te notificaremos cuando publiquemos nuestros primeros artículos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Categories Preview */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-8">
          <Heading level="h3" className="mb-2">
            Próximas <GradientText>categorías</GradientText>
          </Heading>
          <p className="text-gray-600">Explora los temas que cubriremos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: 'Salud & IA', icon: '🤖', color: 'from-[#40C9C6] to-[#33a19e]' },
            { name: 'Productividad', icon: '⚡', color: 'from-[#A6E3A1] to-[#8aca85]' },
            { name: 'Cultura VittaSami', icon: '💚', color: 'from-[#003A47] to-[#40C9C6]' },
          ].map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mx-auto mb-3 text-3xl`}>
                    {category.icon}
                  </div>
                  <h4 className="font-semibold text-gray-900">{category.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">Próximamente</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  )
}
