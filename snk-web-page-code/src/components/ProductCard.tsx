import React, { useRef } from 'react';
import { finalUnitPrice, hasFreeShipping } from '../lib/price';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart } from 'lucide-react';
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

  // En celular solo se ve la primera etiqueta; en computador todas.
  const badges = [
    product.discount > 0 && { label: `-${product.discount}%`, className: 'bg-red-600 text-white' },
    product.isLimited && { label: 'Limitado', className: 'bg-white text-neutral-950' },
    product.isBestSeller && { label: 'Top ventas', className: 'border border-white/20 bg-black/60 text-white/85' }
  ].filter(Boolean) as { label: string; className: string }[];

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
      <div className="floating-product-shell relative flex flex-col overflow-visible px-1.5 pb-3 pt-2 sm:min-h-[430px] sm:px-3 sm:pb-4 sm:pt-3">
        {/* Etiquetas y favorito en una fila arriba: no tapan la foto */}
        <div className="relative z-20 flex min-h-[30px] items-start justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {badges.map((b, i) => (
              <span
                key={b.label}
                className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${b.className} ${i > 0 ? 'hidden sm:inline-block' : ''}`}
              >
                {b.label}
              </span>
            ))}
          </div>
          <button
            id={`product-card-fav-${product.id}`}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              toggleFavorite(product.id);
            }}
            aria-label={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="shrink-0 rounded-full border border-red-600/40 bg-black/60 p-1.5 backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-red-500 active:scale-90"
          >
            <Heart
              className={`h-4 w-4 text-red-500 transition-all ${
                isFav ? 'fill-red-600 drop-shadow-[0_0_6px_rgba(224,16,42,0.9)]' : ''
              }`}
            />
          </button>
        </div>

        <div className="product-image-stage relative mt-1 flex h-36 w-full sm:mt-2 sm:h-52 items-center justify-center overflow-visible">
          <div className="product-void-glow absolute inset-0" />

          <img
            id={`product-card-img-${product.id}`}
            src={product.images[0]}
            alt={product.name}
            referrerPolicy="no-referrer"
            draggable={false}
            className="product-floating-img relative z-10 max-h-32 w-[92%] object-contain sm:max-h-44 sm:w-[88%]"
          />

        </div>

        <div className="relative z-10 mt-2 flex flex-1 flex-col justify-between px-1 sm:mt-5">
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

            <p className="mt-1 hidden line-clamp-2 text-[10px] leading-normal sm:block tracking-[0.04em] text-white/60">
              {product.description}
            </p>
          </div>

          <div className="mt-2 sm:mt-4">
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-base font-black text-white">
                {formatPrice(finalPrice)}
              </span>

              {product.discount > 0 && (
                <span className="text-[10px] text-white/45 line-through">
                  {formatPrice(product.basePrice)}
                </span>
              )}
            </div>
            {hasFreeShipping(finalPrice) && <p className="mt-0.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-emerald-400">Envío gratis</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
};