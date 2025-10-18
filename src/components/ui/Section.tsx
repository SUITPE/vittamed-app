import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const sectionVariants = cva('w-full', {
  variants: {
    spacing: {
      sm: 'py-12',
      md: 'py-16 sm:py-20',
      lg: 'py-20 sm:py-24 lg:py-32',
      xl: 'py-24 sm:py-32 lg:py-40',
    },
    background: {
      transparent: 'bg-transparent',
      white: 'bg-white',
      gray: 'bg-gray-50',
      gradient: 'bg-gradient-to-br from-gray-50 via-white to-[#e6f9f9]',
      primary: 'bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1]',
      dark: 'bg-[#003A47]',
    },
  },
  defaultVariants: {
    spacing: 'md',
    background: 'transparent',
  },
})

const containerVariants = cva('mx-auto px-4 sm:px-6', {
  variants: {
    width: {
      sm: 'max-w-4xl',
      md: 'max-w-5xl',
      lg: 'max-w-6xl',
      xl: 'max-w-7xl',
      full: 'max-w-full',
    },
  },
  defaultVariants: {
    width: 'xl',
  },
})

export interface SectionProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof sectionVariants>,
    VariantProps<typeof containerVariants> {
  as?: 'section' | 'div' | 'article' | 'aside'
  container?: boolean
}

export function Section({
  as: Component = 'section',
  spacing,
  background,
  width,
  container = true,
  className,
  children,
  ...props
}: SectionProps) {
  const content = container ? (
    <div className={cn(containerVariants({ width }))}>{children}</div>
  ) : (
    children
  )

  return (
    <Component
      className={cn(sectionVariants({ spacing, background }), className)}
      {...props}
    >
      {content}
    </Component>
  )
}
