'use client'

import { motion } from 'framer-motion'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Icons } from '@/components/ui/Icons'
import { InvestorMetricsCard } from '@/components/investors/InvestorMetrics'
import { InvestorCTA } from '@/components/investors/InvestorCTA'
import { INVESTOR_BLOCKS, MILESTONES } from '@/constants/investors'

export default function InvestPage() {
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
              Invierte en el futuro de la salud y el bienestar inteligente
            </Heading>
            <p className="text-xl text-gray-600 mb-8">
              VittaSami empodera a centros, clínicas y profesionales para digitalizar su gestión
              con IA. Buscamos socios estratégicos para acelerar nuestra expansión en
              Latinoamérica.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { label: 'Mercado LATAM', value: '$2.5B' },
              { label: 'Inversión', value: '$40K' },
              { label: 'Runway', value: '6 meses' },
              { label: 'Objetivo usuarios', value: '1,000' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* Investor Blocks */}
      <Section spacing="lg" background="white">
        <div className="space-y-12">
          {INVESTOR_BLOCKS.map((block, index) => {
            const Icon = block.icon ? Icons[block.icon as keyof typeof Icons] : null
            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {Icon && (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">{block.title}</CardTitle>
                        <CardDescription className="text-base leading-relaxed">
                          {block.content}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {block.stats && block.stats.length > 0 && (
                    <CardContent>
                      <InvestorMetricsCard stats={block.stats} />
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* Milestones Roadmap */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Roadmap de <GradientText>crecimiento</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan de expansión con la inversión de $40,000 USD
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MILESTONES.map((milestone, index) => (
            <motion.div
              key={milestone.quarter}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl">{milestone.quarter}</CardTitle>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    {milestone.goals.map((goal, i) => (
                      <li key={i} className="flex items-start text-sm text-gray-700">
                        <Icons.check className="h-4 w-4 text-[#40C9C6] mr-2 flex-shrink-0 mt-0.5" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {milestone.metrics.users}
                        </div>
                        <div className="text-xs text-gray-600">Usuarios</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {milestone.metrics.mrr}
                        </div>
                        <div className="text-xs text-gray-600">MRR</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* CTA Section */}
      <Section spacing="lg" background="white">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <InvestorCTA />
          </motion.div>
        </div>
      </Section>

      {/* Trust Indicators */}
      <Section spacing="md" background="gray">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">Respaldado por:</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <div className="text-gray-400 font-semibold">Y Combinator (Aplicando)</div>
            <div className="text-gray-400 font-semibold">Startup Perú</div>
            <div className="text-gray-400 font-semibold">Innóvate Perú</div>
          </div>
        </div>
      </Section>
    </>
  )
}
