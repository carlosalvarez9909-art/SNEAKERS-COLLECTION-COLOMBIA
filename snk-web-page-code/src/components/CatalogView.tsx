import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, Sliders, X, Check, Star, Trash2, ChevronDown } from 'lucide-react';
import { finalPriceOf, salesScore } from '../lib/productMetrics';

type SortOption = 'default' | 'best-sellers' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
type CollectionTag = 'limited' | 'bestseller' | 'trending' | 'sale';

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'default', label: 'Más recientes' },
  { id: 'best-sellers', label: 'Más vendidos' },
  { id: 'rating', label: 'Mejor calificados' },
  { id: 'price-asc', label: 'Precio: menor a mayor' },
  { id: 'price-desc', label: 'Precio: mayor a menor' },
  { id: 'discount', label: 'Mayores descuentos' }
];

const COLLECTION_OPTIONS: { id: CollectionTag; label: string }[] = [
  { id: 'bestseller', label: 'Top ventas' },
  { id: 'limited', label: 'Edición limitada' },
  { id: 'trending', label: 'Tendencia' },
  { id: 'sale', label: 'En oferta' }
];

// Rangos en COP (precio final con descuento).
const PRICE_RANGES = [
  { id: 'lt500', min: 0, max: 500_000 },
  { id: '500-800', min: 500_000, max: 800_000 },
  { id: '800-1200', min: 800_000, max: 1_200_000 },
  { id: 'gt1200', min: 1_200_000, max: Infinity }
] as const;
type PriceRangeId = typeof PRICE_RANGES[number]['id'];

const RATING_OPTIONS = [4.5, 4, 3.5];
const FALLBACK_SIZES = [6, 7, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13];
const currencyOptions = ['COP', 'USD', 'EUR', 'MXN'] as const;

const toggleIn = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter(item => item !== value) : [...list, value];

