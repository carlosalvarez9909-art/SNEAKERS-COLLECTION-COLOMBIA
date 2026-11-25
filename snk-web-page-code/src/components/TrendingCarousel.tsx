import React, { useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Star } from 'lucide-react';
import { Product } from '../types';
import { SeeMoreButton } from './SeeMoreButton';
import { homeSections } from '../lib/homeSections';

const FloatingTrendCard: React.FC<{
  product: Product;
  index: number;
  brandLabel: string;
  onOpenProduct: () => void;
}> = ({ product, index, brandLabel, onOpenProduct }) => {
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
        y: 0,
        scale: 1,
        x: 0
      }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{
        duration: 0.75,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`trend-floating-card group relative sm:min-h-[420px] cursor-pointer overflow-visible outline-none`}
    >
      <div className="trend-floating-inner relative flex h-full flex-col justify-start px-1 py-2 sm:justify-between sm:px-2 sm:py-3">
        <div className="relative flex h-36 sm:h-56 items-center justify-center overflow-visible">
          <div className="trend-void-glow absolute inset-0" />

          <img
            src={product.images[0]}
            alt={product.name}
            draggable={false}
            referrerPolicy="no-referrer"
            className="trend-floating-img relative z-10 max-h-32 sm:max-h-48 w-[94%] object-contain"
          />
        </div>

        <div className="relative z-10 mt-2 sm:mt-6">
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
            className="product-color-glow line-clamp-2 min-h-[36px] text-xs sm:min-h-[44px] sm:text-base font-black uppercase leading-[1.15] text-white"
            style={{ '--glow-color': product.colors?.[0]?.hex || '#ffffff' } as React.CSSProperties}
          >
            {product.name}
          </h3>

          <p className="mt-3 hidden line-clamp-2 text-xs leading-5 text-white/55 sm:block">
            {product.description}
          </p>
        </div>
      </div>
    </motion.article>
  );
};

export const TrendingCarousel: React.FC = () => {
  const { products, brands, navigateTo } = useApp();

  const trendingProducts = useMemo(() => homeSections(products).trending, [products]);

  const brandLabel = (brandId: string) =>
    brands.find((b) => b.id === brandId)?.name ?? brandId;

  if (trendingProducts.length === 0) return null;

  return (
    <section
      className="trend-wall-section relative overflow-hidden py-10 sm:py-14"
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 border-b border-white/5 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-500">
              Top Products
            </p>

            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em] luxury-title sm:text-5xl">
              Más vendidos
            </h2>
          </div>

        </div>

        <div
            id="trending-floating-columns"
            className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-8 sm:gap-y-10 lg:grid-cols-4"
          >
            {trendingProducts.map((product, index) => (
              <FloatingTrendCard
                key={product.id}
                product={product}
                index={index}
                brandLabel={brandLabel(product.brandId)}
                onOpenProduct={() =>
                  navigateTo({ type: 'product', productId: product.id })
                }
              />
            ))}
          </div>

        <div className="mt-10 text-center">
          <SeeMoreButton label="Ver más vendidos" onClick={() => navigateTo({ type: 'catalog' })} />
        </div>
      </div>
    </section>
  );
};
