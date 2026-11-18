import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Flame, Crown, TrendingUp, BadgePercent, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Product, ViewState } from '../types';
import { StarRating } from './StarRating';
import { BrandMarquee } from './BrandMarquee';
import { TOP_LISTS, TopListId, finalPriceOf, salesScore, topProducts } from '../lib/productMetrics';

type CatalogFilters = Extract<ViewState, { type: 'catalog' }>['filters'];

type Collection = {
  id: string;
  title: string;
  kicker: string;
  description: string;
  accent: string;
  icon: React.ElementType;
  filters: CatalogFilters;
  pick: (products: Product[]) => Product[];
};

// Los colores salen de la paleta RGB de la marca (index.css: --gold-1, --gold-2, --red-1, --red-2).
const COLLECTIONS: Collection[] = [
  {
    id: 'best-sellers',
    title: 'Más vendidos',
    kicker: 'Top ventas',
    description: 'Los pares que nunca se quedan en la bóveda.',
    accent: '#ff2d55',
    icon: Flame,
    filters: { isBestSeller: true },
    pick: products =>
      products.filter(p => p.isBestSeller).sort((a, b) => salesScore(b) - salesScore(a))
  },
  {
    id: 'limited',
    title: 'Ediciones limitadas',
    kicker: 'Exclusivo',
    description: 'Piezas de tiraje corto para coleccionistas.',
    accent: '#8b5cf6',
    icon: Crown,
    filters: { isLimited: true },
    pick: products => products.filter(p => p.isLimited)
  },
  {
    id: 'trending',
    title: 'Tendencia',
    kicker: 'Lo más buscado',
    description: 'Lo que se está moviendo en la calle ahora.',
    accent: '#00e5ff',
    icon: TrendingUp,
    filters: { isTrending: true },
    pick: products => products.filter(p => p.isTrending)
  },
  {
    id: 'deals',
    title: 'Ofertas',
    kicker: 'Descuentos activos',
    description: 'Referencias premium con precio especial.',
    accent: '#ffbf00',
    icon: BadgePercent,
    filters: { onSale: true },
    pick: products => products.filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount)
  },
  {
    id: 'top-rated',
    title: 'Mejor calificados',
    kicker: '5 estrellas',
    description: 'Los favoritos según nuestros clientes.',
    accent: '#ffffff',
    icon: Star,
    filters: { sortBy: 'rating' },
    pick: products => [...products].sort((a, b) => b.rating - a.rating)
  }
];

const CollectionCard: React.FC<{
  collection: Collection;
  items: Product[];
  large?: boolean;
  index: number;
}> = ({ collection, items, large = false, index }) => {
  const { navigateTo } = useApp();
  const Icon = collection.icon;
  const cover = items[0];

  return (
    <motion.button
      type="button"
      onClick={() => navigateTo({ type: 'catalog', filters: collection.filters })}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.07 }}
      className={`collection-tile group relative flex h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] text-left backdrop-blur-[2px] transition-all duration-500 hover:-translate-y-1 hover:border-white/25 ${
        large ? 'min-h-[320px] sm:min-h-[380px]' : 'min-h-[280px]'
      }`}
      style={{ '--tile-accent': collection.accent } as React.CSSProperties}
    >
      {/* Halo del color de la colección */}
      <div className="collection-tile-glow pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full opacity-40 blur-[90px] transition-opacity duration-500 group-hover:opacity-70" />

      {cover && (
        <img
          src={cover.images[0]}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
          className={`pointer-events-none absolute object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.85)] transition-transform duration-700 group-hover:-translate-y-2 group-hover:-rotate-6 group-hover:scale-105 ${
            large
              ? 'right-[-4%] top-1/2 w-[62%] -translate-y-1/2 -rotate-12'
              : 'right-[-8%] top-6 w-[70%] -rotate-12'
          }`}
        />
      )}

      <div className="relative z-10 mt-auto flex w-full flex-col p-6 sm:p-8">
        <span
          className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em]"
          style={{ borderColor: `${collection.accent}55`, color: collection.accent }}
        >
          <Icon className="h-3 w-3" />
          {collection.kicker}
        </span>

        <h3
          className={`mt-4 font-sans font-black uppercase leading-[0.9] tracking-[-0.06em] text-white ${
            large ? 'text-4xl sm:text-5xl' : 'text-3xl'
          }`}
        >
          {collection.title}
        </h3>

        <p className="mt-2 max-w-xs text-xs leading-relaxed text-neutral-400">
          {collection.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
            {items.length} {items.length === 1 ? 'modelo' : 'modelos'}
          </span>
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/80 transition-colors group-hover:text-white">
            Ver colección
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </motion.button>
  );
};

