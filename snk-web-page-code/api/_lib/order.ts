import type { SupabaseClient } from '@supabase/supabase-js';

export type CheckoutItem = {
  productId: string;
  quantity: number;
  size: number;
  color: string;
};

export type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

type ProductPrice = {
  id: string;
  name: string;
  base_price: number;
  discount: number;
  sizes: number[];
  colors: { name: string; hex: string }[];
};

export type PricedOrder = {
  orderItems: {
    productId: string;
    productName: string;
    size: number;
    color: string;
    quantity: number;
    price: number;
  }[];
  total: number;
};

/** Revisa que el carrito y los datos del cliente vengan completos. Devuelve un mensaje de error o null. */
export function validateCheckout(items: unknown, customer: unknown): string | null {
  const c = customer as Partial<Customer> | undefined;
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50 ||
    !c ||
    typeof c.name !== 'string' || !c.name.trim() ||
    typeof c.phone !== 'string' || !c.phone.trim() ||
    typeof c.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()) ||
    typeof c.address !== 'string' || !c.address.trim() ||
    typeof c.city !== 'string' || !c.city.trim()
  ) {
    return 'El carrito o los datos del cliente están incompletos.';
  }

  if ((items as CheckoutItem[]).some(item =>
    !item ||
    typeof item.productId !== 'string' ||
    !item.productId ||
    !Number.isInteger(item.quantity) ||
    item.quantity < 1 ||
    item.quantity > 20 ||
    !Number.isFinite(item.size) ||
    typeof item.color !== 'string' ||
    item.color.length > 100
  )) {
    return 'Hay productos con datos inválidos en el carrito.';
  }
  return null;
}

/** Calcula el total con los precios reales de la base de datos (nunca con los del navegador). */
export async function priceOrder(
  supabase: SupabaseClient,
  items: CheckoutItem[]
): Promise<PricedOrder | { error: string }> {
  const productIds = [...new Set(items.map(item => item.productId))];
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, base_price, discount, sizes, colors')
    .in('id', productIds)
    .returns<ProductPrice[]>();

  if (error) throw error;
  if (!products || products.length !== productIds.length) {
    return { error: 'Uno o más productos ya no están disponibles.' };
  }

  const productById = new Map(products.map(product => [product.id, product]));
  const orderItems: PricedOrder['orderItems'] = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (
      !product ||
      !product.sizes?.map(Number).includes(Number(item.size)) ||
      !product.colors?.some(color => color.name === item.color)
    ) {
      return { error: 'Una talla, color o producto ya no está disponible.' };
    }
    const unitPrice = Math.round(Number(product.base_price) * (1 - Number(product.discount) / 100));
    orderItems.push({
      productId: product.id,
      productName: product.name,
      size: item.size,
      color: item.color,
      quantity: item.quantity,
      price: unitPrice
    });
  }

  const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isSafeInteger(total) || total < 1000) {
    return { error: 'El total debe ser de al menos 1.000 COP.' };
  }
  return { orderItems, total };
}

export const customerColumns = (customer: Customer) => ({
  customer_name: customer.name.trim(),
  customer_phone: customer.phone.trim(),
  customer_email: customer.email.trim(),
  customer_address: customer.address.trim(),
  customer_city: customer.city.trim()
});
