import { cn } from '@/lib/utils'

export interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  gradient?: 'primary' | 'medical' | 'vittasami' | 'custom'
  customGradient?: string
}

const gradients = {
  primary: 'from-[#40C9C6] to-[#A6E3A1]',
  medical: 'from-[#003A47] to-[#40C9C6]',
  vittasami: 'from-[#40C9C6] via-[#A6E3A1] to-[#003A47]',
}

export function GradientText({
  gradient = 'primary',
  customGradient,
  className,
  children,
  ...props
}: GradientTextProps) {
  const gradientClass =
    gradient === 'custom' && customGradient
      ? customGradient
      : gradients[gradient as keyof typeof gradients]

  return (
    <span
      className={cn(
        'bg-gradient-to-r bg-clip-text text-transparent',
        gradientClass,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
