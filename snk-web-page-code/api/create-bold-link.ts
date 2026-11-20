import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';
import { customerColumns, priceOrder, validateCheckout, type CheckoutItem, type Customer } from './_lib/order.js';

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

  const invalid = validateCheckout(items, customer);
  if (invalid || !items || !customer) {
    return res.status(400).json({ error: invalid ?? 'Datos incompletos.' });
  }

  let reference: string | null = null;
  let supabaseClient: ReturnType<typeof getServerSupabase> | null = null;
  try {
    const supabase = getServerSupabase();
    supabaseClient = supabase;
    const priced = await priceOrder(supabase, items);
    if ('error' in priced) return res.status(400).json({ error: priced.error });
    const { orderItems, total } = priced;

    reference = `SNK-${crypto.randomUUID()}`;
    const { error: orderError } = await supabase.from('orders').insert({
      reference,
      items: orderItems,
      total,
      currency: 'COP',
      ...customerColumns(customer),
      status: 'pending',
      payment_method: 'bold'
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
