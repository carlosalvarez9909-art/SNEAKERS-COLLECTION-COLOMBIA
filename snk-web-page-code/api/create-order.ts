import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';
import { customerColumns, priceOrder, validateCheckout, type CheckoutItem, type Customer } from './_lib/order.js';

// Pedido contra entrega: se guarda en Supabase para que aparezca en el panel de administración.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const body = req.body as { items?: CheckoutItem[]; customer?: Customer; couponCode?: string } | undefined;
  const items = body?.items;
  const customer = body?.customer;
  const invalid = validateCheckout(items, customer);
  if (invalid || !items || !customer) {
    return res.status(400).json({ error: invalid ?? 'Datos incompletos.' });
  }

  try {
    const supabase = getServerSupabase();
    const priced = await priceOrder(supabase, items);
    if ('error' in priced) return res.status(400).json({ error: priced.error });

    // Cupón (opcional): se valida en la base de datos, nunca se confía en el navegador.
    let total = priced.total;
    const couponCode = typeof body?.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : '';
    if (couponCode) {
      const today = new Date().toISOString().slice(0, 10);
      const { data: coupon } = await supabase
        .from('coupons')
        .select('type, value, valid_from, valid_to')
        .eq('code', couponCode)
        .lte('valid_from', today)
        .gte('valid_to', today)
        .maybeSingle();
      if (coupon) {
        const discount = coupon.type === 'percent'
          ? Math.round(total * (Number(coupon.value) / 100))
          : Math.round(Number(coupon.value));
        total = Math.max(0, total - discount);
      }
    }

    const reference = `SNK-${crypto.randomUUID()}`;
    const { error } = await supabase.from('orders').insert({
      reference,
      items: priced.orderItems,
      total,
      currency: 'COP',
      ...customerColumns(customer),
      status: 'pending',
      payment_method: 'contraentrega'
    });
    if (error) throw error;

    return res.status(200).json({ reference, total, items: priced.orderItems });
  } catch (error) {
    console.error('Error creando el pedido contra entrega:', error);
    return res.status(500).json({ error: 'No se pudo registrar el pedido.' });
  }
}
