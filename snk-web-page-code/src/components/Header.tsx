import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Heart, ShoppingBag, Settings, Sparkles, Home, LayoutGrid, Info, ChevronDown } from 'lucide-react';
import type { ViewState } from '../types';
import { OriginalLogo } from './OriginalLogo';
import { COLOR_FAMILIES, STYLES, colorFamiliesOf, styleOf } from '../lib/productFacets';

interface HeaderProps {
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const { 
    activeView, 
    navigateTo, 
    searchQuery, 
    setSearchQuery, 
    currency, 
    setCurrency, 
    favorites, 
    cart, 
    products,
    brands
  } = useApp();

  const [showSearchDrop, setShowSearchDrop] = useState(false);
  const [openFacet, setOpenFacet] = useState<'marcas' | 'colores' | 'estilos' | null>(null);
  const [showCurrencyDrop, setShowCurrencyDrop] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDrop(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
        setShowCurrencyDrop(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products for instant search dropdown
  const filteredSuggestions = searchQuery.trim() === ''
    ? []
    : products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandId.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchDrop(false);
    navigateTo({ type: 'catalog' });
  };

  const goTo = (view: ViewState) => {
    setShowSearchDrop(false);
    navigateTo(view);
  };

  const menuSections: {
    id: string;
    label: string;
    view: ViewState;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'home', label: 'Inicio', view: { type: 'home' }, icon: Home },
    { id: 'catalog', label: 'Catálogo', view: { type: 'catalog' }, icon: LayoutGrid },
    { id: 'recommendations', label: 'Recomendaciones', view: { type: 'recommendations' }, icon: Sparkles },
    { id: 'about', label: 'Llega seguro', view: { type: 'about' }, icon: Info },
    { id: 'favorites', label: 'Tus favoritos', view: { type: 'favorites' }, icon: Heart, badge: favorites.length }
  ];

  const handleSuggestionClick = (productId: string) => {
    setSearchQuery('');
    setShowSearchDrop(false);
    navigateTo({ type: 'product', productId });
  };

  const navLinkClass = (isActive: boolean) =>
    `text-sm font-medium tracking-wide transition-colors ${
      isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-900 bg-black/25 backdrop-blur-[2px]">
      <div id="header-container" className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo & Brand Slogan */}
        <div 
          id="header-logo"
          onClick={() => navigateTo({ type: 'home' })}
          className="flex cursor-pointer items-center transition-transform hover:scale-105 duration-200"
        >
          <OriginalLogo size="sm" showTagline={false} className="scale-110" />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            id="nav-btn-home"
            onClick={() => navigateTo({ type: 'home' })}
            className={navLinkClass(activeView.type === 'home')}
          >
            Inicio
          </button>

          <button 
            id="nav-btn-catalog"
            onClick={() => navigateTo({ type: 'catalog' })}
            className={navLinkClass(activeView.type === 'catalog')}
          >
            Catálogo
          </button>

          <button 
            id="nav-btn-recommendations"
            onClick={() => navigateTo({ type: 'recommendations' })}
            className={navLinkClass(activeView.type === 'recommendations')}
          >
            Recomendaciones
          </button>

          <button 
            id="nav-btn-about"
            onClick={() => navigateTo({ type: 'about' })}
            className={navLinkClass(activeView.type === 'about')}
          >
            Llega seguro
          </button>
        </nav>

        {/* Action Controls: Search, Currency, Favorites, Cart, Admin */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          {/* Lupa: búsqueda + menú desplegable para moverse por la tienda */}
          <div ref={searchRef} className="relative">
            <button
              id="header-search-btn"
              type="button"
              onClick={() => setShowSearchDrop(open => !open)}
              aria-expanded={showSearchDrop}
              aria-label="Buscar y navegar"
              className={`rounded-lg p-1.5 transition-colors hover:bg-neutral-900 ${showSearchDrop ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}
            >
              <Search className="h-5 w-5" />
            </button>

