'use client'

import { Check, X } from 'lucide-react'
import { FEATURE_COMPARISON } from '@/constants/pricing'
import { cn } from '@/lib/utils'

const plans = ['Free', 'Care', 'Pro', 'Enterprise']

export function FeatureComparison() {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-[#40C9C6] mx-auto" />
      ) : (
        <X className="h-5 w-5 text-gray-300 mx-auto" />
      )
    }
    return <span className="text-sm text-gray-900">{value}</span>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="py-4 px-6 text-left text-sm font-semibold text-gray-900 bg-gray-50">
              Características
            </th>
            {plans.map((plan) => (
              <th
                key={plan}
                className={cn(
                  'py-4 px-6 text-center text-sm font-semibold',
                  plan === 'Pro'
                    ? 'bg-gradient-to-r from-[#40C9C6]/10 to-[#A6E3A1]/10 text-[#003A47]'
                    : 'bg-gray-50 text-gray-900'
                )}
              >
                {plan}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_COMPARISON.map((category, categoryIndex) => (
            <React.Fragment key={category.category}>
              {/* Categoría Header */}
              <tr className="bg-gray-100">
                <td
                  colSpan={5}
                  className="py-3 px-6 text-sm font-semibold text-gray-900 uppercase tracking-wider"
                >
                  {category.category}
                </td>
              </tr>

              {/* Features de la categoría */}
              {category.features.map((feature, featureIndex) => (
                <tr
                  key={`${categoryIndex}-${featureIndex}`}
                  className={cn(
                    'border-b border-gray-200',
                    featureIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                  )}
                >
                  <td className="py-4 px-6 text-sm text-gray-700">{feature.name}</td>
                  <td className="py-4 px-6 text-center">
                    {renderFeatureValue(feature.free)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {renderFeatureValue(feature.care)}
                  </td>
                  <td
                    className={cn(
                      'py-4 px-6 text-center',
                      'bg-gradient-to-r from-[#40C9C6]/5 to-[#A6E3A1]/5'
                    )}
                  >
                    {renderFeatureValue(feature.pro)}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {renderFeatureValue(feature.enterprise)}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Import React for Fragment
import React from 'react'
