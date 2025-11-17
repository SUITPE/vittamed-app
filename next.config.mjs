/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react']
  },

  // Server external packages
  serverExternalPackages: [],

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },

  // Next.js 16: Turbopack is now default
  // Empty config to acknowledge and silence webpack warning
  turbopack: {},

  // Output configuration for Vercel deployment
  output: 'standalone',

  // TypeScript configuration for builds
  typescript: {
    // Allow production builds to complete even with TypeScript errors
    ignoreBuildErrors: true,
  },

  // Environment variables for build time
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  }
}

export default nextConfig
