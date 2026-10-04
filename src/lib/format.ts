/**
 * Formateo de moneda para la interfaz.
 *
 * Vive aparte de los componentes porque el precio de un inmueble aparece en la
 * card, en la ficha técnica y en los filtros: si cada uno define su propio
 * Intl.NumberFormat, el mismo importe termina escrito de dos formas distintas.
 */
import type { Currency } from '../types';

/**
 * `A consultar` es lo que muestra la app cuando el precio es 0.
 *
 * El 0 no es un dato: es el default del schema para una ficha cargada sin
 * precio, y pintar "US$ 0" haría creer que se vende o se alquila gratis.
 */
export const PRICE_ON_CONSULT = 'A consultar';

/**
 * Formatea el importe con el separador de miles argentino (230.000).
 *
 * Para USD se usa es-AR igual que para ARS a propósito: el precio en dólares se
 * lee en el mismo mercado y con el mismo criterio que el resto de los números.
 * El resultado de Intl distingue las monedas por sí solo (US$ contra $), que es
 * justo lo que evita confusiones entre un alquiler en USD y uno en pesos.
 */
export const formatPrice = (value: number, currency: Currency): string => {
  if (!Number.isFinite(value) || value <= 0) return PRICE_ON_CONSULT;

  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Una moneda mal guardada no debe romper la renderización de la card.
    return `${value} ${currency}`;
  }
};

export const hasPrice = (value: number): boolean => Number.isFinite(value) && value > 0;
