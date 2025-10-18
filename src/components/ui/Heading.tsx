import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const headingVariants = cva('font-heading font-bold tracking-tight', {
  variants: {
    level: {
      h1: 'text-4xl sm:text-5xl lg:text-6xl xl:text-7xl',
      h2: 'text-3xl sm:text-4xl lg:text-5xl',
      h3: 'text-2xl sm:text-3xl lg:text-4xl',
      h4: 'text-xl sm:text-2xl lg:text-3xl',
      h5: 'text-lg sm:text-xl lg:text-2xl',
      h6: 'text-base sm:text-lg lg:text-xl',
    },
    gradient: {
      none: '',
      primary: 'bg-gradient-to-r from-[#40C9C6] to-[#A6E3A1] bg-clip-text text-transparent',
      medical: 'bg-gradient-to-r from-[#003A47] to-[#40C9C6] bg-clip-text text-transparent',
      vittasami:
        'bg-gradient-to-r from-[#40C9C6] via-[#A6E3A1] to-[#003A47] bg-clip-text text-transparent',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    },
  },
  defaultVariants: {
    level: 'h2',
    gradient: 'none',
    align: 'left',
  },
})

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function Heading({
  as,
  level,
  gradient,
  align,
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as || (level as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') || 'h2'

  return (
    <Component
      className={cn(headingVariants({ level, gradient, align }), className)}
      {...props}
    >
      {children}
    </Component>
  )
}
