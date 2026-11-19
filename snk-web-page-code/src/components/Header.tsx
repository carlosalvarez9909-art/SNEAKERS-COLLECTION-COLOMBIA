import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Heart, ShoppingBag, Settings, Sparkles, Home, LayoutGrid, Info } from 'lucide-react';
import type { ViewState } from '../types';
import { OriginalLogo } from './OriginalLogo';
import { BrandLogo } from './BrandLogo';

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
    { id: 'about', label: 'Sobre nosotros', view: { type: 'about' }, icon: Info },
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
            Sobre nosotros
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
                className="fixed inset-x-3 top-[84px] z-50 max-h-[calc(100vh-100px)] overflow-y-auto rounded-2xl border border-neutral-800 bg-neutral-950/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-md sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[380px]"
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
                      className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none transition-all focus:border-white/30 focus:ring-1 focus:ring-white/10"
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

                {brands.length > 0 && (
                  <div className="mt-3 border-t border-neutral-900 pt-3">
                    <div className="mb-2 px-1 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                      Marcas
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {brands.map(b => (
                        <button
                          key={b.id}
                          type="button"
                          title={b.name}
                          onClick={() => goTo({ type: 'brand', brandId: b.id })}
                          className="group flex h-14 items-center justify-center rounded-xl border border-white/5 bg-white/[0.03] px-2 transition-colors hover:border-white/20 hover:bg-white/[0.07]"
                        >
                          <BrandLogo
                            brand={b}
                            fit={{ area: 1500, maxWidth: 88, maxHeight: 38 }}
                            className="brand-logo-img h-8 w-auto max-w-[88px]"
                            fallbackClassName="text-[10px] font-bold uppercase text-neutral-300"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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
