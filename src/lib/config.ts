/**
 * Configuración centralizada de VittaSami
 * Single source of truth para dominios, rutas y configuraciones globales
 */

// Dominios
export const DOMAINS = {
  main: process.env.NEXT_PUBLIC_DOMAIN_MAIN || 'https://vittasami.com',
  app: process.env.NEXT_PUBLIC_DOMAIN_APP || 'https://app.vittasami.lat',
} as const

// Rutas de Marketing (vittasami.com)
export const MARKETING_ROUTES = [
  '/',
  '/pricing',
  '/invest',
  '/features',
  '/recursos',
  '/contacto',
] as const

// Rutas de Aplicación (app.vittasami.lat)
export const APP_ROUTES = [
  '/dashboard',
  '/agenda',
  '/patients',
  '/appointments',
  '/my-appointments',
  '/settings',
  '/profile',
  '/admin',
  '/receptionist',
  '/member',
] as const

// Rutas compartidas (accesibles desde ambos dominios)
export const SHARED_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/callback',
  '/booking',
  '/payment',
] as const

// Configuración de Analytics
export const ANALYTICS = {
  googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID,
  mixpanelToken: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
} as const

// Configuración de Email para inversores
export const EMAIL_CONFIG = {
  investorEmail: process.env.INVESTOR_EMAIL || 'alvaro@abp.pe',
  smtpHost: process.env.SMTP_HOST,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
} as const

// Brand Colors (para uso en JS cuando sea necesario)
export const BRAND_COLORS = {
  primary: '#40C9C6',
  accent: '#A6E3A1',
  dark: '#003A47',
  white: '#FFFFFF',
  softBg: '#F4FAF9',
} as const

// Helpers
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Verifica si una ruta es de marketing
 */
export function isMarketingRoute(pathname: string): boolean {
  return MARKETING_ROUTES.some(route =>
    route === pathname || pathname.startsWith(route + '/')
  )
}

/**
 * Verifica si una ruta es de la aplicación
 */
export function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Verifica si una ruta es compartida
 */
export function isSharedRoute(pathname: string): boolean {
  return SHARED_ROUTES.some(route => pathname.startsWith(route))
}
