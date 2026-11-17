import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { GitCompareArrows, Star, X } from 'lucide-react';
import { Product } from '../types';

type ProductId = Product['id'];

const FloatingTrendCard: React.FC<{
  product: Product;
  index: number;
  brandLabel: string;
  selected: boolean;
  onOpenProduct: () => void;
  onSelectCompare: (event: React.MouseEvent<HTMLButtonElement>) => void;
}> = ({ product, index, brandLabel, selected, onOpenProduct, onSelectCompare }) => {
  const cardRef = useRef<HTMLElement>(null);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty('--mx', `${x * 24}px`);
    card.style.setProperty('--my', `${y * 18}px`);
    card.style.setProperty('--rx', `${y * -8}deg`);
    card.style.setProperty('--ry', `${x * 10}deg`);
    card.style.setProperty('--rz', `${x * -5}deg`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty('--mx', '0px');
    card.style.setProperty('--my', '0px');
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--rz', '0deg');
  };

  return (
    <motion.article
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onOpenProduct}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenProduct();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{
        opacity: 0,
        y: 70,
        scale: 0.92,
        x: index % 2 === 0 ? -26 : 26
      }}
      whileInView={{
        opacity: 1,
        y: index % 2 === 0 ? 0 : 34,
        scale: 1,
        x: 0
      }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{
        duration: 0.75,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`trend-floating-card group relative min-h-[470px] cursor-pointer overflow-visible outline-none ${
        selected ? 'is-selected' : ''
      }`}
    >
      <div className="trend-floating-inner relative flex h-full flex-col justify-between px-2 py-3">
        <div className="relative flex h-64 items-center justify-center overflow-visible">
          <div className="trend-void-glow absolute inset-0" />

          {/* Nombre de la marca pintado en la pared, detrás del tenis */}
          <div className="trend-card-tag">
            <span>{brandLabel}</span>
          </div>

          <img
            src={product.images[0]}
            alt={product.name}
            draggable={false}
            referrerPolicy="no-referrer"
            className="trend-floating-img relative z-10 max-h-52 w-[94%] object-contain"
          />
        </div>

        <div className="relative z-10 mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
              {brandLabel}
            </span>

            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-white text-white" />
              <span className="font-mono text-[10px] font-bold text-white/85">
                {product.rating}
              </span>
            </div>
          </div>

                 <h3
            className="product-color-glow line-clamp-2 min-h-[44px] text-base font-black uppercase leading-[1.15] text-white"
            style={{ '--glow-color': product.colors?.[0]?.hex || '#ffffff' } as React.CSSProperties}
          ></h3>

          <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/55">
            {product.description}
          </p>

          <button
            type="button"
            onClick={onSelectCompare}
            className={`mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.16em] transition-all ${
              selected
                ? 'border-white bg-white text-black'
                : 'border-white/15 bg-black/35 text-white/70 hover:border-white/35 hover:text-white'
            }`}
          >
            <GitCompareArrows className="h-3.5 w-3.5" />
            {selected ? 'Seleccionado' : 'Comparador'}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export const TrendingCarousel: React.FC = () => {
  const { products, brands, navigateTo } = useApp();
  const [selectedIds, setSelectedIds] = useState<ProductId[]>([]);

  const trendingProducts = useMemo(() => {
    const trending = products.filter((product) => product.isTrending);
    const mixed = [...trending, ...products];

    return mixed
      .filter((product, index, array) => {
        return array.findIndex((item) => item.id === product.id) === index;
      })
      .slice(0, 8);
  }, [products]);

  const brandLabel = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? brandId;

  const selectedProducts = trendingProducts.filter((product) =>
    selectedIds.includes(product.id)
  );

  const comparisonReady = selectedProducts.length === 2;

  const handleCompareSelect = (
    event: React.MouseEvent<HTMLButtonElement>,
    productId: ProductId
  ) => {
    event.stopPropagation();

    setSelectedIds((current) => {
      if (current.includes(productId)) {
        return current.filter((id) => id !== productId);
      }

      if (current.length === 0) {
        return [productId];
      }

      if (current.length === 1) {
        return [...current, productId];
      }

      return [productId];
    });
  };

  if (trendingProducts.length === 0) return null;

  return (
    <section
      className="trend-wall-section relative overflow-hidden py-20"
    >
      {/* Pared de cemento negro */}
      <div className="trend-wall-texture" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 border-b border-white/5 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em]">
              Selección curada
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase italic tracking-[-0.04em] text-white sm:text-5xl">
              Tendencias Ahora
            </h2>

            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-neutral-500">
              Los modelos más buscados por coleccionistas globales.
            </p>
          </div>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/70 hover:border-white/25 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Reiniciar comparador
            </button>
          )}
        </div>

        {!comparisonReady ? (
          <div
            id="trending-floating-columns"
            className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4"
          >
            {trendingProducts.map((product, index) => (
              <FloatingTrendCard
                key={product.id}
                product={product}
                index={index}
                brandLabel={brandLabel(product.brandId)}
                selected={selectedIds.includes(product.id)}
                onOpenProduct={() =>
                  navigateTo({ type: 'product', productId: product.id })
                }
                onSelectCompare={(event) =>
                  handleCompareSelect(event, product.id)
                }
              />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="trend-comparison-panel"
          >
            <div className="mb-8">
              <p className="text-amber-500 font-mono text-[10px] uppercase tracking-[0.35em]">
                Comparativa activa
              </p>

              <h3 className="mt-2 text-3xl font-black uppercase italic text-white sm:text-4xl">
                2 modelos seleccionados
              </h3>
            </div>

            <div className="grid gap-7 lg:grid-cols-2">
              {selectedProducts.map((product) => (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigateTo({ type: 'product', productId: product.id })
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigateTo({ type: 'product', productId: product.id });
                    }
                  }}
                  className="trend-compare-card cursor-pointer outline-none"
                >
                  <div className="relative flex h-64 items-center justify-center overflow-visible">
                    <div className="trend-void-glow absolute inset-0" />

                    <div className="trend-card-tag">
                      <span>{brandLabel(product.brandId)}</span>
                    </div>

                    <img
                      src={product.images[0]}
                      alt={product.name}
                      draggable={false}
                      referrerPolicy="no-referrer"
                      className="trend-floating-img relative z-10 max-h-52 w-full object-contain"
                    />
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/50">
                        {brandLabel(product.brandId)}
                      </span>

                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-white text-white" />
                        <span className="font-mono text-xs font-bold text-white">
                          {product.rating}
                        </span>
                      </div>
                    </div>

                    <h4 className="mt-3 text-2xl font-black uppercase leading-tight text-white">
                      {product.name}
                    </h4>

                    <p className="mt-3 text-sm leading-6 text-white/60">
                      {product.description}
                    </p>

                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-white/45">Edición</span>
                        <span className="font-bold text-white">
                          {product.isLimited ? 'Limitada' : 'Regular'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-white/45">Descuento</span>
                        <span className="font-bold text-white">
                          {product.discount > 0
                            ? `${product.discount}%`
                            : 'Sin descuento'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-white/45">Tecnologías</span>
                        <span className="max-w-[60%] text-right font-bold text-white">
                          {product.technologies.slice(0, 2).join(', ') || 'No especificado'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-white/45">Materiales</span>
                        <span className="max-w-[60%] text-right font-bold text-white">
                          {product.materials.slice(0, 2).join(', ') || 'No especificado'}
                        </span>
                      </div>

                      <div className="flex justify-between gap-4 text-xs">
                        <span className="text-white/45">Tallas</span>
                        <span className="max-w-[60%] text-right font-bold text-white">
                          {product.sizes.slice(0, 5).join(', ')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(event) =>
                        handleCompareSelect(event, product.id)
                      }
                      className="mt-6 rounded-full border border-white/15 px-4 py-2 font-mono text-[9px] font-black uppercase tracking-[0.18em] text-white/70 hover:border-white/35 hover:text-white"
                    >
                      Quitar del comparador
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
