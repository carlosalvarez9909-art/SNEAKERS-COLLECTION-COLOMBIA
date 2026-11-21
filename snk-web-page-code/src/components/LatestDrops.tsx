import React, { useCallback, useEffect, useRef, useState } from 'react';
import { finalUnitPrice } from '../lib/price';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AUTOPLAY_MS = 3800;

// Recién llegados: carrusel deslizable que siempre deja una tarjeta centrada.
export const LatestDrops: React.FC = () => {
  const { products, brands, navigateTo, formatPrice } = useApp();
  const drops = products.slice(0, 10);
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const pausedUntil = useRef(0);
  const activeRef = useRef(0);

  const brandName = (brandId: string) => brands.find(b => b.id === brandId)?.name ?? '';

  const scrollToCard = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.children[index] as HTMLElement | undefined;
    if (!card) return;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: 'smooth' });
  }, []);

  // La tarjeta activa es la más cercana al centro.
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    activeRef.current = best;
    setActive(best);
  };

  const pause = () => {
    pausedUntil.current = Date.now() + 7000;
  };

  const go = (index: number) => {
    pause();
    scrollToCard((index + drops.length) % drops.length);
  };

  // Avanza solo; se detiene un rato cuando el cliente desliza o toca.
  useEffect(() => {
    if (drops.length < 2) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const timer = window.setInterval(() => {
      if (Date.now() < pausedUntil.current || document.hidden) return;
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      scrollToCard((activeRef.current + 1) % drops.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [drops.length, scrollToCard]);

  // Centra la primera tarjeta al cargar.
  useEffect(() => {
    const track = trackRef.current;
    if (track) track.scrollLeft = 0;
  }, [drops.length]);

  if (!drops.length) return null;

  return (
    <section className="relative overflow-hidden bg-transparent py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 mx-auto flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-500">Recién llegados</p>
          <h2 className="luxury-title mt-3 text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl">Últimos lanzamientos</h2>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => go(active - 1)}
            className="red-glow-hover rounded-full border border-neutral-800 p-3 text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => go(active + 1)}
            className="red-glow-hover rounded-full border border-neutral-800 p-3 text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      <div
        ref={trackRef}
        onScroll={onScroll}
        onTouchStart={pause}
        onPointerDown={pause}
        onWheel={pause}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-[14vw] py-6 sm:gap-6 sm:px-[calc(50%-150px)]"
      >
        {drops.map((product, index) => {
          const hasDiscount = product.discount > 0;
          const finalPrice = finalUnitPrice(product.basePrice, product.discount);
          const isActive = index === active;

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => (isActive ? navigateTo({ type: 'product', productId: product.id }) : go(index))}
              className={`group/card relative w-[72vw] max-w-[300px] shrink-0 snap-center overflow-hidden rounded-3xl border text-left transition-all duration-500 ease-out sm:w-[300px] ${
                isActive
                  ? 'scale-100 border-red-600/60 bg-neutral-950 opacity-100 shadow-[0_0_40px_rgba(209,10,31,0.28)]'
                  : 'scale-[0.88] border-neutral-900 bg-neutral-950/70 opacity-45'
              }`}
            >
              <div className="relative flex aspect-square items-center justify-center overflow-hidden p-4">
                <div className={`pointer-events-none absolute inset-8 rounded-full bg-red-700/30 blur-3xl transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                <img
                  src={product.images[0]}
                  alt={product.name}
                  draggable={false}
                  referrerPolicy="no-referrer"
                  className={`relative max-h-full max-w-full object-contain drop-shadow-[0_20px_25px_rgba(0,0,0,0.6)] transition-transform duration-700 ${isActive ? '-rotate-6 scale-105' : 'rotate-0 scale-95'}`}
                />
                {product.isLimited && (
                  <span className="absolute left-4 top-4 rounded-full bg-red-600 px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-white">
                    Limitado
                  </span>
                )}
                {hasDiscount && (
                  <span className="absolute right-4 top-4 rounded-full bg-white px-2.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-neutral-950">
                    -{product.discount}%
                  </span>
                )}
              </div>

              <div className="px-5 pb-5">
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-500">{brandName(product.brandId)}</p>
                <h3 className="mt-1.5 line-clamp-1 text-sm font-bold uppercase text-white">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex items-baseline gap-2">
                    <span className="text-base font-black text-white">{formatPrice(finalPrice)}</span>
                    {hasDiscount && <span className="text-[11px] text-neutral-600 line-through">{formatPrice(product.basePrice)}</span>}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest text-red-500 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                    Ver →
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex justify-center gap-2">
        {drops.map((p, i) => (
          <button
            key={p.id}
            type="button"
            aria-label={`Ir al producto ${i + 1}`}
            onClick={() => go(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-7 bg-red-600 shadow-[0_0_10px_rgba(209,10,31,0.8)]' : 'w-1.5 bg-neutral-700'}`}
          />
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="group flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 transition-colors hover:text-white"
        >
          Ver todo
          <span className="text-red-500 transition-transform duration-300 group-hover:translate-x-2">→</span>
        </button>
      </div>
    </section>
  );
};
