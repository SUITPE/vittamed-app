'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { PRICING_FAQS } from '@/constants/pricing'
import { cn } from '@/lib/utils'

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="space-y-4">
      {PRICING_FAQS.map((faq, index) => (
        <div
          key={index}
          className="border border-gray-200 rounded-lg overflow-hidden hover:border-[#40C9C6]/50 transition-colors"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left bg-white hover:bg-gray-50 transition-colors"
            aria-expanded={openIndex === index}
          >
            <span className="text-base font-medium text-gray-900 pr-8">{faq.question}</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-gray-500 flex-shrink-0 transition-transform duration-200',
                openIndex === index && 'transform rotate-180'
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-sm text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