// Botón con menú desplegable; se cierra al hacer clic fuera o con Escape.
const FilterDropdown: React.FC<{
  id: string;
  label: string;
  count?: number;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  align?: 'left' | 'right';
  children: React.ReactNode;
}> = ({ id, label, count = 0, openId, setOpenId, align = 'left', children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = openId === id;

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpenId(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenId(null);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, setOpenId]);

  return (
    <div ref={ref} className="relative">
      <button
        id={`catalog-filter-${id}`}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={() => setOpenId(isOpen ? null : id)}
        className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all ${
          isOpen || count > 0
            ? 'border-white/40 bg-white/10 text-white'
            : 'border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white'
        }`}
      >
        <span>{label}</span>
        {count > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] text-black">
            {count}
          </span>
        )}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`fixed inset-x-4 z-30 mt-2 rounded-2xl border border-white/10 bg-neutral-950/95 p-4 shadow-2xl shadow-black backdrop-blur-md sm:absolute sm:inset-x-auto sm:top-full sm:w-[300px] ${
            align === 'right' ? 'sm:right-0' : 'sm:left-0'
          }`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const OptionRow: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({
  selected,
  onClick,
  children
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${
      selected ? 'bg-white/10 font-bold text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className="flex items-center gap-2">{children}</span>
    {selected && <Check className="h-3.5 w-3.5" />}
  </button>
);

export const CatalogView: React.FC = () => {
  const {
    products,
    brands,
    activeView,
    searchQuery,
    setSearchQuery,
    compareProductIds,
    toggleCompare,
    clearCompare,
    formatPrice,
    currency,
    setCurrency
  } = useApp();

  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<PriceRangeId[]>([]);
  const [selectedTags, setSelectedTags] = useState<CollectionTag[]>([]);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Al llegar desde un tarjetón (Recomendaciones, marcas…) se aplican sus filtros.
  const incomingFilters = activeView.type === 'catalog' ? activeView.filters : undefined;
  useEffect(() => {
    setSelectedBrandIds(incomingFilters?.brandId ? [incomingFilters.brandId] : []);
    setSelectedSizes([]);
    setSelectedPrices([]);
    setMinRating(null);
    const tags: CollectionTag[] = [];
    if (incomingFilters?.isLimited) tags.push('limited');
    if (incomingFilters?.isBestSeller) tags.push('bestseller');
    if (incomingFilters?.isTrending) tags.push('trending');
    if (incomingFilters?.onSale) tags.push('sale');
    setSelectedTags(tags);
    setSortBy(incomingFilters?.sortBy ?? 'default');
  }, [incomingFilters]);

  const sizeOptions = useMemo(() => {
    const all = new Set<number>();
    products.forEach(product => product.sizes.forEach(size => all.add(size)));
    return all.size ? [...all].sort((a, b) => a - b) : FALLBACK_SIZES;
  }, [products]);

  const handleResetFilters = () => {
    setSelectedBrandIds([]);
    setSelectedSizes([]);
    setSelectedPrices([]);
    setSelectedTags([]);
    setMinRating(null);
    setSortBy('default');
    setSearchQuery('');
  };

  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brandId.toLowerCase().includes(q)
      );
    }
    if (selectedBrandIds.length) result = result.filter(p => selectedBrandIds.includes(p.brandId));
    if (selectedSizes.length) result = result.filter(p => selectedSizes.some(size => p.sizes.includes(size)));
    if (selectedPrices.length) {
      result = result.filter(p => {
        const price = finalPriceOf(p);
        return PRICE_RANGES.some(range =>
          selectedPrices.includes(range.id) && price >= range.min && price < range.max
        );
      });
    }
    if (selectedTags.length) {
      result = result.filter(p => selectedTags.every(tag =>
        tag === 'limited' ? p.isLimited :
        tag === 'bestseller' ? p.isBestSeller :
        tag === 'trending' ? p.isTrending :
        p.discount > 0
      ));
    }
    if (minRating !== null) result = result.filter(p => p.rating >= minRating);

    if (sortBy === 'price-asc') result.sort((a, b) => finalPriceOf(a) - finalPriceOf(b));
    else if (sortBy === 'price-desc') result.sort((a, b) => finalPriceOf(b) - finalPriceOf(a));
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'discount') result.sort((a, b) => b.discount - a.discount);
    else if (sortBy === 'best-sellers') result.sort((a, b) => salesScore(b) - salesScore(a));

    return result;
  }, [products, searchQuery, selectedBrandIds, selectedSizes, selectedPrices, selectedTags, minRating, sortBy]);

  const comparedProducts = useMemo(() => {
    return products.filter(p => compareProductIds.includes(p.id));
  }, [products, compareProductIds]);

  const priceLabel = (range: typeof PRICE_RANGES[number]) =>
    range.max === Infinity
      ? `Más de ${formatPrice(range.min)}`
      : range.min === 0
        ? `Hasta ${formatPrice(range.max)}`
        : `${formatPrice(range.min)} – ${formatPrice(range.max)}`;

  // Chips de filtros activos (se quitan con un clic).
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedBrandIds.map(id => ({
      key: `brand-${id}`,
      label: brands.find(b => b.id === id)?.name ?? id,
      onRemove: () => setSelectedBrandIds(prev => prev.filter(item => item !== id))
    })),
    ...selectedSizes.map(size => ({
      key: `size-${size}`,
      label: `Talla ${size}`,
      onRemove: () => setSelectedSizes(prev => prev.filter(item => item !== size))
    })),
    ...selectedPrices.map(id => ({
      key: `price-${id}`,
      label: priceLabel(PRICE_RANGES.find(range => range.id === id)!),
      onRemove: () => setSelectedPrices(prev => prev.filter(item => item !== id))
    })),
    ...selectedTags.map(tag => ({
      key: `tag-${tag}`,
      label: COLLECTION_OPTIONS.find(option => option.id === tag)!.label,
      onRemove: () => setSelectedTags(prev => prev.filter(item => item !== tag))
    })),
    ...(minRating !== null
      ? [{ key: 'rating', label: `${minRating}+ estrellas`, onRemove: () => setMinRating(null) }]
      : [])
  ];

  return (
    <div className="bg-transparent text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Page Header */}
        <div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Catálogo de Sneakers
            </h2>
            <p className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase mt-1">
              Colección completa con piezas curadas de autenticidad absoluta
            </p>
          </div>

          <input
            id="catalog-search-inline"
            type="text"
            placeholder="Buscar por modelo, marca o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none backdrop-blur-[2px] focus:border-white/30 md:w-72"
          />
        </div>

        {/* Barra de filtros desplegables */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 hidden items-center gap-2 sm:flex">
            <SlidersHorizontal className="h-4 w-4 text-white/60" />
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/60">Filtrar</span>
          </span>

          <FilterDropdown id="brand" label="Marca" count={selectedBrandIds.length} openId={openDropdown} setOpenId={setOpenDropdown}>
            <div className="space-y-1">
              {brands.map(b => (
                <OptionRow
                  key={b.id}
                  selected={selectedBrandIds.includes(b.id)}
                  onClick={() => setSelectedBrandIds(prev => toggleIn(prev, b.id))}
                >
                  {b.name}
                  <span className="font-mono text-[9px] text-neutral-600">
                    {products.filter(p => p.brandId === b.id).length}
                  </span>
                </OptionRow>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="size" label="Talla US" count={selectedSizes.length} openId={openDropdown} setOpenId={setOpenDropdown}>
            <div className="grid grid-cols-4 gap-1.5">
              {sizeOptions.map(size => (
                <button
                  id={`catalog-size-opt-${size}`}
                  key={size}
                  type="button"
                  onClick={() => setSelectedSizes(prev => toggleIn(prev, size))}
                  className={`rounded-lg border py-2 text-xs font-mono font-bold transition-colors ${
                    selectedSizes.includes(size)
                      ? 'border-white bg-white text-black'
                      : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="price" label="Precio" count={selectedPrices.length} openId={openDropdown} setOpenId={setOpenDropdown}>
            <div className="space-y-1">
              {PRICE_RANGES.map(range => (
                <OptionRow
                  key={range.id}
                  selected={selectedPrices.includes(range.id)}
                  onClick={() => setSelectedPrices(prev => toggleIn(prev, range.id))}
                >
                  {priceLabel(range)}
                </OptionRow>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="collection" label="Colección" count={selectedTags.length} openId={openDropdown} setOpenId={setOpenDropdown}>
            <div className="space-y-1">
              {COLLECTION_OPTIONS.map(option => (
                <OptionRow
                  key={option.id}
                  selected={selectedTags.includes(option.id)}
                  onClick={() => setSelectedTags(prev => toggleIn(prev, option.id))}
                >
                  {option.label}
                </OptionRow>
              ))}
            </div>
          </FilterDropdown>

          <FilterDropdown id="rating" label="Calificación" count={minRating !== null ? 1 : 0} openId={openDropdown} setOpenId={setOpenDropdown}>
            <div className="space-y-1">
              {RATING_OPTIONS.map(value => (
                <OptionRow
                  key={value}
                  selected={minRating === value}
                  onClick={() => setMinRating(minRating === value ? null : value)}
                >
                  <Star className="h-3 w-3 fill-white text-white" />
                  {value} o más
                </OptionRow>
              ))}
            </div>
          </FilterDropdown>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <FilterDropdown id="currency" label={currency} openId={openDropdown} setOpenId={setOpenDropdown} align="right">
              <div className="space-y-1">
                {currencyOptions.map(code => (
                  <OptionRow
                    key={code}
                    selected={currency === code}
                    onClick={() => {
                      setCurrency(code);
                      setOpenDropdown(null);
                    }}
                  >
                    {code}
                  </OptionRow>
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              id="sort"
              label={`Ordenar: ${SORT_OPTIONS.find(option => option.id === sortBy)!.label}`}
              openId={openDropdown}
              setOpenId={setOpenDropdown}
              align="right"
            >
              <div className="space-y-1">
                {SORT_OPTIONS.map(option => (
                  <OptionRow
                    key={option.id}
                    selected={sortBy === option.id}
                    onClick={() => {
                      setSortBy(option.id);
                      setOpenDropdown(null);
                    }}
                  >
                    {option.label}
                  </OptionRow>
                ))}
              </div>
            </FilterDropdown>
          </div>
        </div>

        {/* Filtros activos + conteo */}
        <div className="mt-4 flex min-h-8 flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {processedProducts.length} {processedProducts.length === 1 ? 'resultado' : 'resultados'}
          </span>
          {activeChips.map(chip => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.onRemove}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] text-white/85 transition-colors hover:border-white/40"
              title="Quitar filtro"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          {(activeChips.length > 0 || searchQuery) && (
            <button
              id="catalog-reset-filters-btn"
              type="button"
              onClick={handleResetFilters}
              className="text-[10px] font-mono uppercase text-neutral-500 underline transition-colors hover:text-white"
            >
              Limpiar todo
            </button>
          )}
        </div>

        {/* Resultados */}
        <main className="mt-6">
          {processedProducts.length > 0 ? (
            <div id="catalog-products-grid" className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {processedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div id="catalog-no-results" className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
              <Sliders className="mx-auto h-10 w-10 text-neutral-500" />
              <h3 className="mt-4 text-sm font-bold text-white uppercase">Sin coincidencias</h3>
              <p className="mt-1 text-xs text-neutral-500">Prueba ajustando los filtros o eliminando la búsqueda.</p>
              <button
                id="catalog-clear-filters-err-btn"
                type="button"
                onClick={handleResetFilters}
                className="mt-5 rounded-full bg-white px-5 py-2 text-xs font-bold text-black hover:bg-white/85"
              >
                Restablecer catálogo
              </button>
            </div>
          )}
        </main>

      </div>

      {/* FLOATING COMPARISON FOOTER PANEL */}
      {compareProductIds.length > 0 && (
        <div id="compare-tray" className="fixed bottom-0 left-0 w-full bg-neutral-950/95 border-t border-neutral-900 py-3.5 px-4 backdrop-blur-md shadow-2xl z-40">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-neutral-950 font-mono">
                {compareProductIds.length} SNEAKERS
              </span>
              <p className="text-xs text-neutral-300 font-sans hidden sm:block">
                Has seleccionado modelos para comparar especificaciones técnicas de primera línea.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                id="compare-open-modal-btn"
                onClick={() => setShowCompareModal(true)}
                className="rounded-full bg-white text-neutral-950 font-bold text-[10px] tracking-wider uppercase px-5 py-2 hover:bg-neutral-200 transition-colors"
              >
                COMPARAR AHORA
              </button>
              <button
                id="compare-clear-all-btn"
                onClick={clearCompare}
                className="rounded-full border border-neutral-800 bg-neutral-900 text-neutral-400 font-bold text-[10px] tracking-wider uppercase px-4 py-2 hover:text-white"
              >
                Vaciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED SNEAKERS COMPARATIVE MODAL */}
      {showCompareModal && (
        <div id="compare-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div id="compare-modal" className="relative w-full max-w-5xl rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl shadow-black max-h-[90vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            
            {/* Close */}
            <button
              id="compare-modal-close"
              onClick={() => setShowCompareModal(false)}
              className="absolute right-4 top-4 rounded-lg bg-neutral-900 p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <h3 className="font-sans text-lg font-black uppercase tracking-tight text-white mb-6">
              Comparativa Técnica Curada
            </h3>

            {/* Grid table */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-neutral-900">
              
              {/* Row Header Labels */}
              <div className="hidden md:flex flex-col space-y-12 pr-4 text-xs font-mono text-neutral-500 uppercase self-end pb-8">
                <div>Calzado</div>
                <div>Precio Final</div>
                <div>Valoración</div>
                <div>Edición</div>
                <div>Tecnología</div>
                <div>Materiales</div>
              </div>

              {/* Items details */}
              {comparedProducts.map(p => {
                const finalP = p.basePrice * (1 - p.discount / 100);
                return (
                  <div id={`compare-modal-col-${p.id}`} key={p.id} className="pt-4 md:pt-0 md:px-4 space-y-4 text-center">
                    
                    {/* Header Image & Name */}
                    <div className="flex flex-col items-center">
                      <img 
                        src={p.images[0]} 
                        alt="" 
                        className="h-24 w-24 object-contain mb-2" 
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="text-xs font-extrabold text-white uppercase line-clamp-1">{p.name}</h4>
                      <button
                        id={`compare-modal-remove-${p.id}`}
                        onClick={() => toggleCompare(p.id)}
                        className="mt-1 flex items-center space-x-1 text-[9px] font-mono text-red-500 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>Quitar</span>
                      </button>
                    </div>

                    {/* Price */}
                    <div className="py-2 border-y border-neutral-900">
                      <div className="md:hidden text-[10px] font-sans text-neutral-500 uppercase">Precio</div>
                      <span className="text-xs font-sans font-bold text-white">{formatPrice(finalP)}</span>
                      {p.discount > 0 && <p className="text-[9px] font-sans text-neutral-500 line-through">{formatPrice(p.basePrice)}</p>}
                    </div>

                    {/* Rating */}
                    <div className="py-2 border-y border-neutral-900 flex flex-col items-center">
                      <div className="md:hidden text-[10px] font-mono text-neutral-500 uppercase mb-1">Valoración</div>
                      <div className="flex items-center justify-center space-x-1">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-mono font-bold text-white">{p.rating}</span>
                      </div>
                    </div>

                    {/* Edition */}
                    <div className="py-2 border-y border-neutral-900">
                      <div className="md:hidden text-[10px] font-mono text-neutral-500 uppercase">Edición</div>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-mono uppercase ${p.isLimited ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-neutral-900 text-neutral-400'}`}>
                        {p.isLimited ? 'Limitada' : 'Estándar'}
                      </span>
                    </div>

                    {/* Technologies */}
                    <div className="py-2 border-y border-neutral-900">
                      <div className="md:hidden text-[10px] font-mono text-neutral-500 uppercase mb-1.5">Tecnología</div>
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {p.technologies.slice(0, 2).map((tech, i) => (
                          <span key={i} className="rounded bg-neutral-900 px-1.5 py-0.5 text-[8px] font-mono text-neutral-400">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="py-2 border-y border-neutral-900">
                      <div className="md:hidden text-[10px] font-mono text-neutral-500 uppercase mb-1">Materiales</div>
                      <p className="text-[10px] text-neutral-400 line-clamp-2">{p.materials.join(', ')}</p>
                    </div>

                  </div>
                );
              })}

              {/* Pad with empty slot if less than 3 */}
              {comparedProducts.length < 3 && Array.from({ length: 3 - comparedProducts.length }).map((_, idx) => (
                <div key={idx} className="hidden md:flex flex-col items-center justify-center border border-dashed border-neutral-900 rounded-xl p-6 h-56 text-neutral-600 font-mono text-[10px] uppercase">
                  Casilla Vacía
                </div>
              ))}

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
