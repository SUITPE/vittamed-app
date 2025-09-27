import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

// Allow build without Stripe key for deployment
if (!stripeSecretKey && process.env.NODE_ENV !== 'production') {
  console.warn('STRIPE_SECRET_KEY is not set - Stripe functionality will be disabled')
}

export const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
}) : null

export const CURRENCY = 'mxn'

export const formatAmountForStripe = (amount: number, currency: string) => {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  })
  const parts = numberFormat.formatToParts(amount)
  let zeroDecimalCurrency = true
  for (const part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = false
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100)
}