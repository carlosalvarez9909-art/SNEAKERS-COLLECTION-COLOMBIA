import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Flame, Crown, TrendingUp, BadgePercent, Star } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Product, ViewState } from '../types';
import { StarRating } from './StarRating';
import { BrandMarquee } from './BrandMarquee';
import { WaveTitle } from './WaveTitle';
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

// Paleta monocromática: blanco sobre el fondo espacial.
const COLLECTIONS: Collection[] = [
  {
    id: 'best-sellers',
    title: 'Más vendidos',
    kicker: 'Top ventas',
    description: 'Los pares que nunca se quedan en la bóveda.',
    accent: '#ffffff',
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
    accent: '#ffffff',
    icon: Crown,
    filters: { isLimited: true },
    pick: products => products.filter(p => p.isLimited)
  },
  {
    id: 'trending',
    title: 'Tendencia',
    kicker: 'Lo más buscado',
    description: 'Lo que se está moviendo en la calle ahora.',
    accent: '#ffffff',
    icon: TrendingUp,
    filters: { isTrending: true },
    pick: products => products.filter(p => p.isTrending)
  },
  {
    id: 'deals',
    title: 'Ofertas',
    kicker: 'Descuentos activos',
    description: 'Referencias premium con precio especial.',
    accent: '#ffffff',
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
    pick: products => products.filter(p => p.isTopRated).sort((a, b) => b.rating - a.rating)
  }
];

