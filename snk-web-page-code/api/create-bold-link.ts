import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';

type CheckoutItem = {
  productId: string;
  quantity: number;
  size: number;
  color: string;
};

type Customer = {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const apiKey = process.env.BOLD_API_KEY?.trim();
  const appUrl = process.env.APP_URL?.replace(/\/+$/, '');
  if (!apiKey || !appUrl?.startsWith('https://')) {
    return res.status(500).json({ error: 'Configura BOLD_API_KEY y APP_URL con la URL HTTPS de tu tienda.' });
  }

  const body = req.body as { items?: CheckoutItem[]; customer?: Customer } | undefined;
  const items = body?.items;
  const customer = body?.customer;

  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50 ||
    !customer ||
    typeof customer.name !== 'string' ||
    !customer.name.trim() ||
    typeof customer.phone !== 'string' ||
    !customer.phone.trim() ||
    typeof customer.email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ||
    typeof customer.address !== 'string' ||
    !customer.address.trim() ||
    typeof customer.city !== 'string' ||
    !customer.city.trim()
  ) {
    return res.status(400).json({ error: 'El carrito o los datos del cliente están incompletos.' });
  }

  if (items.some(item =>
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
    return res.status(400).json({ error: 'Hay productos con datos inválidos en el carrito.' });
  }

  let reference: string | null = null;
  let supabaseClient: ReturnType<typeof getServerSupabase> | null = null;
  try {
    const supabase = getServerSupabase();
    supabaseClient = supabase;
    const productIds = [...new Set(items.map(item => item.productId))];
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, base_price, discount, sizes, colors')
      .in('id', productIds)
      .returns<ProductPrice[]>();

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      return res.status(400).json({ error: 'Uno o más productos ya no están disponibles.' });
    }

    const productById = new Map(products.map(product => [product.id, product]));
    const orderItems = [];
    for (const item of items) {
      const product = productById.get(item.productId);
      if (
        !product ||
        !product.sizes?.includes(item.size) ||
        !product.colors?.some(color => color.name === item.color)
      ) {
        return res.status(400).json({ error: 'Una talla, color o producto ya no está disponible.' });
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
      return res.status(400).json({ error: 'El total debe ser de al menos 1.000 COP.' });
    }

    reference = `SNK-${crypto.randomUUID()}`;
    const { error: orderError } = await supabase.from('orders').insert({
      reference,
      items: orderItems,
      total,
      currency: 'COP',
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      customer_email: customer.email.trim(),
      customer_address: customer.address.trim(),
      customer_city: customer.city.trim(),
      status: 'pending'
    });
    if (orderError) throw orderError;

    const boldResponse = await fetch('https://integrations.api.bold.co/online/link/v1', {
      method: 'POST',
      headers: {
        Authorization: `x-api-key ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount_type: 'CLOSE',
        amount: {
          currency: 'COP',
          total_amount: total,
          taxes: [],
          tip_amount: 0
        },
        reference,
        description: `Compra Sneakers Collection ${reference}`.slice(0, 100),
        callback_url: `${appUrl}/pago-resultado?reference=${encodeURIComponent(reference)}`,
        payer_email: customer.email.trim()
      })
    });

    const boldData = await boldResponse.json() as {
      payload?: { url?: string };
      errors?: unknown[];
    };
    const paymentUrl = boldData.payload?.url;
    if (!boldResponse.ok || !paymentUrl || !paymentUrl.startsWith('https://')) {
      await supabase.from('orders').update({ status: 'failed' }).eq('reference', reference);
      console.error('Bold no creó el link de pago:', boldData);
      return res.status(502).json({ error: 'Bold no pudo crear el link de pago. Inténtalo nuevamente.' });
    }

    return res.status(200).json({ paymentUrl, reference });
  } catch (error) {
    if (reference && supabaseClient) {
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ status: 'failed' })
        .eq('reference', reference)
        .eq('status', 'pending');
      if (updateError) console.error('No se pudo marcar el pedido fallido:', updateError);
    }
    console.error('Error creando el link de Bold:', error);
    return res.status(500).json({ error: 'No se pudo crear el link de pago.' });
  }
}
