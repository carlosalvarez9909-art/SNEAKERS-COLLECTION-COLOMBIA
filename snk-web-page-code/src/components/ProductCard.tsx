import React, { useRef } from 'react';
import { finalUnitPrice } from '../lib/price';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart, Eye } from 'lucide-react';
import { StarRating } from './StarRating';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const {
    navigateTo,
    toggleFavorite,
    isFavorite,
    formatPrice
  } = useApp();

  const cardRef = useRef<HTMLDivElement>(null);
  const isFav = isFavorite(product.id);
  const finalPrice = finalUnitPrice(product.basePrice, product.discount);
  const glowColor = product.colors?.[0]?.hex || '#ffffff';

  const handleCardClick = () => {
    navigateTo({ type: 'product', productId: product.id });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    card.style.setProperty('--mx', `${x * 24}px`);
    card.style.setProperty('--my', `${y * 20}px`);
    card.style.setProperty('--rx', `${y * -8}deg`);
    card.style.setProperty('--ry', `${x * 10}deg`);
    card.style.setProperty('--rz', `${x * -6}deg`);
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
    <motion.div
      id={`product-card-${product.id}`}
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
      initial={{ opacity: 0, y: 42, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="product-floating-card group relative flex cursor-pointer flex-col overflow-visible p-2 outline-none"
    >
      <div className="floating-product-shell relative flex min-h-[430px] flex-col overflow-visible px-3 pb-4 pt-3">
        <div className="absolute left-4 top-4 z-20 flex flex-col space-y-2">
          {product.isLimited && (
            <span className="promo-bubble promo-bubble-white">Limitado</span>
          )}

          {product.discount > 0 && (
            <span className="promo-bubble promo-bubble-soft">
              -{product.discount}% OFF
            </span>
          )}

          {product.isBestSeller && (
            <span className="promo-bubble promo-bubble-muted">Top Ventas</span>
          )}
        </div>

        <button
          id={`product-card-fav-${product.id}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute right-4 top-4 z-20 rounded-full border border-white/15 bg-black/60 p-2 text-white/70 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-white/40 hover:text-white"
        >
          <Heart
            className={`h-4.5 w-4.5 transition-colors ${
              isFav ? 'fill-white text-white' : 'text-white/70'
            }`}
          />
        </button>

        <div className="product-image-stage relative mt-8 flex h-56 w-full items-center justify-center overflow-visible">
          <div className="product-void-glow absolute inset-0" />

          <img
            id={`product-card-img-${product.id}`}
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            draggable={false}
            className="product-floating-img relative z-10 max-h-44 w-[88%] object-contain"
          />

          <div className="absolute inset-x-0 bottom-2 z-20 flex justify-center opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              id={`quick-view-btn-${product.id}`}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleCardClick();
              }}
              className="floating-cta flex items-center space-x-1.5 rounded-full border border-white/15 bg-white/90 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.18em] text-black transition-transform hover:scale-105"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>VER</span>
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-5 flex flex-1 flex-col justify-between px-1">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.16em] text-white/70">
                {product.brandId}
              </span>

            </div>

            <div className="mt-2">
              {product.rating > 0 && <StarRating rating={product.rating} />}
            </div>

            <h3
              className="product-color-glow mt-2 line-clamp-1 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              style={{ '--glow-color': glowColor } as React.CSSProperties}
            >
              {product.name}
            </h3>

            <p className="mt-1 line-clamp-2 text-[10px] leading-normal tracking-[0.04em] text-white/60">
              {product.description}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base font-black text-white">
                {formatPrice(finalPrice)}
              </span>

              {product.discount > 0 && (
                <span className="text-[10px] text-white/45 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-400">Envío gratis</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};