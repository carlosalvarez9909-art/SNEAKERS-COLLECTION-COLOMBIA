import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';
import { syncOrderToShopify } from './_lib/shopify.js';

export const config = { api: { bodyParser: false } };

type BoldWebhookEvent = {
  type?: string;
  data?: {
    amount?: { currency?: string; total?: number };
    metadata?: { reference?: string };
  };
};

async function readRawBody(req: VercelRequest) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  if (process.env.BOLD_SECRET_KEY === undefined) {
    return res.status(500).json({ error: 'Falta configurar BOLD_SECRET_KEY.' });
  }

  try {
    const rawBody = await readRawBody(req);
    const signatureHeader = req.headers['x-bold-signature'];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
      return res.status(400).json({ error: 'Firma de Bold ausente o inválida.' });
    }

    const base64Body = Buffer.from(rawBody).toString('base64');
    const expected = createHmac('sha256', process.env.BOLD_SECRET_KEY)
      .update(base64Body, 'utf8')
      .digest();
    const received = Buffer.from(signature, 'hex');
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
      return res.status(401).json({ error: 'Firma de Bold no válida.' });
    }

    const event = JSON.parse(rawBody.toString('utf8')) as BoldWebhookEvent;
    const statusByEvent: Record<string, 'paid' | 'failed'> = {
      SALE_APPROVED: 'paid',
      SALE_REJECTED: 'failed',
      VOID_APPROVED: 'failed'
    };
    const nextStatus = statusByEvent[event.type ?? ''];
    if (!nextStatus) return res.status(200).json({ received: true });

    const reference = event.data?.metadata?.reference;
    if (!reference) {
      return res.status(400).json({ error: 'El evento no contiene la referencia del pedido.' });
    }

    const supabase = getServerSupabase();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total, currency, status')
      .eq('reference', reference)
      .maybeSingle();
    if (orderError) throw orderError;
    if (!order) {
      console.error('Webhook Bold con referencia desconocida:', reference);
      return res.status(200).json({ received: true });
    }

    const receivedTotal = event.data?.amount?.total;
    const receivedCurrency = event.data?.amount?.currency;
    if (!Number.isFinite(receivedTotal) || !receivedCurrency) {
      return res.status(400).json({ error: 'El evento no contiene el monto y la moneda.' });
    }
    if (
      Number(receivedTotal) !== Number(order.total) ||
      receivedCurrency !== order.currency
    ) {
      console.error('El monto o la moneda del webhook Bold no coincide:', reference);
      return res.status(400).json({ error: 'El monto recibido no coincide con el pedido.' });
    }

    let update = supabase.from('orders').update({ status: nextStatus }).eq('reference', reference);
    if (event.type === 'SALE_REJECTED') update = update.eq('status', 'pending');
    if (event.type === 'VOID_APPROVED') update = update.eq('status', 'paid');
    const { error: updateError } = await update;
    if (updateError) throw updateError;

    // Copia el pedido pagado a Shopify (pedidos y estadísticas).
    if (nextStatus === 'paid') await syncOrderToShopify(supabase, reference, { method: 'bold', paid: true });

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error procesando el webhook de Bold:', error);
    return res.status(500).json({ error: 'No se pudo procesar el webhook.' });
  }
}
