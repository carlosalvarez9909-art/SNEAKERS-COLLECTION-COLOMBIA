import React from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';

// Carrusel infinito de marcas: cada logo lleva a la página de su marca.
export const BrandMarquee: React.FC<{ title?: string }> = ({ title = 'Nuestras marcas' }) => {
  const { brands: allBrands, products, navigateTo } = useApp();
  // Solo marcas con logo y con tenis publicados.
  const brands = allBrands.filter(b => b.logo && products.some(p => p.brandId === b.id));
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
              className="group flex w-[220px] shrink-0 flex-col items-center bg-transparent px-6 py-6 transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="flex h-[72px] items-center justify-center">
                <BrandLogo
                  brand={brand}
                  fit={{ area: 5600, maxWidth: 170, maxHeight: 70 }}
                  className="brand-logo-img h-12 w-auto max-w-[170px]"
                  fallbackClassName="brand-wordmark font-sans text-3xl font-black uppercase tracking-[-0.06em] text-transparent transition-colors duration-300 group-hover:text-white sm:text-4xl"
                />
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
