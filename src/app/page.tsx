'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Icons } from '@/components/ui/Icons'

export default function Home() {
  const services = [
    {
      icon: 'calendarDays',
      title: 'Gestión de Agenda',
      description: 'Vista calendario intuitiva estilo Google Calendar. Los doctores definen horarios y pacientes reservan online con un par de clics.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: 'zap',
      title: 'Reservas Inteligentes',
      description: 'Flujo tipo wizard con auto-selección. El sistema elige automáticamente el mejor horario y especialista disponible.',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: 'creditCard',
      title: 'Pagos Integrados',
      description: 'Checkout seguro con Stripe, resumen de citas y notificaciones automáticas por email y SMS.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: 'activity',
      title: 'Dashboard Médico',
      description: 'Estadísticas en tiempo real de citas, ingresos y pacientes con KPIs visuales y reportes.',
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: 'users',
      title: 'Multi-Tenant',
      description: 'Escalable para múltiples clínicas y doctores con branding personalizado y gestión independiente.',
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      icon: 'shield',
      title: 'Seguro y Confiable',
      description: 'Cumple con estándares médicos, encriptación de datos y respaldos automáticos.',
      color: 'from-red-500 to-red-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-green-600/10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Gestión médica
                <span className="block bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  moderna y simple
                </span>
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600"
            >
              Plataforma completa para clínicas modernas. Agenda inteligente, pagos integrados y experiencia fluida inspirada en las mejores apps del mercado.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex items-center justify-center gap-6"
            >
              <Link href="/booking">
                <Button size="lg" className="text-base px-8 py-4 h-auto gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <Icons.calendar className="mr-2 h-5 w-5" />
                  Reservar Cita Ahora
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" size="lg" className="text-base px-8 py-4 h-auto">
                  <Icons.user className="mr-2 h-5 w-5" />
                  Acceso Profesional
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 text-sm text-gray-500"
            >
              ✓ Gratis por 30 días · ✓ Sin tarjeta de crédito · ✓ Configuración en 5 minutos
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Todo lo que necesitas en una plataforma
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-gray-600"
            >
              Diseñado específicamente para clínicas modernas que buscan eficiencia y experiencia premium
            </motion.p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => {
              const Icon = Icons[service.icon as keyof typeof Icons]
              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full card-hover group">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base leading-relaxed">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              ¿Listo para modernizar tu clínica?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-4 text-lg text-blue-100"
            >
              Únete a cientos de profesionales que ya transformaron su práctica médica
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <Link href="/auth/signup">
                <Button size="lg" variant="secondary" className="text-base px-8 py-4 h-auto shadow-lg hover:shadow-xl transition-all duration-300">
                  <Icons.userPlus className="mr-2 h-5 w-5" />
                  Comenzar Gratis
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