const CollectionCard: React.FC<{
  collection: Collection;
  items: Product[];
  cover?: Product;
  large?: boolean;
  index: number;
}> = ({ collection, items, cover, large = false, index }) => {
  const { navigateTo } = useApp();
  const Icon = collection.icon;

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
          className={`mt-4 font-sans font-black uppercase leading-[0.9] tracking-[-0.06em] luxury-title ${
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

// Estrella roja de 5 puntas con brillo (acompaña el título Top rankings).
const GlowStar: React.FC = () => (
  <svg viewBox="-31 -31 62 62" className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden="true">
    <path
      d="M0 -30 L7.3 -10.1 L28.5 -9.3 L11.8 3.8 L17.6 24.3 L0 12.5 L-17.6 24.3 L-11.8 3.8 L-28.5 -9.3 L-7.3 -10.1 Z"
      fill="#e0102a"
      style={{ filter: 'drop-shadow(0 0 8px rgba(209,10,31,0.85)) drop-shadow(0 0 18px rgba(209,10,31,0.5))' }}
    />
  </svg>
);

// Encabezado de sección: título grande; opcionalmente con resplandor rojo o con línea roja debajo.
const ShowcaseHeader: React.FC<{ title: string; wave?: boolean; glow?: boolean; line?: boolean; as?: 'h1' | 'h2' }> = ({
  title,
  wave = false,
  glow = false,
  line = false,
  as = 'h2'
}) => {
  const Tag = as;
  const titleClass = `${glow ? 'white-glow-title ' : ''}cursor-default font-sans text-[2rem] font-black uppercase leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-6xl`;
  return (
    <div className="flex flex-col items-center text-center">
      {wave ? (
        <WaveTitle as={as} text={title} className={titleClass} />
      ) : (
        <Tag className={`luxury-title ${titleClass}`}>{title}</Tag>
      )}
      {line && (
        <span className="mt-5 block h-px w-full max-w-md bg-gradient-to-r from-transparent via-[#d10a1f] to-transparent shadow-[0_0_12px_rgba(209,10,31,0.85)]" />
      )}
    </div>
  );
};

const TopRankings: React.FC = () => {
  const { products, brands, navigateTo, formatPrice } = useApp();
  const [activeList, setActiveList] = useState<TopListId>('sold');
  const ranking = useMemo(() => topProducts(products, activeList, 5), [products, activeList]);

  return (
    <section className="mt-28">
      <ShowcaseHeader title="Top rankings" glow />

      <div className="mt-10 flex flex-wrap justify-center gap-2" role="tablist">
        {TOP_LISTS.map(list => (
          <button
            key={list.id}
            type="button"
            role="tab"
            aria-selected={activeList === list.id}
            onClick={() => setActiveList(list.id)}
            className={`red-glow-hover rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
              activeList === list.id
                ? 'red-glow-active border-[#d10a1f] bg-white/[0.06] text-white'
                : 'border-white/15 bg-white/[0.03] text-white/70 hover:text-white'
            }`}
          >
            {list.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.ol
          key={activeList}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-2"
        >
          {ranking.map((product, index) => {
            const finalPrice = finalPriceOf(product);
            const first = index === 0;
            const brand = brands.find(b => b.id === product.brandId)?.name ?? product.brandId;
            return (
              <motion.li
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.07 }}
                className={first ? 'col-span-2 lg:row-span-2' : ''}
              >
                <button
                  type="button"
                  onClick={() => navigateTo({ type: 'product', productId: product.id })}
                  className={`rank-card group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border text-left transition-all duration-500 hover:-translate-y-1 ${
                    first ? 'rank-card-first border-red-600/50 p-6 sm:p-8' : 'border-white/10 p-4 sm:p-5'
                  }`}
                >
                  {/* número gigante de fondo */}
                  <span
                    className={`rank-number pointer-events-none absolute font-black leading-none tracking-[-0.08em] ${
                      first ? '-bottom-6 right-2 text-[11rem] sm:text-[14rem]' : '-bottom-3 right-1 text-[6.5rem]'
                    }`}
                  >
                    {index + 1}
                  </span>

                  <span
                    className={`relative z-10 inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${
                      first ? 'bg-red-600 text-white shadow-[0_0_16px_rgba(209,10,31,0.7)]' : 'border border-white/20 text-white/80'
                    }`}
                  >
                    {first && <Crown className="h-3 w-3" />}
                    Top {index + 1}
                  </span>

                  <div className={`relative z-10 flex items-center justify-center ${first ? 'my-6 h-52 sm:h-72' : 'my-3 h-28 sm:h-32'}`}>
                    <div className="pointer-events-none absolute inset-x-6 bottom-2 h-1/2 rounded-full bg-red-700/25 blur-2xl transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60" />
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      className="relative max-h-full w-full object-contain drop-shadow-[0_24px_24px_rgba(0,0,0,0.85)] transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-110"
                    />
                  </div>

                  <div className="relative z-10 mt-auto min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-red-500">{brand}</p>
                    <h3 className={`mt-1 line-clamp-2 font-black uppercase leading-tight text-white ${first ? 'text-xl sm:text-3xl' : 'text-[11px] sm:text-xs'}`}>
                      {product.name}
                    </h3>
                    {product.rating > 0 && (
                      <div className="mt-2">
                        <StarRating rating={product.rating} />
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap items-baseline gap-2">
                      <span className={`font-black text-white ${first ? 'text-2xl sm:text-3xl' : 'text-sm'}`}>{formatPrice(finalPrice)}</span>
                      {product.discount > 0 && (
                        <span className="rounded-full bg-red-600/90 px-2 py-0.5 text-[9px] font-black text-white">-{product.discount}%</span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.li>
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
  // Cada tarjetón muestra un tenis distinto: se escoge el primero que no haya salido en otra tarjeta.
  const collections = useMemo(() => {
    const used = new Set<string>();
    return COLLECTIONS.map(collection => {
      const items = collection.pick(products);
      const cover = items.find(p => !used.has(p.id)) ?? products.find(p => !used.has(p.id)) ?? items[0];
      if (cover) used.add(cover.id);
      return { collection, items, cover };
    }).filter(entry => entry.items.length > 0);
  }, [products]);

  return (
    <div id="recommendations-page" className="relative min-h-screen bg-transparent text-white">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <ShowcaseHeader as="h1" wave line title="¿Quieres algo único?" />

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {collections.map(({ collection, items, cover }, index) => (
            <div
              key={collection.id}
              className={index < 2 ? 'sm:col-span-1 lg:col-span-3' : 'sm:col-span-1 lg:col-span-2'}
            >
              <CollectionCard
                collection={collection}
                items={items}
                cover={cover}
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