const TopRankings: React.FC = () => {
  const { products, navigateTo, formatPrice } = useApp();
  const [activeList, setActiveList] = useState<TopListId>('sold');
  const ranking = useMemo(() => topProducts(products, activeList, 5), [products, activeList]);
  const activeMeta = TOP_LISTS.find(list => list.id === activeList)!;

  return (
    <section className="mt-28">
      <div className="text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">Rankings</p>
        <h2 className="mt-3 font-sans text-3xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl">
          Top 5
        </h2>
        <div className="title-rgb-bar mx-auto mt-3" />
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist">
        {TOP_LISTS.map(list => (
          <button
            key={list.id}
            type="button"
            role="tab"
            aria-selected={activeList === list.id}
            onClick={() => setActiveList(list.id)}
            className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
              activeList === list.id
                ? 'border-white bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.35)]'
                : 'border-white/15 bg-white/[0.03] text-white/70 hover:border-white/35 hover:text-white'
            }`}
          >
            {list.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-neutral-500">{activeMeta.hint}</p>

      <AnimatePresence mode="wait">
        <motion.ol
          key={activeList}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          {ranking.map((product, index) => {
            const finalPrice = finalPriceOf(product);
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => navigateTo({ type: 'product', productId: product.id })}
                  className="group relative flex h-full w-full flex-row items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:border-white/30 lg:flex-col lg:items-stretch"
                >
                  <span className="top-rank-number pointer-events-none absolute right-3 top-1 font-sans text-6xl font-black leading-none tracking-[-0.08em] lg:text-7xl">
                    {index + 1}
                  </span>

                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center lg:h-36 lg:w-full">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full w-full object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105"
                    />
                  </div>

                  <div className="relative z-10 min-w-0 flex-1 lg:mt-3">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-neutral-500">
                      {product.brandId}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-xs font-bold uppercase tracking-[0.04em] text-white">
                      {product.name}
                    </h3>
                    <div className="mt-2">
                      <StarRating rating={product.rating} reviewsCount={product.reviewsCount} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-baseline gap-1.5">
                      <span className="text-sm font-black text-white">{formatPrice(finalPrice)}</span>
                      {product.discount > 0 && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/80">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </motion.ol>
      </AnimatePresence>

      {ranking.length === 0 && (
        <p className="mt-10 text-center text-xs font-mono uppercase tracking-[0.25em] text-neutral-500">
          Aún no hay referencias en este ranking
        </p>
      )}
    </section>
  );
};

export const RecommendationsView: React.FC = () => {
  const { products } = useApp();
  const collections = COLLECTIONS.map(collection => ({
    collection,
    items: collection.pick(products)
  })).filter(entry => entry.items.length > 0);

  return (
    <div id="recommendations-page" className="relative min-h-screen bg-transparent text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-neutral-500">
            Curaduría Sneakers Collection
          </p>
          <h1 className="mt-3 font-sans text-3xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl">
            Recomendaciones
          </h1>
          <div className="title-rgb-bar mx-auto mt-3" />
          <p className="mx-auto mt-4 max-w-xl text-xs leading-relaxed text-neutral-400 sm:text-sm">
            Explora por colección o descubre los rankings de la casa.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {collections.map(({ collection, items }, index) => (
            <div
              key={collection.id}
              className={index < 2 ? 'sm:col-span-1 lg:col-span-3' : 'sm:col-span-1 lg:col-span-2'}
            >
              <CollectionCard
                collection={collection}
                items={items}
                large={index < 2}
                index={index}
              />
            </div>
          ))}
        </div>

        <TopRankings />
      </div>

      <BrandMarquee />
    </div>
  );
};
