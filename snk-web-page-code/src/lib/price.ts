// Precio final con descuento, redondeado a un precio "mental" que termina en 900.
// Ej.: 299.900 con 40% = 179.940 → $179.900. Sin descuento se respeta el precio tal cual.
export function finalUnitPrice(basePrice: number, discount: number): number {
  const base = Number(basePrice) || 0;
  const pct = Number(discount) || 0;
  if (pct <= 0) return base;
  const raw = base * (1 - pct / 100);
  return Math.max(0, Math.ceil(raw / 1000) * 1000 - 100);
}

// Envío gratis solo para pares con precio final desde $179.900 (precio mínimo de la tienda).
export const FREE_SHIPPING_MIN = 179900;
export const hasFreeShipping = (finalPrice: number) => finalPrice >= FREE_SHIPPING_MIN;
