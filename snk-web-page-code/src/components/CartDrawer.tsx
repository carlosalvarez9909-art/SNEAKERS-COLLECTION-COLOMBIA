import React, { useState } from 'react';
import { finalUnitPrice, hasFreeShipping } from '../lib/price';
import { useApp } from '../context/AppContext';
import { X, Trash2, Plus, Minus, Tag, AlertCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { 
    cart, 
    updateCartQuantity, 
    removeFromCart, 
    formatPrice, 
    activeCoupon, 
    applyCoupon, 
    removeCoupon, 
    navigateTo 
  } = useApp();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  if (!isOpen) return null;

  const handleQtyChange = (itemId: string, qty: number) => {
    updateCartQuantity(itemId, qty);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const subtotal = cart.reduce((sum, item) => {
    const discountedUnit = finalUnitPrice(item.product.basePrice, item.product.discount);
    return sum + discountedUnit * item.quantity;
  }, 0);

  const discountAmount = activeCoupon
    ? activeCoupon.type === 'percent'
      ? subtotal * (activeCoupon.value / 100)
      : activeCoupon.value
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const handleGoToCheckout = () => {
    onClose();
    navigateTo({ type: 'checkout' });
  };

  return (
    <div id="cart-drawer-backdrop" className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-[2px]">
      <div 
        id="cart-drawer"
        className="w-full max-w-md h-full bg-neutral-950 border-l border-neutral-900 flex flex-col justify-between p-6 shadow-2xl shadow-black z-50 animate-slide-in"
      >
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center space-x-2.5">
            <h3 className="font-sans text-lg font-black uppercase tracking-[-0.06em] luxury-title">Tu Carrito</h3>
            <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-neutral-950 font-mono">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} ITEMS
            </span>
          </div>
          <button
            id="cart-drawer-close"
            onClick={onClose}
            className="rounded-lg bg-neutral-900 p-2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Drawer Content List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          {cart.length > 0 ? (
            cart.map(item => {
              const discountedUnit = finalUnitPrice(item.product.basePrice, item.product.discount);
              return (
                <div 
                  id={`cart-item-row-${item.id}`}
                  key={item.id} 
                  className="flex items-center space-x-3 rounded-xl border border-neutral-900 bg-neutral-900/10 p-3"
                >
                  <img 
                    src={item.product.images[0]} 
                    alt="" 
                    className="h-16 w-16 rounded-lg bg-neutral-900 object-contain p-1" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="truncate text-xs font-bold text-white">{item.product.name}</h4>
                    <p className="text-[10px] text-neutral-500 font-mono">
                      EU {item.selectedSize} | {item.selectedColor.name}
                    </p>
                    
                    {/* Price Tag */}
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="text-xs font-sans font-bold text-white">
                        {formatPrice(discountedUnit * item.quantity)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-neutral-500 font-sans">
                          ({formatPrice(discountedUnit)} c/u)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Actions & Delete */}
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      id={`cart-item-del-${item.id}`}
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-500 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-950 p-1">
                      <button
                        id={`cart-item-minus-${item.id}`}
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-mono font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        id={`cart-item-plus-${item.id}`}
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        className="text-neutral-400 hover:text-white"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div id="cart-drawer-empty" className="h-full flex flex-col items-center justify-center text-center p-6">
              <AlertCircle className="h-10 w-10 text-neutral-600 mb-2" />
              <h4 className="text-xs font-bold text-neutral-300 uppercase">Tu carrito está vacío</h4>
              <p className="text-[10px] text-neutral-500 font-sans mt-1">Explora nuestro catálogo exclusivo para agregar referencias premium.</p>
              <button
                id="cart-drawer-empty-catalog-btn"
                onClick={() => {
                  onClose();
                  navigateTo({ type: 'catalog' });
                }}
                className="mt-5 rounded-full bg-amber-500 px-5 py-2.5 text-xs font-bold text-neutral-950"
              >
                Ir al catálogo
              </button>
            </div>
          )}
        </div>

        {/* Drawer Summary & Promo Coupons */}
        {cart.length > 0 && (
          <div className="border-t border-neutral-900 pt-4 space-y-4">
            
            {/* Promo Coupon Form */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-500" />
                <input
                  id="coupon-input"
                  type="text"
                  placeholder="CUPÓN (WELCOME10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full rounded-lg border border-neutral-900 bg-neutral-950 py-2 pl-9 pr-3 text-xs placeholder-neutral-600 outline-none focus:border-amber-500/50 uppercase"
                />
              </div>
              <button
                id="apply-coupon-btn"
                type="submit"
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-xs font-bold hover:bg-neutral-800 transition-colors uppercase"
              >
                Aplicar
              </button>
            </form>

            {/* Coupon feedback messages */}
            {couponError && <p id="coupon-error-msg" className="text-[10px] text-red-500 font-mono">{couponError}</p>}
            {couponSuccess && <p id="coupon-success-msg" className="text-[10px] text-emerald-500 font-mono">{couponSuccess}</p>}

            {/* Active Coupon Badge if applicable */}
            {activeCoupon && (
              <div id="active-coupon-badge" className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-xs text-emerald-500">
                <div className="flex items-center space-x-1.5 font-mono font-bold">
                  <Tag className="h-3.5 w-3.5" />
                  <span>CUPÓN: {activeCoupon.code}</span>
                </div>
                <button
                  id="remove-coupon-badge"
                  onClick={removeCoupon}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Checkout Pricing breakdown */}
            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between text-neutral-400">
                <span>Subtotal</span>
                <span className="font-semibold text-white">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío</span>
                {cart.every(item => hasFreeShipping(finalUnitPrice(item.product.basePrice, item.product.discount)))
                    ? <span className="font-bold uppercase text-emerald-400">Gratis</span>
                    : <span className="text-right text-neutral-400">Se coordina por WhatsApp</span>}
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Descuento</span>
                  <span className="font-semibold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-white font-black border-t border-neutral-900 pt-2">
                <span>TOTAL</span>
                <span className="text-amber-500 font-extrabold text-base">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout CTAs */}
            <button
              id="cart-go-checkout-btn"
              onClick={handleGoToCheckout}
              className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-bold text-xs py-3 px-6 tracking-widest hover:opacity-95 transition-all uppercase"
            >
              Iniciar Checkout
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
