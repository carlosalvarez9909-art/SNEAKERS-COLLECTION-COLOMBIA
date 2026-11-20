import type { VercelRequest, VercelResponse } from './_lib/vercel';
import { getServerSupabase } from './_lib/supabase.js';

// Registro de clientes para promos y descuentos. Solo el servidor escribe en la tabla customers.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const text = (value: unknown, max: number) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ').slice(0, max) : '';

  const name = text(body.name, 80);
  const email = text(body.email, 120).toLowerCase();
  const phone = text(body.phone, 20).replace(/[^\d+]/g, '');
  const city = text(body.city, 60);

  if (body.accepts !== true) {
    return res.status(400).json({ error: 'Debes aceptar el tratamiento de datos para registrarte.' });
  }
  if (name.length < 2) return res.status(400).json({ error: 'Escribe tu nombre.' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Correo no válido.' });
  if (phone.replace(/\D/g, '').length < 7) return res.status(400).json({ error: 'Teléfono no válido.' });

  try {
    const supabase = getServerSupabase();
    // Si el correo ya existe, se actualizan sus datos (no se duplica).
    const { error } = await supabase
      .from('customers')
      .upsert({ name, email, phone, city: city || null, accepts_marketing: true }, { onConflict: 'email' });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error registrando cliente:', error);
    return res.status(500).json({ error: 'No se pudo completar el registro. Intenta de nuevo.' });
  }
}