            {showSearchDrop && (
              <div
                id="search-nav-dropdown"
                className="search-panel fixed inset-x-3 top-[84px] z-50 max-h-[calc(100dvh-100px)] overflow-y-auto rounded-2xl border border-neutral-800 p-4 shadow-2xl shadow-black/80 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]"
              >
                <form onSubmit={handleSearchSubmit}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <input
                      id="search-input"
                      type="text"
                      autoFocus
                      placeholder="Buscar modelo, marca o SKU..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setShowSearchDrop(false); }}
                      className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-base text-white sm:text-sm placeholder-neutral-500 outline-none transition-all focus:border-white/30 focus:ring-1 focus:ring-white/10"
                    />
                  </div>
                </form>

                {searchQuery.trim() !== '' && (
                  <div id="search-autocomplete" className="mt-3">
                    <div className="mb-2 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                      Resultados
                    </div>
                    {filteredSuggestions.length > 0 ? (
                      <div className="space-y-1">
                        {filteredSuggestions.map(p => (
                          <div
                            id={`search-suggestion-${p.id}`}
                            key={p.id}
                            onClick={() => handleSuggestionClick(p.id)}
                            className="flex cursor-pointer items-center space-x-3 rounded-lg p-1.5 transition-colors hover:bg-neutral-900"
                          >
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="h-10 w-10 rounded-lg object-cover bg-neutral-900"
                              referrerPolicy="no-referrer"
                            />
                            <div className="overflow-hidden">
                              <h4 className="truncate text-xs font-medium text-white">{p.name}</h4>
                              <p className="text-[10px] text-neutral-400 font-mono">{p.sku}</p>
                            </div>
                          </div>
                        ))}
                        <button
                          id="search-view-all"
                          type="button"
                          onClick={() => goTo({ type: 'catalog' })}
                          className="w-full border-t border-neutral-900 pt-2 text-center text-[11px] font-medium text-white/80 hover:text-white hover:underline"
                        >
                          Ver todos los resultados
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 text-center text-xs text-neutral-500">
                        No se encontraron coincidencias
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 border-t border-neutral-900 pt-3">
                  <div className="mb-1.5 px-1 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                    Explorar
                  </div>
                  {menuSections.map(({ id, label, view, icon: Icon, badge }) => (
                    <button
                      key={id}
                      id={`menu-${id}`}
                      type="button"
                      onClick={() => goTo(view)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-neutral-900 ${activeView.type === view.type ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      {badge ? (
                        <span className="rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">{badge}</span>
                      ) : null}
                    </button>
                  ))}
                </div>

                {(() => {
                  const facets = [
                    {
                      id: 'marcas' as const,
                      label: 'Marcas',
                      items: brands
                        .map(b => ({ key: b.id, label: b.name, count: products.filter(p => p.brandId === b.id).length, view: { type: 'catalog', filters: { brandId: b.id } } as ViewState }))
                        .filter(i => i.count > 0)
                        .sort((a, b) => a.label.localeCompare(b.label))
                    },
                    {
                      id: 'colores' as const,
                      label: 'Colores',
                      items: COLOR_FAMILIES
                        .map(f => ({ key: f.id, label: f.label, hex: f.hex as string, count: products.filter(p => colorFamiliesOf(p).includes(f.id)).length, view: { type: 'catalog', filters: { color: f.id } } as ViewState }))
                        .filter(i => i.count > 0)
                    },
                    {
                      id: 'estilos' as const,
                      label: 'Estilos',
                      items: STYLES
                        .map(st => ({ key: st.id, label: st.label, count: products.filter(p => styleOf(p) === st.id).length, view: { type: 'catalog', filters: { style: st.id } } as ViewState }))
                        .filter(i => i.count > 0)
                    }
                  ].filter(f => f.items.length > 0);
                  return (
                    <div className="mt-3 border-t border-neutral-900 pt-3">
                      <div className="mb-1.5 px-1 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                        Filtrar por
                      </div>
                      {facets.map(facet => {
                        const isOpen = openFacet === facet.id;
                        return (
                          <div key={facet.id} className="border-b border-white/5 last:border-b-0">
                            <button
                              type="button"
                              aria-expanded={isOpen}
                              onClick={() => setOpenFacet(isOpen ? null : facet.id)}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2.5 text-sm transition-colors hover:bg-neutral-900 ${isOpen ? 'text-white' : 'text-neutral-400 hover:text-white'}`}
                            >
                              <span>{facet.label}</span>
                              <span className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-neutral-600">{facet.items.length}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                              </span>
                            </button>
                            {isOpen && (
                              <div className="grid grid-cols-2 gap-1 px-1 pb-3 pt-1">
                                {facet.items.map(item => (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => goTo(item.view)}
                                    className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-2 text-left text-xs text-neutral-300 transition-colors hover:border-white/25 hover:bg-white/[0.07] hover:text-white"
                                  >
                                    <span className="flex min-w-0 items-center gap-2">
                                      {'hex' in item && (
                                        <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/25" style={{ backgroundColor: item.hex }} />
                                      )}
                                      <span className="truncate">{item.label}</span>
                                    </span>
                                    <span className="shrink-0 font-mono text-[10px] text-neutral-600">{item.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                <div className="mt-4 flex justify-center border-t border-neutral-900 pt-5 pb-1">
                  <img
                    src="/sneakers-world.png"
                    alt="Top Quality Shoes · Sneakers World®"
                    className="h-auto w-[78%] max-w-[280px] select-none"
                    draggable={false}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cart Trigger Button */}
          <button
            id="header-cart-btn"
            onClick={onOpenCart}
            className="relative rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartItemsCount > 0 && (
              <span id="cart-badge" className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-neutral-950">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* Admin Dashboard Panel Trigger */}
          <button
            id="header-admin-btn"
            onClick={() => navigateTo({ type: 'admin' })}
            className={`rounded-lg p-1.5 transition-colors hover:bg-neutral-900 ${activeView.type === 'admin' ? 'text-amber-500' : 'text-neutral-500 hover:text-neutral-300'}`}
            title="Panel de Administrador"
          >
            <Settings className="h-5 w-5" />
          </button>

        </div>
      </div>
    </header>
  );
};
