'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { PricingPlan } from '@/constants/pricing'

interface PricingCardProps {
  plan: PricingPlan
  isAnnual?: boolean
  className?: string
}

export function PricingCard({ plan, isAnnual = false, className }: PricingCardProps) {
  const price = isAnnual ? plan.price.annual : plan.price.monthly
  const isFreePlan = plan.price.monthly === 0

  return (
    <Card
      className={cn(
        'relative h-full flex flex-col transition-all duration-300',
        plan.popular
          ? 'border-[#40C9C6] border-2 shadow-xl scale-105'
          : 'border-gray-200 hover:border-[#40C9C6]/50 hover:shadow-lg',
        className
      )}
    >
      {/* Badge Popular */}
      {plan.popular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <Badge className="bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] text-white border-0 px-4 py-1">
            Más Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <CardDescription className="text-base mt-2">{plan.tagline}</CardDescription>

        {/* Precio */}
        <div className="mt-6">
          {isFreePlan ? (
            <div className="flex items-baseline justify-center">
              <span className="text-5xl font-bold tracking-tight text-gray-900">Gratis</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-center">
                <span className="text-5xl font-bold tracking-tight text-gray-900">${price}</span>
                <span className="ml-2 text-gray-600">/mes</span>
              </div>
              {isAnnual && (
                <div className="mt-2">
                  <span className="text-sm text-gray-500 line-through">
                    ${plan.price.monthly}/mes
                  </span>
                  <Badge variant="secondary" className="ml-2">
                    Ahorra 15%
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        <p className="mt-4 text-sm text-gray-600">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Ideal para */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-900 mb-2">Ideal para:</p>
          <p className="text-sm text-gray-600">{plan.idealFor}</p>
        </div>

        {/* Features list */}
        <ul className="space-y-3 mb-8 flex-1">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-[#40C9C6] mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Link href={plan.ctaLink} className="block">
          <Button
            className={cn(
              'w-full',
              plan.popular
                ? 'gradient-primary text-white border-0 hover:shadow-xl'
                : 'border-gray-300'
            )}
            variant={plan.popular ? 'default' : 'outline'}
            size="lg"
          >
            {plan.cta}
          </Button>
        </Link>

        {isFreePlan && (
          <p className="text-xs text-center text-gray-500 mt-3">
            Sin tarjeta de crédito requerida
          </p>
        )}

        {plan.enterprise && (
          <p className="text-xs text-center text-gray-500 mt-3">
            Contacta a ventas para una demo personalizada
          </p>
        )}
      </CardContent>
    </Card>
  )
}
