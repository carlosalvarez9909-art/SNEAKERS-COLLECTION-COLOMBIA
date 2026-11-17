import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const reference = typeof req.query.reference === 'string' ? req.query.reference : '';
  if (!/^SNK-[\da-f-]{36}$/i.test(reference)) {
    return res.status(400).json({ error: 'Referencia inválida.' });
  }

  try {
    const { data, error } = await getServerSupabase()
      .from('orders')
      .select('status')
      .eq('reference', reference)
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Pedido no encontrado.' });
    return res.status(200).json({ status: data.status });
  } catch (error) {
    console.error('Error consultando el estado del pedido:', error);
    return res.status(500).json({ error: 'No se pudo consultar el pedido.' });
  }
}
