import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Search, Heart, ShoppingBag, Settings, X, Star, Sparkles } from 'lucide-react';
import { CurrencyCode } from '../types';
import { OriginalLogo } from './OriginalLogo';

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
    products
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
          
          {/* Instant Search Bar */}
          <div ref={searchRef} className="relative hidden sm:block w-48 lg:w-64">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  placeholder="Buscar Nike, Jordan, SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDrop(true);
                  }}
                  onFocus={() => setShowSearchDrop(true)}
                  className="w-full rounded-full border border-neutral-800 bg-neutral-900 py-1.5 pl-4 pr-10 text-xs text-white placeholder-neutral-500 outline-none transition-all focus:border-amber-500/50 focus:bg-neutral-900/50 focus:ring-1 focus:ring-amber-500/30"
                />
                <button type="submit" className="absolute right-3.5 top-2.5 text-neutral-500 hover:text-white">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Live Autocomplete suggestions dropdown */}
            {showSearchDrop && searchQuery.trim() !== '' && (
              <div id="search-autocomplete" className="absolute left-0 mt-2 w-full rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl shadow-black/80 ring-1 ring-black/50 z-50">
                <div className="mb-2 text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                  Sugerencias de Calzado
                </div>
                {filteredSuggestions.length > 0 ? (
                  <div className="space-y-1.5">
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
                    <div 
                      id="search-view-all"
                      onClick={() => {
                        setShowSearchDrop(false);
                        navigateTo({ type: 'catalog' });
                      }}
                      className="border-t border-neutral-900 pt-2 text-center text-[11px] font-medium text-amber-500 cursor-pointer hover:underline"
                    >
                      Ver todos los resultados
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-neutral-500">
                    No se encontraron coincidencias
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Favorites Button */}
          <button
            id="header-fav-btn"
            onClick={() => navigateTo({ type: 'favorites' })}
            className={`relative rounded-lg p-1.5 transition-colors hover:bg-neutral-900 ${activeView.type === 'favorites' ? 'text-red-500' : 'text-neutral-400 hover:text-white'}`}
          >
            <Heart className={`h-5 w-5 ${favorites.length > 0 && activeView.type !== 'favorites' ? 'fill-red-500 text-red-500' : ''}`} />
            {favorites.length > 0 && (
              <span id="fav-badge" className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {favorites.length}
              </span>
            )}
          </button>

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
