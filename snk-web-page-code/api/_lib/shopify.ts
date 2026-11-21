import type { SupabaseClient } from '@supabase/supabase-js';

// Copia los pedidos de la página a Shopify para ver pedidos y estadísticas en la app de Shopify.
// Se activa solo cuando en Vercel existen SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID y SHOPIFY_CLIENT_SECRET.

const API_VERSION = '2025-10';

let cachedToken: { value: string; expiresAt: number } | null = null;

export const shopifySyncEnabled = () =>
  Boolean(process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID as string,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET as string
    })
  });
  if (!res.ok) throw new Error(`Shopify no entregó el token (${res.status}).`);
  const json = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 86_400) * 1000 };
  return cachedToken.value;
}

async function shopifyGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': await getToken() },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) throw new Error(`Error de Shopify (${res.status}).`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error(`Error de Shopify: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}

type StoredOrder = {
  reference: string;
  items: { productId: string; productName: string; size: number; color: string; quantity: number; price: number }[];
  total: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_address: string;
  customer_city: string;
  shopify_order_id?: string | null;
};

const ORDER_CREATE = `mutation ($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) {
  orderCreate(order: $order, options: $options) {
    order { id name }
    userErrors { field message }
  }
}`;

/**
 * Crea el pedido en Shopify (una sola vez por referencia) y guarda su id en Supabase.
 * Nunca lanza error: si falla, el pedido sigue funcionando normal en la página y se registra en el log.
 */
export async function syncOrderToShopify(
  supabase: SupabaseClient,
  reference: string,
  payment: { method: 'bold' | 'contraentrega'; paid: boolean }
) {
  if (!shopifySyncEnabled()) return;
  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('reference, items, total, customer_name, customer_phone, customer_email, customer_address, customer_city, shopify_order_id')
      .eq('reference', reference)
      .maybeSingle<StoredOrder>();
    if (error) throw error;
    if (!order || order.shopify_order_id) return;

    const productIds = [...new Set(order.items.map(item => item.productId))];
    const { data: products } = await supabase
      .from('products')
      .select('id, shopify_variants')
      .in('id', productIds);
    const variantsById = new Map(
      (products ?? []).map(p => [p.id as string, (p.shopify_variants ?? {}) as Record<string, string>])
    );

    const money = (amount: number) => ({ shopMoney: { amount: String(amount), currencyCode: 'COP' } });
    const lineItems = order.items.map(item => {
      const variant = variantsById.get(item.productId)?.[String(item.size)];
      const base = { quantity: item.quantity, priceSet: money(item.price) };
      return variant
        ? { ...base, variantId: `gid://shopify/ProductVariant/${variant}` }
        : { ...base, title: item.productName, variantTitle: `Talla ${item.size} · ${item.color}`, requiresShipping: true };
    });

    const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Number(order.total);
    const discount = Math.max(0, subtotal - total);

    const [firstName, ...rest] = order.customer_name.trim().split(/\s+/);
    const address = {
      firstName,
      lastName: rest.join(' ') || firstName,
      address1: order.customer_address,
      city: order.customer_city,
      countryCode: 'CO',
      phone: order.customer_phone
    };

    const input: Record<string, unknown> = {
      currency: 'COP',
      email: order.customer_email,
      phone: order.customer_phone,
      shippingAddress: address,
      billingAddress: address,
      lineItems,
      financialStatus: payment.paid ? 'PAID' : 'PENDING',
      sourceIdentifier: order.reference,
      note: `Pedido de la página web · ${order.reference} · ${payment.method === 'bold' ? 'Pagado con Bold' : 'Contra entrega'}`,
      tags: ['pagina-web', payment.method === 'bold' ? 'bold' : 'contraentrega']
    };
    if (discount > 0) {
      input.discountCode = { itemFixedDiscountCode: { code: 'CUPON-WEB', amountSet: money(discount) } };
    }
    if (payment.paid) {
      input.transactions = [{ kind: 'SALE', status: 'SUCCESS', gateway: 'Bold', amountSet: money(total) }];
    }

    const data = await shopifyGraphql<{
      orderCreate: { order: { id: string; name: string } | null; userErrors: { message: string }[] };
    }>(ORDER_CREATE, { order: input, options: { sendReceipt: false, inventoryBehaviour: 'BYPASS' } });

    const created = data.orderCreate.order;
    if (!created) throw new Error(data.orderCreate.userErrors.map(e => e.message).join('; '));
    await supabase.from('orders').update({ shopify_order_id: created.id }).eq('reference', reference);
  } catch (err) {
    console.error('No se pudo copiar el pedido a Shopify:', reference, err);
  }
}
