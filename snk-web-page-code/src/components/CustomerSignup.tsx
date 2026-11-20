import React, { useState } from 'react';
import { CheckCircle, Gift, Percent, Sparkles } from 'lucide-react';

const PERKS = [
  { icon: Percent, text: 'Descuentos exclusivos para registrados' },
  { icon: Sparkles, text: 'Aviso primero de nuevos lanzamientos' },
  { icon: Gift, text: 'Promos y cupones por WhatsApp o correo' }
];

// Registro de clientes: los datos se guardan en Supabase (tabla customers) a través del servidor.
export const CustomerSignup: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', accepts: false });
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState('');

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: key === 'accepts' ? event.target.checked : event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const response = await fetch('/api/register-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo completar el registro.');
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el registro.');
      setStatus('idle');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-600 focus:border-red-500/70';
  const labelClass = 'mb-1 block text-[10px] uppercase tracking-[0.2em] text-neutral-500';

  return (
    <div className="glow-card rounded-3xl border border-neutral-900 bg-neutral-950 p-6 sm:p-8">
      <p className="red-glow-label text-[11px] font-bold uppercase tracking-[0.25em] text-red-500">Club Sneakers Collection</p>
      <h2 className="mt-2 text-2xl font-black uppercase text-white sm:text-3xl">Regístrate y ahorra</h2>
      <ul className="mt-5 space-y-2.5">
        {PERKS.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3 text-sm text-neutral-300">
            <Icon className="h-4 w-4 shrink-0 text-red-500" />
            {text}
          </li>
        ))}
      </ul>

      {status === 'done' ? (
        <div className="mt-7 rounded-2xl border border-red-900/60 bg-red-950/20 p-5 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-3 font-bold uppercase text-white">¡Ya eres parte del club!</p>
          <p className="mt-1 text-sm text-neutral-400">Te escribiremos con las próximas promos y descuentos.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-7 space-y-4">
          <div>
            <label className={labelClass}>Nombre</label>
            <input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={set('name')} className={inputClass} placeholder="Tu nombre" />
          </div>
          <div>
            <label className={labelClass}>Correo</label>
            <input required type="email" maxLength={120} autoComplete="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="tucorreo@gmail.com" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>WhatsApp / Celular</label>
              <input required type="tel" inputMode="tel" maxLength={20} autoComplete="tel" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="300 123 4567" />
            </div>
            <div>
              <label className={labelClass}>Ciudad (opcional)</label>
              <input maxLength={60} autoComplete="address-level2" value={form.city} onChange={set('city')} className={inputClass} placeholder="Cali" />
            </div>
          </div>
          <label className="flex items-start gap-3 text-xs leading-relaxed text-neutral-400">
            <input type="checkbox" required checked={form.accepts} onChange={set('accepts')} className="mt-0.5 h-4 w-4 shrink-0 accent-red-600" />
            Autorizo a Sneakers Collection a guardar mis datos para enviarme promociones y novedades (Ley 1581 de 2012). Puedo pedir que los borren en cualquier momento por WhatsApp.
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={status === 'sending'}
            className="glow-button w-full rounded-full bg-red-600 px-6 py-3 text-xs font-bold uppercase text-white transition-colors hover:bg-red-500 disabled:opacity-60"
          >
            {status === 'sending' ? 'Registrando…' : 'Registrarme'}
          </button>
        </form>
      )}
    </div>
  );
};
