import React from 'react';
import { useApp } from '../context/AppContext';
 
export const LatestDrops: React.FC = () => {
  const { products, brands, navigateTo, formatPrice } = useApp();
 
  // "Recién llegados" = productos destacados del catálogo.
  // Si luego agregas un campo real (ej. createdAt) a Product, cambia este filtro por un sort por fecha.
  const drops = products.filter((p) => p.isTrending || p.isBestSeller);
  const track = drops.length ? [...drops, ...drops] : []; // se duplica para el loop continuo
 
  const brandName = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? '';
 
  if (!drops.length) return null;
 
  return (
    <section className="relative overflow-hidden bg-transparent py-16">
      <style>{`
        @keyframes drops-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .drops-track {
          animation: drops-marquee 42s linear infinite;
        }
        .drops-track:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .drops-track {
            animation: none;
            overflow-x: auto;
          }
        }
      `}</style>
 
 
      {/* Header */}
      <div className="relative z-10 mx-auto flex max-w-7xl items-end justify-between px-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-500">
            Recién llegados
          </p>
          <h2 className="mt-3 text-4xl font-black uppercase italic tracking-[-0.04em] text-white sm:text-5xl">
            Últimos lanzamientos
          </h2>
        </div>
 
        <button
          type="button"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="group hidden shrink-0 items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400 transition-colors hover:text-white sm:flex"
        >
          Ver todo
          <span className="text-red-500 transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>
        </button>
      </div>
 
      {/* Auto-scrolling track */}
      <div
        className="relative mt-10"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)'
        }}
      >
 
        <div className="drops-track flex w-max gap-5 px-4 sm:px-6 lg:px-8">
          {track.map((product, index) => {
            const hasDiscount = product.discount > 0;
            const finalPrice = hasDiscount
              ? product.basePrice * (1 - product.discount / 100)
              : product.basePrice;
 
            return (
              <button
                key={`${product.id}-${index}`}
                type="button"
                onClick={() => navigateTo({ type: 'product', productId: product.id })}
                className="group/card relative w-[220px] shrink-0 overflow-hidden rounded-2xl border border-neutral-900 bg-neutral-950 text-left transition-colors duration-300 hover:border-red-500/40 sm:w-[240px]"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-900">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    draggable={false}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-110"
                  />
 
                  {product.isLimited && (
                    <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-white">
                      Limitado
                    </span>
                  )}
 
                  {hasDiscount && (
                    <span className="absolute right-3 top-3 rounded-full bg-white px-2 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-neutral-950">
                      -{product.discount}%
                    </span>
                  )}
                </div>
 
                <div className="p-4">
                  <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-500">
                    {brandName(product.brandId)}
                  </p>
 
                  <h3 className="mt-1.5 line-clamp-1 text-sm font-bold uppercase text-white">
                    {product.name}
                  </h3>
 
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-sm font-bold text-white">
                      {formatPrice(finalPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-[11px] text-neutral-600 line-through">
                        {formatPrice(product.basePrice)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
 
      {/* Mobile CTA */}
      <div className="relative z-10 mt-8 flex justify-center sm:hidden">
        <button
          type="button"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-400"
        >
          Ver todo
          <span className="text-red-500">→</span>
        </button>
      </div>
    </section>
  );
};