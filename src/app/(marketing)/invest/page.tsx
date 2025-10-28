'use client'

import { motion } from 'framer-motion'
import { Heading } from '@/components/ui/Heading'
import { Section } from '@/components/ui/Section'
import { GradientText } from '@/components/ui/GradientText'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Icons } from '@/components/ui/Icons'
import { InvestorMetricsCard } from '@/components/investors/InvestorMetrics'
import { InvestorCTA } from '@/components/investors/InvestorCTA'
import {
  INVESTOR_BLOCKS,
  MILESTONES,
  TEAM,
  TEAM_COLLABORATORS,
  USE_OF_FUNDS,
  USE_OF_FUNDS_NOTE,
  FINANCIAL_PROJECTIONS,
  VALUATION_FACTORS,
  VALUATION_COMPARABLES,
  PILOT_CLIENTS,
  PRODUCT_MOCKUPS,
} from '@/constants/investors'
import Image from 'next/image'
import { useInvestorTracking } from '@/hooks/useInvestorTracking'
import { ProductMockups } from '@/components/investors/ProductMockups'

export default function InvestPage() {
  const { trackPitchDeckRequest, trackMeetingRequest, trackEmailClick } = useInvestorTracking()
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
            <div className="inline-block px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold text-[#003A47] mb-6">
              Ronda Pre-Seed • SAFE + Revenue Share
            </div>
            <Heading level="h1" gradient="primary" className="mb-6">
              Redefiniendo la salud digital en Latinoamérica
            </Heading>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              VittaSami digitaliza la gestión de salud y bienestar con{' '}
              <span className="font-semibold text-gray-900">IA predictiva</span>, modelo{' '}
              <span className="font-semibold text-gray-900">freemium real</span> y enfoque en
              ownership de datos. Buscamos <span className="font-semibold text-gray-900">$40K</span>{' '}
              para acelerar nuestra expansión en LATAM.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          >
            {[
              { label: 'TAM LATAM', value: '$2.5B', sublabel: 'Mercado total' },
              { label: 'Buscamos', value: '$40K', sublabel: 'Pre-seed round' },
              { label: 'Runway', value: '6 meses', sublabel: 'Hasta break-even' },
              { label: 'Break-even', value: 'Q2 2026', sublabel: 'Proyectado' },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/50 rounded-xl backdrop-blur-sm">
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.sublabel}</div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#contact"
              onClick={trackPitchDeckRequest}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              Solicitar pitch deck completo
            </a>
            <a
              href="mailto:alvaro@abp.pe?subject=Reunión VittaSami - Inversión"
              onClick={trackMeetingRequest}
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors border-2 border-gray-200"
            >
              Agendar reunión
            </a>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {block.stats.map((stat, i) => (
                          <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-900 mb-1">
                              {stat.value}
                            </div>
                            <div className="text-sm font-medium text-gray-700">{stat.label}</div>
                            {stat.description && (
                              <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </div>
      </Section>

      {/* Product Mockups */}
      <Section spacing="lg" background="gradient">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            El <GradientText>producto</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plataforma completa de gestión con IA integrada
          </p>
        </div>

        <ProductMockups mockups={PRODUCT_MOCKUPS} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-xl text-center max-w-3xl mx-auto"
        >
          <p className="text-gray-700">
            <span className="font-semibold">Stack tecnológico:</span> Next.js 15 • Supabase •
            PostgreSQL • TypeScript • IA (OpenAI) • Stripe • Tailwind CSS
          </p>
        </motion.div>
      </Section>

      {/* Pilot Clients */}
      <Section spacing="lg" background="white">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Clientes <GradientText>piloto</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Validación real con clínicas activas usando VittaSami
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {PILOT_CLIENTS.map((client, index) => (
              <motion.div
                key={client.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="w-full h-32 mb-4 relative rounded-lg overflow-hidden bg-white border-2 border-gray-100 flex items-center justify-center">
                      {client.logo ? (
                        <Image
                          src={client.logo}
                          alt={client.name}
                          width={200}
                          height={128}
                          className="object-contain p-4"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-[#40C9C6]">{client.name}</div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{client.name}</h3>
                    {client.testimonial && (
                      <p className="text-sm text-gray-600 leading-relaxed">{client.testimonial}</p>
                    )}
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Activo
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 p-6 bg-gradient-to-r from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-xl text-center"
          >
            <p className="text-gray-700">
              <span className="font-semibold">150+ profesionales</span> usando la agenda
              diariamente •{' '}
              <span className="font-semibold">2,500+ citas</span> gestionadas con éxito
            </p>
          </motion.div>
        </div>
      </Section>

      {/* Use of Funds */}
      <Section spacing="lg" background="white">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            <GradientText>Uso de fondos</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Distribución eficiente del capital de $40K USD
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Uso de fondos
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          Porcentaje
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                          Monto (USD)
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Descripción
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {USE_OF_FUNDS.map((item, index) => (
                        <tr key={item.category} className={index === 0 ? 'bg-green-50' : ''}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] text-white font-bold text-lg">
                              {item.percentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-sm font-semibold text-[#40C9C6]">
                            {item.amount}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 p-6 bg-gradient-to-r from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-xl border-2 border-[#40C9C6]/20"
          >
            <div className="flex items-start gap-4">
              <Icons.zap className="w-6 h-6 text-[#40C9C6] flex-shrink-0 mt-1" />
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Modelo eficiente:</span>{' '}
                {USE_OF_FUNDS_NOTE}
              </p>
            </div>
          </motion.div>
        </div>
      </Section>

      {/* Milestones Roadmap */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Roadmap de <GradientText>crecimiento</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan de expansión 2026 con la inversión de $40,000 USD
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

      {/* Team Section */}
      <Section spacing="lg" background="white">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            El <GradientText>equipo</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experiencia demostrada en tech, salud y growth
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {TEAM.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="card-hover">
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    {member.image ? (
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-[#40C9C6]/20">
                        <Image
                          src={member.image}
                          alt={member.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                        {member.name.split(' ')[0][0]}
                        {member.name.split(' ')[1]?.[0]}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-[#40C9C6] font-semibold mb-3">{member.role}</p>
                      <p className="text-gray-600 leading-relaxed">{member.bio}</p>
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-4 text-[#40C9C6] hover:text-[#A6E3A1] transition-colors"
                        >
                          <Icons.linkedin className="w-5 h-5" />
                          <span className="text-sm font-medium">LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* Team Collaborators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8"
          >
            <Card className="bg-gradient-to-r from-[#40C9C6]/5 to-[#A6E3A1]/5 border-2 border-[#40C9C6]/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center flex-shrink-0">
                    <Icons.users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {TEAM_COLLABORATORS.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed mb-4">
                      {TEAM_COLLABORATORS.description}
                    </p>
                    <div className="p-4 bg-white/70 rounded-lg border border-[#40C9C6]/20">
                      <p className="text-sm text-gray-600 italic">{TEAM_COLLABORATORS.note}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* Financial Projections */}
      <Section spacing="lg" background="gray">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            Proyecciones <GradientText>financieras</GradientText>
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Proyección a 3 años con break-even en mes 20-22
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto"
        >
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Periodo
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Ingresos
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Costos
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        EBITDA
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Clínicas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {FINANCIAL_PROJECTIONS.map((projection, index) => (
                      <tr
                        key={projection.period}
                        className={index === FINANCIAL_PROJECTIONS.length - 1 ? 'bg-green-50' : ''}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {projection.period}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {projection.revenue}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {projection.costs}
                        </td>
                        <td
                          className={`px-6 py-4 text-sm text-right font-semibold ${
                            projection.ebitda.startsWith('+')
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {projection.ebitda}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                          {projection.clinics}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 p-6 bg-white rounded-xl text-center">
            <p className="text-sm text-gray-600">
              <Icons.trendingUp className="inline w-4 h-4 text-green-600 mr-2" />
              Punto de equilibrio proyectado:{' '}
              <span className="font-semibold text-gray-900">Q2 2026 (meses 20-22)</span>
            </p>
          </div>
        </motion.div>
      </Section>

      {/* Valuation Section */}
      <Section spacing="lg" background="white">
        <div className="text-center mb-12">
          <Heading level="h2" className="mb-4">
            <GradientText>Valoración</GradientText> estimada
          </Heading>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Método Berkus + comparables de mercado
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Berkus Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Método Berkus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {VALUATION_FACTORS.map((factor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{factor.factor}</div>
                        <div className="text-sm text-gray-600">{factor.description}</div>
                      </div>
                      <div className="text-xl font-bold text-[#40C9C6] ml-4">{factor.value}</div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] rounded-lg mt-4">
                    <div className="font-bold text-white text-lg">Valoración Pre-money</div>
                    <div className="text-2xl font-bold text-white">≈ $3M USD</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Comparables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Comparables de mercado</CardTitle>
                <CardDescription>Startups similares en fase pre-seed/seed</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {VALUATION_COMPARABLES.map((comp, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="font-bold text-gray-900 mb-1">{comp.company}</div>
                      <div className="text-sm text-gray-600 mb-2">{comp.country}</div>
                      <div className="text-xl font-bold text-[#40C9C6]">{comp.valuation}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section spacing="lg" background="gray" id="contact">
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

      {/* Closing Statement */}
      <Section spacing="lg" background="white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="p-8 md:p-12 bg-gradient-to-r from-[#40C9C6]/10 to-[#A6E3A1]/10 rounded-2xl border-2 border-[#40C9C6]/20">
            <Icons.quote className="w-12 h-12 text-[#40C9C6] mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-relaxed">
              "Estamos redefiniendo la salud digital en Latinoamérica con tecnología accesible y
              humana."
            </blockquote>
            <p className="text-lg text-gray-600 leading-relaxed">
              En VittaSami, creemos que el futuro del bienestar comienza con información en manos
              del paciente y herramientas inteligentes que empoderan a los profesionales de la
              salud.
            </p>
          </div>
        </motion.div>
      </Section>

      {/* Trust Indicators & Contact */}
      <Section spacing="md" background="gray">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-600 mb-4">En proceso de aplicación / validación:</p>
          <div className="flex items-center justify-center gap-8 flex-wrap mb-8">
            <div className="text-gray-500 font-semibold">Y Combinator</div>
            <div className="text-gray-500 font-semibold">Startup Perú</div>
            <div className="text-gray-500 font-semibold">Innóvate Perú</div>
          </div>
          <div className="pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-2">Contacto directo</p>
            <div className="flex flex-col items-center gap-2">
              <a
                href="mailto:alvaro@abp.pe"
                onClick={trackEmailClick}
                className="text-[#40C9C6] hover:text-[#A6E3A1] font-semibold transition-colors"
              >
                alvaro@abp.pe
              </a>
              <a
                href="https://vittasami.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
              >
                vittasami.com
              </a>
              <p className="text-sm text-gray-500">Lima, Perú 🇵🇪</p>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
