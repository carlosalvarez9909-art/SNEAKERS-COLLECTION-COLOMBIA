import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Brand } from '../types';

const isImagePath = (value: string) =>
  /^(https?:\/\/|\/|data:image\/)/i.test(value) || /\.(svg|png|webp|jpe?g)(\?.*)?$/i.test(value);

// Busca el logo de la marca: primero el que tenga guardado (si es una imagen) y luego
// /public/brands/<id>.svg o .png. Si no hay ninguno, muestra el nombre como antes.
const BrandLogo: React.FC<{ brand: Brand }> = ({ brand }) => {
  const candidates = [
    ...(brand.logo && isImagePath(brand.logo) ? [brand.logo] : []),
    `/brands/${brand.id}.svg`,
    `/brands/${brand.id}.png`
  ];
  const [attempt, setAttempt] = useState(0);

  if (attempt >= candidates.length) {
    return (
      <span className="brand-wordmark font-sans text-3xl font-black uppercase tracking-[-0.06em] text-transparent transition-colors duration-300 group-hover:text-white sm:text-4xl">
        {brand.name}
      </span>
    );
  }

  return (
    <img
      src={candidates[attempt]}
      alt={brand.name}
      loading="lazy"
      draggable={false}
      onError={() => setAttempt(current => current + 1)}
      className="brand-logo-img h-12 w-auto max-w-[150px] object-contain sm:h-14"
    />
  );
};

// Carrusel infinito de marcas: cada logo lleva a la página de su marca.
export const BrandMarquee: React.FC<{ title?: string }> = ({ title = 'Nuestras marcas' }) => {
  const { brands, products, navigateTo } = useApp();
  if (!brands.length) return null;

  const countByBrand = new Map<string, number>();
  for (const product of products) {
    countByBrand.set(product.brandId, (countByBrand.get(product.brandId) ?? 0) + 1);
  }

  // Se repite la lista para que el desplazamiento no deje huecos en pantallas anchas.
  const base = brands.length < 6 ? [...brands, ...brands, ...brands] : brands;
  const track = [...base, ...base];

  return (
    <section className="relative py-14" aria-label={title}>
      <style>{`
        @keyframes brand-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .brand-track { animation: brand-marquee 36s linear infinite; }
        .brand-marquee:hover .brand-track { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .brand-track { animation: none; }
        }
      `}</style>

      <p className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
        {title}
      </p>

      <div
        className="brand-marquee overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)'
        }}
      >
        <div className="brand-track flex w-max items-center gap-6">
          {track.map((brand, index) => (
            <button
              key={`${brand.id}-${index}`}
              type="button"
              onClick={() => navigateTo({ type: 'brand', brandId: brand.id })}
              tabIndex={index < base.length ? 0 : -1}
              aria-hidden={index >= base.length}
              className="group flex min-w-[220px] flex-col items-center rounded-2xl border border-white/10 bg-white/[0.03] px-10 py-6 backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.06]"
            >
              <span className="flex h-14 items-center justify-center sm:h-16">
                <BrandLogo brand={brand} />
              </span>
              <span className="mt-2 font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-500 group-hover:text-neutral-300">
                {countByBrand.get(brand.id) ?? 0} modelos
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
