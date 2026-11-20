import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BrandLogo } from './BrandLogo';
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

// Sección plegable dentro del panel de filtros.
const FilterSection: React.FC<{
  id: string;
  label: string;
  summary?: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: React.ReactNode;
}> = ({ id, label, summary, openId, setOpenId, children }) => {
  const isOpen = openId === id;
  return (
    <div className="border-b border-white/5 last:border-b-0">
      <button
        id={`catalog-filter-${id}`}
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpenId(isOpen ? null : id)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3.5 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">{label}</span>
        <span className="flex min-w-0 items-center gap-2 text-[11px] text-neutral-500">
          {summary && <span className="truncate">{summary}</span>}
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {isOpen && <div className="px-1.5 pb-3">{children}</div>}
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
  const [openSection, setOpenSection] = useState<string | null>('sort');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  // El panel de filtros se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target as Node)) setFiltersOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFiltersOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [filtersOpen]);

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
            <h2 className="red-glow-label font-sans text-2xl font-black uppercase tracking-[-0.06em] sm:text-3xl">
              Catálogo de Sneakers
            </h2>
          </div>

          <input
            id="catalog-search-inline"
            type="text"
            placeholder="Buscar por modelo, marca o SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="red-glow-hover w-full rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none backdrop-blur-[2px] md:w-72"
          />
        </div>

        {/* Resultados a la izquierda y botón de filtros en la esquina derecha */}
        <div ref={filtersRef} className="relative flex items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500">
            {processedProducts.length} {processedProducts.length === 1 ? 'resultado' : 'resultados'}
          </span>

          <button
            id="catalog-filters-btn"
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen(open => !open)}
            className={`red-glow-hover inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors ${
              filtersOpen || activeChips.length > 0
                ? 'border-white/40 bg-white/10 text-white'
                : 'border-white/15 bg-white/[0.03] text-white/80 hover:border-white/35 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filtros</span>
            {activeChips.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] text-black">
                {activeChips.length}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {filtersOpen && (
            <div
              id="catalog-filters-panel"
              className="search-panel absolute right-0 top-full z-30 mt-3 max-h-[70vh] w-[min(92vw,380px)] overflow-y-auto rounded-2xl border border-neutral-800 shadow-2xl shadow-black"
            >
              <div className="px-1.5 pt-1">
              <FilterSection id="sort" label="Ordenar" summary={SORT_OPTIONS.find(option => option.id === sortBy)!.label} openId={openSection} setOpenId={setOpenSection}>
              <div className="space-y-1">
                {SORT_OPTIONS.map(option => (
                  <OptionRow
                    key={option.id}
                    selected={sortBy === option.id}
                    onClick={() => {
                      setSortBy(option.id);
                    }}
                  >
                    {option.label}
                  </OptionRow>
                ))}
              </div>
              </FilterSection>
              <FilterSection id="brand" label="Marca" summary={selectedBrandIds.length ? `${selectedBrandIds.length} seleccionadas` : 'Todas'} openId={openSection} setOpenId={setOpenSection}>
            <div className="space-y-1">
              {brands.map(b => (
                <OptionRow
                  key={b.id}
                  selected={selectedBrandIds.includes(b.id)}
                  onClick={() => setSelectedBrandIds(prev => toggleIn(prev, b.id))}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-5 w-10 items-center justify-center">
                      <BrandLogo brand={b} className="h-5 w-auto max-w-[40px]" fallbackClassName="hidden" />
                    </span>
                    {b.name}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-600">
                    {products.filter(p => p.brandId === b.id).length}
                  </span>
                </OptionRow>
              ))}
            </div>
              </FilterSection>
              <FilterSection id="size" label="Talla US" summary={selectedSizes.length ? selectedSizes.join(', ') : 'Todas'} openId={openSection} setOpenId={setOpenSection}>
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
              </FilterSection>
              <FilterSection id="price" label="Precio" summary={selectedPrices.length ? `${selectedPrices.length} rangos` : 'Todos'} openId={openSection} setOpenId={setOpenSection}>
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
              </FilterSection>
              <FilterSection id="collection" label="Colección" summary={selectedTags.length ? `${selectedTags.length} activas` : 'Todas'} openId={openSection} setOpenId={setOpenSection}>
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
              </FilterSection>
              <FilterSection id="rating" label="Calificación" summary={minRating !== null ? `${minRating}+` : 'Todas'} openId={openSection} setOpenId={setOpenSection}>
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
              </FilterSection>
              <FilterSection id="currency" label="Moneda" summary={currency} openId={openSection} setOpenId={setOpenSection}>
              <div className="space-y-1">
                {currencyOptions.map(code => (
                  <OptionRow
                    key={code}
                    selected={currency === code}
                    onClick={() => {
                      setCurrency(code);
                    }}
                  >
                    {code}
                  </OptionRow>
                ))}
              </div>
              </FilterSection>
              </div>

              <div className="sticky bottom-0 flex items-center gap-2 border-t border-white/10 bg-[rgba(8,8,9,0.98)] p-3">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(false)}
                  className="flex-1 rounded-full bg-white px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-black transition-colors hover:bg-neutral-200"
                >
                  Ver {processedProducts.length}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Filtros activos + conteo */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
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

    </div>
  );
};
