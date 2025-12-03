'use client'

import * as React from 'react'
import { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative inline-flex items-center justify-center rounded-full overflow-hidden',
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        default: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-xl',
        '2xl': 'w-24 h-24 text-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string | null
  alt?: string
  firstName?: string
  lastName?: string
  fallbackClassName?: string
}

/**
 * Get initials from first and last name
 */
function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0) || ''
  const last = lastName?.charAt(0) || ''
  return (first + last).toUpperCase() || 'U'
}

/**
 * Avatar component with image and initials fallback
 *
 * Usage:
 * <Avatar src={user.avatar_url} firstName="John" lastName="Doe" />
 * <Avatar src={null} firstName="Jane" /> // Shows initials
 * <Avatar size="lg" src="/path/to/image.jpg" alt="User avatar" />
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({
    className,
    size,
    src,
    alt = 'Avatar',
    firstName,
    lastName,
    fallbackClassName,
    ...props
  }, ref) => {
    const [imageError, setImageError] = useState(false)
    const [imageLoaded, setImageLoaded] = useState(false)

    const showImage = src && !imageError
    const initials = getInitials(firstName, lastName)

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, className }))}
        {...props}
      >
        {showImage ? (
          <>
            {/* Loading placeholder */}
            {!imageLoaded && (
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-r from-[#40C9C6] to-[#33a19e] flex items-center justify-center text-white font-medium animate-pulse',
                  fallbackClassName
                )}
              >
                {initials}
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-200',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <div
            className={cn(
              'w-full h-full bg-gradient-to-r from-[#40C9C6] to-[#33a19e] flex items-center justify-center text-white font-medium',
              fallbackClassName
            )}
          >
            {initials}
          </div>
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants, getInitials }
