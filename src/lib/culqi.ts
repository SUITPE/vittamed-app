/**
 * Configuración de Culqi para pagos
 * VittaSami - Procesamiento de pagos en PEN (soles peruanos)
 */

// Tipos de Culqi
declare global {
  interface Window {
    Culqi: {
      publicKey: string
      token: {
        id: string
        email: string
      } | null
      error: {
        merchant_message: string
        user_message: string
      } | null
      settings: (config: CulqiSettings) => void
      open: () => void
      close: () => void
      createToken: () => void
    }
  }
}

export interface CulqiSettings {
  title: string
  currency: 'PEN'
  description: string
  amount: number // En céntimos (ej: 3900 = S/39.00)
}

export interface CulqiToken {
  id: string
  email: string
}

export interface CulqiError {
  merchant_message: string
  user_message: string
}

// Clave pública de Culqi (desde env)
export const CULQI_PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || ''

// Moneda
export const CURRENCY = 'PEN'

/**
 * Convierte monto en soles a céntimos para Culqi
 * @param amount - Monto en soles (ej: 39.00)
 * @returns Monto en céntimos (ej: 3900)
 */
export const formatAmountForCulqi = (amount: number): number => {
  return Math.round(amount * 100)
}

/**
 * Convierte monto de céntimos a soles
 * @param amount - Monto en céntimos (ej: 3900)
 * @returns Monto en soles (ej: 39.00)
 */
export const formatAmountFromCulqi = (amount: number): number => {
  return amount / 100
}

/**
 * Formatea monto para display
 * @param amount - Monto en soles
 * @returns String formateado (ej: "S/ 39.00")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: CURRENCY,
  }).format(amount)
}

/**
 * Tarjetas de prueba de Culqi
 * Usa estas en ambiente de desarrollo/testing
 */
export const CULQI_TEST_CARDS = {
  visa: {
    number: '4111111111111111',
    cvv: '123',
    expiration: '12/25',
    email: 'test@culqi.com',
  },
  mastercard: {
    number: '5111111111111118',
    cvv: '123',
    expiration: '12/25',
    email: 'test@culqi.com',
  },
  declined: {
    number: '4000000000000002',
    cvv: '123',
    expiration: '12/25',
    email: 'test@culqi.com',
  },
}

/**
 * Configuración inicial de Culqi
 * Debe llamarse cuando el script de Culqi esté cargado
 */
export const initializeCulqi = (): boolean => {
  if (typeof window === 'undefined') {
    console.warn('Culqi: Window is not defined (SSR)')
    return false
  }

  if (!window.Culqi) {
    console.warn('Culqi: Script not loaded yet')
    return false
  }

  if (!CULQI_PUBLIC_KEY) {
    console.error('Culqi: NEXT_PUBLIC_CULQI_PUBLIC_KEY is not set')
    return false
  }

  window.Culqi.publicKey = CULQI_PUBLIC_KEY
  console.log('✅ Culqi initialized with public key')
  return true
}

/**
 * Configurar Culqi Checkout
 * @param config - Configuración del checkout (title, amount, description)
 */
export const configureCulqi = (config: CulqiSettings): void => {
  if (!window.Culqi) {
    throw new Error('Culqi script no está cargado')
  }

  window.Culqi.settings(config)
}

/**
 * Abrir modal de Culqi
 */
export const openCulqiCheckout = (): void => {
  if (!window.Culqi) {
    throw new Error('Culqi script no está cargado')
  }

  window.Culqi.open()
}
