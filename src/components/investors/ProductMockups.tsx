'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/Card'

export interface MockupImage {
  src: string
  alt: string
  title: string
  description: string
}

interface ProductMockupsProps {
  mockups: MockupImage[]
}

export function ProductMockups({ mockups }: ProductMockupsProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockups.map((mockup, index) => (
        <motion.div
          key={mockup.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        >
          <Card className="card-hover h-full">
            <CardContent className="p-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[#40C9C6]/10 to-[#A6E3A1]/10 mb-4 border-2 border-gray-100">
                {mockup.src ? (
                  <Image
                    src={mockup.src}
                    alt={mockup.alt}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center p-6">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Screenshot próximamente</p>
                    </div>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{mockup.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{mockup.description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
