import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { SlidersHorizontal, Sliders, X, Check, Star, Trash2 } from 'lucide-react';

export const CatalogView: React.FC = () => {
  const { 
    products, 
    brands, 
    searchQuery, 
    setSearchQuery, 
    compareProductIds, 
    toggleCompare, 
    clearCompare, 
    formatPrice,
    currency,
    setCurrency
  } = useApp();

  // Advanced Filter States
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(2000000); // 2M COP max
  const [showLimitedOnly, setShowLimitedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('default');
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Available Sizes for catalog filter
  const SIZES_POOLS = [6, 7, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13];
  const currencyOptions = ['COP', 'USD', 'EUR', 'MXN'] as const;

  // Reset Filters trigger
  const handleResetFilters = () => {
    setSelectedBrandId('all');
    setSelectedSize(null);
    setMaxPrice(2000000);
    setShowLimitedOnly(false);
    setSortBy('default');
    setSearchQuery('');
  };

  // Filter & Sort Logic
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Search query matching
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.sku.toLowerCase().includes(q) || 
        p.brandId.toLowerCase().includes(q)
      );
    }

    // Brand matching
    if (selectedBrandId !== 'all') {
      result = result.filter(p => p.brandId === selectedBrandId);
    }

    // Size matching
    if (selectedSize !== null) {
      result = result.filter(p => p.sizes.includes(selectedSize));
    }

    // Max Price matching (taking discount into consideration)
    result = result.filter(p => {
      const finalPrice = p.basePrice * (1 - p.discount / 100);
      return finalPrice <= maxPrice;
    });

    // Limited edition filter
    if (showLimitedOnly) {
      result = result.filter(p => p.isLimited);
    }

    // Sort order
    if (sortBy === 'price-asc') {
      result.sort((a, b) => {
        const pA = a.basePrice * (1 - a.discount / 100);
        const pB = b.basePrice * (1 - b.discount / 100);
        return pA - pB;
      });
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => {
        const pA = a.basePrice * (1 - a.discount / 100);
        const pB = b.basePrice * (1 - b.discount / 100);
        return pB - pA;
      });
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      result.sort((a, b) => b.discount - a.discount);
    }

    return result;
  }, [products, searchQuery, selectedBrandId, selectedSize, maxPrice, showLimitedOnly, sortBy]);

  // Load objects of products selected for comparison
  const comparedProducts = useMemo(() => {
    return products.filter(p => compareProductIds.includes(p.id));
  }, [products, compareProductIds]);

  return (
    <div className="bg-transparent text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-900 pb-6 gap-4">
          <div>
            <h2 className="font-sans text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
              Catálogo de Sneakers
            </h2>
            <p className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase mt-1">
              Colección completa con piezas curadas de autenticidad absoluta
            </p>
          </div>

          {/* Quick Search & Sorter */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="catalog-search-inline"
              type="text"
              placeholder="Buscar por modelo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-neutral-900 bg-neutral-950 px-4 py-2 text-xs placeholder-neutral-600 outline-none focus:border-amber-500/50"
            />

            <select
              id="catalog-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-neutral-900 bg-neutral-950 px-4 py-2 text-xs font-mono text-neutral-300 outline-none cursor-pointer focus:border-amber-500/50"
            >
              <option value="default">Relevancia</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="rating">Mejor Calificados</option>
              <option value="discount">Mayores Descuentos</option>
            </select>
          </div>
        </div>

        {/* Content Directory layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* SIDEBAR FILTERS (3 columns) */}
          <aside className="lg:col-span-3 space-y-6">
            
            {/* Header filters */}
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-mono tracking-widest text-white uppercase font-bold">Filtros</span>
              </div>
              <button
                id="catalog-reset-filters-btn"
                onClick={handleResetFilters}
                className="text-[10px] font-mono text-neutral-500 hover:text-white transition-colors uppercase underline"
              >
                Limpiar Todo
              </button>
            </div>

            {/* Filter by Brand */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Marcas</h4>
              <div className="space-y-1.5">
                <button
                  id="catalog-brand-opt-all"
                  onClick={() => setSelectedBrandId('all')}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${selectedBrandId === 'all' ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
                >
                  <span>Todas las marcas</span>
                  {selectedBrandId === 'all' && <Check className="h-3.5 w-3.5" />}
                </button>
                {brands.map(b => (
                  <button
                    id={`catalog-brand-opt-${b.id}`}
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors ${selectedBrandId === b.id ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}
                  >
                    <span>{b.name}</span>
                    {selectedBrandId === b.id && <Check className="h-3.5 w-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Size */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Talla US</h4>
              <div className="grid grid-cols-4 gap-1.5">
                {SIZES_POOLS.map(size => (
                  <button
                    id={`catalog-size-opt-${size}`}
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className={`rounded-lg border py-2 text-xs font-mono font-bold transition-colors ${selectedSize === size ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-900 text-neutral-400 hover:border-neutral-800 hover:text-white'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Price Range */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Precio Máximo</h4>
                <span className="text-xs font-mono text-white">{formatPrice(maxPrice)}</span>
              </div>
              <input
                id="catalog-price-slider"
                type="range"
                min="400000"
                max="2000000"
                step="50000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 uppercase">
                <span>{formatPrice(400000)}</span>
                <span>{formatPrice(2000000)}</span>
              </div>
            </div>

            {/* Currency Selector */}
            <div className="space-y-2 border-t border-neutral-900 pt-4">
              <h4 className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Divisa</h4>
              <div className="flex flex-wrap gap-2">
                {currencyOptions.map(code => (
                  <button
                    id={`catalog-currency-opt-${code}`}
                    key={code}
                    onClick={() => setCurrency(code)}
                    className={`rounded-lg px-2.5 py-1.5 text-[9px] font-sans font-black uppercase transition-all ${
                      currency === code
                        ? 'bg-amber-500 text-neutral-950 shadow'
                        : 'border border-neutral-900 bg-neutral-950 text-neutral-400 hover:border-neutral-800 hover:text-white'
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by Special Editions */}
            <div className="border-t border-neutral-900 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  id="catalog-limited-checkbox"
                  type="checkbox"
                  checked={showLimitedOnly}
                  onChange={(e) => setShowLimitedOnly(e.target.checked)}
                  className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0 focus:ring-offset-0"
                />
                <span className="text-xs text-neutral-300 font-sans">Exclusivo / Edición Limitada</span>
              </label>
            </div>

          </aside>

          {/* PRODUCT RESULTS CATALOG GRID (9 columns) */}
          <main className="lg:col-span-9 space-y-6">
            
            {processedProducts.length > 0 ? (
              <div id="catalog-products-grid" className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {processedProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div id="catalog-no-results" className="text-center py-20 border border-neutral-900 rounded-2xl bg-neutral-900/10">
                <Sliders className="mx-auto h-10 w-10 text-neutral-500" />
                <h3 className="mt-4 text-sm font-bold text-white uppercase">Sin coincidencias</h3>
                <p className="mt-1 text-xs text-neutral-500">Prueba ajustando los filtros o eliminando la búsqueda.</p>
                <button
                  id="catalog-clear-filters-err-btn"
                  onClick={handleResetFilters}
                  className="mt-5 rounded-full bg-amber-500 px-5 py-2 text-xs font-bold text-neutral-950 hover:bg-amber-600"
                >
                  Restablecer Catálogo
                </button>
              </div>
            )}

          </main>

        </div>

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
