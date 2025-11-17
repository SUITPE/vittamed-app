/**
 * Culqi Server-side Integration
 *
 * Configuración y funciones para procesar pagos con Culqi desde el backend
 * Documentación: https://docs.culqi.com/
 */

import Culqi from 'culqi-node';

// Validar variables de entorno
const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;

if (!CULQI_SECRET_KEY) {
  console.error('⚠ CULQI_SECRET_KEY no configurada en variables de entorno');
}

// Configuración del cliente Culqi
const culqi = new Culqi({
  privateKey: CULQI_SECRET_KEY || '',
});

/**
 * Precios de los planes en céntimos (PEN)
 * Basados en src/constants/pricing.ts
 */
export const PLAN_PRICES = {
  free: 0,
  care: 3900,       // S/ 39.00
  pro: 7900,        // S/ 79.00
  enterprise: 14900 // S/ 149.00
} as const;

export type PlanKey = keyof typeof PLAN_PRICES;

/**
 * Obtener precio de un plan en céntimos
 */
export function getPlanPriceInCents(planKey: string): number {
  if (planKey in PLAN_PRICES) {
    return PLAN_PRICES[planKey as PlanKey];
  }
  throw new Error(`Plan inválido: ${planKey}`);
}

/**
 * Validar token de Culqi
 * El token viene del frontend (Culqi.js) después de capturar datos de tarjeta
 */
export function isValidCulqiToken(tokenId: string): boolean {
  return tokenId.startsWith('tkn_') && tokenId.length > 20;
}

/**
 * Parámetros para crear un cargo
 */
export interface CreateChargeParams {
  tokenId: string;
  amount: number;
  email: string;
  description: string;
  metadata?: {
    tenant_id?: string;
    plan_key?: string;
    user_email?: string;
    [key: string]: any;
  };
}

/**
 * Crear cargo en Culqi
 *
 * @param params - Parámetros del cargo
 * @returns Objeto de cargo de Culqi
 */
export async function createCharge({
  tokenId,
  amount,
  email,
  description,
  metadata = {},
}: CreateChargeParams) {
  try {
    // Validar token
    if (!isValidCulqiToken(tokenId)) {
      throw new Error('Token de Culqi inválido');
    }

    // Validar monto (mínimo S/ 1.00)
    if (amount < 100) {
      throw new Error('El monto mínimo es S/ 1.00 (100 céntimos)');
    }

    console.log('💳 Creando cargo en Culqi:', {
      amount: `S/ ${(amount / 100).toFixed(2)}`,
      email,
      description,
    });

    // Crear cargo
    const charge = await culqi.charges.create({
      amount,
      currency_code: 'PEN',
      email,
      source_id: tokenId,
      description,
      metadata,
    });

    console.log('✅ Cargo creado exitosamente:', charge.id);

    return charge;
  } catch (error: any) {
    console.error('❌ Error al crear cargo en Culqi:', error);

    // Mapear errores comunes de Culqi
    const errorMessage = getReadableErrorMessage(error);
    throw new Error(errorMessage);
  }
}

/**
 * Obtener información de un cargo
 */
export async function getCharge(chargeId: string) {
  try {
    const charge = await culqi.charges.retrieve(chargeId);
    return charge;
  } catch (error: any) {
    console.error('❌ Error al obtener cargo:', error);
    throw new Error('No se pudo obtener la información del cargo');
  }
}

/**
 * Listar cargos (opcional, para reportes)
 */
export async function listCharges(options?: {
  creation_date_from?: string;
  creation_date_to?: string;
  limit?: number;
}) {
  try {
    const charges = await culqi.charges.list(options);
    return charges;
  } catch (error: any) {
    console.error('❌ Error al listar cargos:', error);
    throw new Error('No se pudieron obtener los cargos');
  }
}

/**
 * Mapear errores de Culqi a mensajes legibles
 */
function getReadableErrorMessage(error: any): string {
  const code = error.code || error.type || 'unknown';

  const errorMap: Record<string, string> = {
    card_declined: 'Tarjeta rechazada. Verifica los datos o intenta con otra tarjeta.',
    insufficient_funds: 'Fondos insuficientes en la tarjeta.',
    processing_error: 'Error al procesar el pago. Intenta nuevamente.',
    invalid_card: 'Tarjeta inválida. Verifica el número de tarjeta.',
    expired_card: 'Tarjeta expirada. Usa una tarjeta vigente.',
    incorrect_cvc: 'Código CVC incorrecto.',
    invalid_expiry_month: 'Mes de expiración inválido.',
    invalid_expiry_year: 'Año de expiración inválido.',
    invalid_number: 'Número de tarjeta inválido.',
    token_already_used: 'Este token ya fue utilizado. Recarga la página e intenta de nuevo.',
    invalid_amount: 'Monto inválido. Debe ser mayor a S/ 1.00',
  };

  return errorMap[code] || `Error de pago: ${error.message || 'Desconocido'}`;
}

/**
 * Verificar si un cargo fue exitoso
 */
export function isChargeSuccessful(charge: any): boolean {
  return charge && charge.outcome && charge.outcome.type === 'venta_exitosa';
}

/**
 * Extraer información de la tarjeta del cargo
 */
export function getCardInfoFromCharge(charge: any): {
  brand: string;
  last4: string;
} | null {
  if (!charge || !charge.source) {
    return null;
  }

  return {
    brand: charge.source.iin?.card_brand || 'unknown',
    last4: charge.source.card_number?.slice(-4) || '****',
  };
}

/**
 * Formatear monto de céntimos a soles
 */
export function formatAmountToSoles(cents: number): string {
  return `S/ ${(cents / 100).toFixed(2)}`;
}

/**
 * Cliente Culqi para uso directo (exportado para casos avanzados)
 */
export { culqi };

export default {
  createCharge,
  getCharge,
  listCharges,
  isChargeSuccessful,
  getCardInfoFromCharge,
  getPlanPriceInCents,
  isValidCulqiToken,
  formatAmountToSoles,
  PLAN_PRICES,
};
