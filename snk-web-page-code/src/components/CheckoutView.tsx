import React, { useState } from 'react';
import { finalUnitPrice, hasFreeShipping } from '../lib/price';
import { useApp } from '../context/AppContext';
import { LogoRow, PAYMENT_LOGOS } from './TrustLogos';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  X, Check, ShoppingBag, ShieldCheck, Truck, Sparkles, 
  ArrowRight, AlertCircle, ShoppingCart 
} from 'lucide-react';

export const CheckoutView: React.FC = () => {
  const { 
    cart, 
    formatPrice, 
    activeCoupon, 
    placeOrder, 
    clearCart, 
    navigateTo, 
    currencyConfig 
  } = useApp();

  // Form States
  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'whatsapp'>('whatsapp');
  const [isCompleted, setIsCompleted] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<any>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  if (cart.length === 0 && !isCompleted) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-neutral-600" />
        <h3 className="mt-4 text-lg font-bold text-white uppercase">El carrito está vacío</h3>
        <p className="mt-2 text-sm text-neutral-500">Agrega zapatillas de catálogo antes de ingresar al checkout.</p>
        <button
          id="checkout-err-back"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="mt-6 rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-neutral-950"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  // Cost calculations
  const subtotal = cart.reduce((sum, item) => {
    const discountedUnit = finalUnitPrice(item.product.basePrice, item.product.discount);
    return sum + discountedUnit * item.quantity;
  }, 0);

  const discountAmount = activeCoupon && paymentMethod !== 'card'
    ? activeCoupon.type === 'percent'
      ? subtotal * (activeCoupon.value / 100)
      : activeCoupon.value
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    });
  };

  // 1. Traditional Online Checkout Form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.name || !customer.phone || !customer.email || !customer.address || !customer.city) return;
    if (paymentMethod === 'card') {
      void handleBoldPayment();
      return;
    }

    void handleCashOnDelivery();
  };

  // Pedido contra entrega: queda registrado en Supabase y aparece en el panel de administración.
  const handleCashOnDelivery = async () => {
    if (!isSupabaseConfigured) {
      const orderObj = placeOrder(customer);
      setGeneratedOrder(orderObj);
      setIsCompleted(true);
      clearCart();
      return;
    }
    setIsCreatingPayment(true);
    setPaymentError('');
    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor.name
          })),
          customer,
          couponCode: activeCoupon?.code
        })
      });
      const result = await response.json() as { reference?: string; total?: number; error?: string };
      if (!response.ok || !result.reference) {
        throw new Error(result.error || 'No se pudo registrar el pedido.');
      }
      setGeneratedOrder({
        id: result.reference.slice(0, 12).toUpperCase(),
        customerName: customer.name,
        city: customer.city,
        address: customer.address,
        totalPrice: result.total
      });
      setIsCompleted(true);
      clearCart();
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'No se pudo registrar el pedido.');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleBoldPayment = async () => {
    const form = document.querySelector<HTMLFormElement>('#checkout-customer-form');
    if (form && !form.reportValidity()) return;

    if (!customer.name || !customer.phone || !customer.email || !customer.address || !customer.city) {
      setPaymentError('Completa todos los datos del cliente antes de continuar al pago.');
      return;
    }

    setIsCreatingPayment(true);
    setPaymentError('');
    try {
      const response = await fetch('/api/create-bold-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            color: item.selectedColor.name
          })),
          customer
        })
      });
      const result = await response.json() as { paymentUrl?: string; error?: string };
      if (!response.ok || !result.paymentUrl) {
        throw new Error(result.error || 'No se pudo iniciar el pago.');
      }

      clearCart();
      window.location.assign(result.paymentUrl);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'No se pudo iniciar el pago.');
      setIsCreatingPayment(false);
    }
  };

  // 2. WhatsApp Direct Checkout Order Builder
  const handleWhatsAppCheckout = () => {
    if (!customer.name || !customer.phone || !customer.address || !customer.city) {
      alert('Por favor complete los campos obligatorios para generar su pedido de WhatsApp (Nombre, Teléfono, Dirección y Ciudad).');
      return;
    }

    const orderId = `SNK-WA-${Date.now().toString().slice(-5)}`;
    const itemsText = cart.map((item, idx) => {
      const unitFinalP = finalUnitPrice(item.product.basePrice, item.product.discount);
      return `${idx + 1}. *${item.product.name}* \n   [Talla: EU ${item.selectedSize} | Color: ${item.selectedColor.name} | Qty: ${item.quantity}] \n   Precio: ${formatPrice(unitFinalP * item.quantity)}`;
    }).join('\n\n');

    const couponText = activeCoupon ? `\n*Cupón Aplicado:* ${activeCoupon.code} (-${activeCoupon.type === 'percent' ? `${activeCoupon.value}%` : formatPrice(activeCoupon.value)})` : '';

    const text = `Hola Sneakers Collection! 👑 Acabo de pre-configurar mi pedido desde el checkout del sitio web:\n\n*Pedido ID:* #${orderId}\n\n*DATOS DE ENVÍO:*\n👤 *Nombre:* ${customer.name}\n📞 *Teléfono:* ${customer.phone}\n📍 *Dirección:* ${customer.address}\n🏙️ *Ciudad:* ${customer.city}\n\n*SNEAKERS SOLICITADOS:*\n${itemsText}\n${couponText}\n\n⭐ *TOTAL DEL PEDIDO:* ${formatPrice(total)} (${currencyConfig.code})\n\nPor favor, indíquenme los datos de pago para confirmar mi orden. ¡Muchas gracias!`;
    const encodedText = encodeURIComponent(text);
    
    // Register order in database too so admin tracks it
    placeOrder(customer);
    clearCart();
    
    // Open chat
    window.open(`https://wa.me/573000000000?text=${encodedText}`, '_blank');
    setIsCompleted(true);
  };

  return (
    <div className="bg-transparent text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Banner header */}
        <div className="mb-10 border-b border-neutral-900 pb-6">
          <h2 className="font-sans text-2xl font-black uppercase tracking-[-0.06em] luxury-title sm:text-3xl">
            {isCompleted ? '¡Pedido Confirmado!' : 'Checkout Seguro'}
          </h2>
          <p className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase mt-1">
            {isCompleted ? 'Su pedido se encuentra en proceso de despacho' : 'Complete sus datos de envío y pago para finalizar su orden'}
          </p>
        </div>

        {/* 1. SUCCESS RECEIPT PAGE VIEW */}
        {isCompleted ? (
          <div id="checkout-success-view" className="mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/10 p-8 text-center space-y-6">
            
            {/* Crown/Success Check */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
              <Check className="h-7 w-7 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <h3 className="font-sans text-xl font-bold uppercase">¡Gracias por su Compra!</h3>
              <p className="text-xs text-neutral-400 font-sans max-w-md mx-auto">
                Su orden ha sido guardada en nuestra base de datos en tiempo real. Un especialista de Sneakers Collection se pondrá en contacto con usted para coordinar los detalles finales.
              </p>
            </div>

            {/* Receipt Details Box */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-left space-y-3 font-mono text-xs text-neutral-400">
              <div className="flex justify-between border-b border-neutral-900 pb-2 text-white">
                <span>Orden ID</span>
                <span className="font-bold text-amber-500">#{generatedOrder?.id || 'SNK-WA-COMP'}</span>
              </div>
              <div className="flex justify-between">
                <span>Destinatario</span>
                <span className="text-white">{customer.name || generatedOrder?.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Ciudad Destino</span>
                <span className="text-white">{customer.city || generatedOrder?.city}</span>
              </div>
              <div className="flex justify-between">
                <span>Dirección</span>
                <span className="text-white">{customer.address || generatedOrder?.address}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-900 pt-2 text-sm text-white font-black">
                <span>TOTAL DE ORDEN</span>
                <span className="text-amber-500">{formatPrice(generatedOrder?.totalPrice || total)}</span>
              </div>
            </div>

            {/* Stepper tracking */}
            <div className="grid grid-cols-3 gap-2 py-4">
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center text-[10px] font-bold">1</div>
                <span className="text-[9px] font-mono uppercase text-neutral-400 mt-1">Registrado</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center text-[10px] font-bold">2</div>
                <span className="text-[9px] font-mono uppercase text-neutral-500 mt-1">Despacho</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center text-[10px] font-bold">3</div>
                <span className="text-[9px] font-mono uppercase text-neutral-500 mt-1">En camino</span>
              </div>
            </div>

            <button
              id="success-back-catalog"
              onClick={() => navigateTo({ type: 'catalog' })}
              className="rounded-full bg-amber-500 hover:bg-amber-600 px-6 py-3 text-xs font-bold text-neutral-950 transition-colors uppercase tracking-widest"
            >
              Seguir Comprando
            </button>

          </div>
        ) : (
          /* 2. CHECKOUT SPLIT VIEW FORM */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* LEFT: Shipping details & pay parameters (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 sm:p-8 space-y-6">
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase border-b border-neutral-900 pb-2.5">
                  1. Detalles de Entrega y Envío
                </h3>

                <form id="checkout-customer-form" onSubmit={handleFormSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Nombre Completo *</label>
                    <input
                      id="checkout-name"
                      type="text"
                      name="name"
                      required
                      placeholder="Ej. Mateo Restrepo"
                      value={customer.name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Teléfono Móvil (WhatsApp) *</label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      name="phone"
                      required
                      placeholder="Ej. 300 123 4567"
                      value={customer.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Correo Electrónico *</label>
                    <input
                      id="checkout-email"
                      type="email"
                      name="email"
                      required
                      placeholder="Ej. mateo@email.com"
                      value={customer.email}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Dirección de Residencia *</label>
                    <input
                      id="checkout-address"
                      type="text"
                      name="address"
                      required
                      placeholder="Ej. Calle 10A # 45 - 20 Apto 402"
                      value={customer.address}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Ciudad / Municipio *</label>
                    <input
                      id="checkout-city"
                      type="text"
                      name="city"
                      required
                      placeholder="Ej. Medellín, Antioquia"
                      value={customer.city}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                    />
                  </div>
                </form>
              </div>

              {/* PAYMENT METHOD SELECTOR */}
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 sm:p-8 space-y-6">
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase border-b border-neutral-900 pb-2.5">
                  2. Método de Pago y Finalización
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* WhatsApp Pre-order */}
                  <div
                    id="checkout-pay-whatsapp"
                    onClick={() => setPaymentMethod('whatsapp')}
                    className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between h-32 transition-colors ${paymentMethod === 'whatsapp' ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-500">WhatsApp</span>
                      <input
                        type="radio"
                        checked={paymentMethod === 'whatsapp'}
                        onChange={() => setPaymentMethod('whatsapp')}
                        className="text-amber-500 focus:ring-0"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Cierre por Chat</h4>
                      <p className="text-[9px] text-neutral-500 mt-1 font-sans leading-tight">Envía el pedido estructurado al asesor comercial.</p>
                    </div>
                  </div>

                  {/* Cash on Delivery */}
                  <div
                    id="checkout-pay-cod"
                    onClick={() => setPaymentMethod('cod')}
                    className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between h-32 transition-colors ${paymentMethod === 'cod' ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Contra Entrega</span>
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-amber-500 focus:ring-0"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Pago al Recibir</h4>
                      <p className="text-[9px] text-neutral-500 mt-1 font-sans leading-tight">Cancela en efectivo cuando la transportadora entregue.</p>
                    </div>
                  </div>

                  {/* Simulated Online Card */}
                  <div
                    id="checkout-pay-card"
                    onClick={() => setPaymentMethod('card')}
                    className={`rounded-xl border p-4 cursor-pointer flex flex-col justify-between h-32 transition-colors ${paymentMethod === 'card' ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-900 bg-neutral-950 hover:border-neutral-800'}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Pasarela</span>
                      <input
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="text-amber-500 focus:ring-0"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase">Tarjeta / Transf.</h4>
                      <p className="text-[9px] text-neutral-500 mt-1 font-sans leading-tight">Paga de forma segura en el portal de Bold.</p>
                    </div>
                  </div>

                </div>

                {/* CALL TO ACTION ACCORDING TO PAYMENT METHOD */}
                <div className="pt-4 border-t border-neutral-900">
                  {activeCoupon && paymentMethod === 'card' && (
                    <p className="mb-3 text-[10px] text-amber-300">
                      Los cupones no se aplican al pago con Bold. El total se calcula con el precio vigente en Supabase.
                    </p>
                  )}
                  {paymentError && (
                    <p className="mb-3 rounded-lg border border-red-900 bg-red-950/30 p-3 text-xs text-red-300">
                      {paymentError}
                    </p>
                  )}
                  {paymentMethod === 'whatsapp' ? (
                    <button
                      id="checkout-wa-submit-btn"
                      onClick={handleWhatsAppCheckout}
                      className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-neutral-950 font-extrabold text-xs py-4 px-6 tracking-widest transition-all uppercase flex items-center justify-center space-x-2"
                    >
                      <span>CONVENIR COMPRA POR WHATSAPP</span>
                    </button>
                  ) : paymentMethod === 'card' ? (
                    <button
                      id="checkout-bold-submit-btn"
                      type="button"
                      onClick={handleBoldPayment}
                      disabled={isCreatingPayment}
                      className="w-full rounded-full bg-white hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60 text-neutral-950 font-extrabold text-xs py-4 px-6 tracking-widest transition-all uppercase"
                    >
                      {isCreatingPayment ? 'CONECTANDO CON BOLD...' : 'PAGAR CON BOLD'}
                    </button>
                  ) : (
                    <button
                      id="checkout-traditional-submit-btn"
                      onClick={() => document.querySelector<HTMLFormElement>('#checkout-customer-form')?.requestSubmit()}
                      disabled={isCreatingPayment}
                      className="w-full rounded-full bg-white hover:bg-neutral-200 disabled:cursor-wait disabled:opacity-60 text-neutral-950 font-extrabold text-xs py-4 px-6 tracking-widest transition-all uppercase"
                    >
                      {isCreatingPayment ? 'REGISTRANDO PEDIDO...' : 'COMPLETAR PEDIDO CONTRA ENTREGA'}
                    </button>
                  )}

                  <div className="pt-4 text-center">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">Medios de pago</p>
                    <LogoRow items={PAYMENT_LOGOS} fit={{ area: 900, maxWidth: 64, maxHeight: 24 }} className="mt-3 gap-x-5" />
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT: ORDER SUMMARY (5 columns) */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-6">
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase border-b border-neutral-900 pb-2.5">
                  Resumen del Pedido
                </h3>

                {/* Items loop list */}
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {cart.map(item => {
                    const discountedUnit = finalUnitPrice(item.product.basePrice, item.product.discount);
                    return (
                      <div id={`checkout-summary-item-${item.id}`} key={item.id} className="flex items-center space-x-3 text-xs">
                        <img 
                          src={item.product.images[0]} 
                          alt="" 
                          className="h-12 w-12 rounded-lg bg-neutral-900 object-contain p-1" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 overflow-hidden">
                          <h4 className="truncate font-bold text-white">{item.product.name}</h4>
                          <p className="text-[10px] text-neutral-500 font-sans">
                            EU {item.selectedSize} | {item.selectedColor.name}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-sans mt-0.5">
                            Cant: {item.quantity} × {formatPrice(discountedUnit)}
                          </p>
                        </div>
                        <span className="font-sans font-bold text-white">
                          {formatPrice(discountedUnit * item.quantity)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing summary totals */}
                <div className="border-t border-neutral-900 pt-4 space-y-2.5 text-xs font-sans">
                  <div className="flex justify-between text-neutral-500">
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
                  {activeCoupon && (
                    <div className="flex justify-between text-[10px] text-emerald-500 font-sans font-medium">
                      <span>Cupón ({activeCoupon.code})</span>
                      <span>Habilitado</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-white font-black border-t border-neutral-900 pt-3">
                    <span>VALOR TOTAL</span>
                    <span className="text-amber-500 font-extrabold text-base">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Safe buy seals */}
                <div className="border-t border-neutral-900 pt-4 space-y-3">
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-neutral-400 uppercase">
                    <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0" />
                    <span>Transacción Encriptada 256 bits</span>
                  </div>
                  <div className="flex items-center space-x-3 text-[10px] font-mono text-neutral-400 uppercase">
                    <Truck className="h-5 w-5 text-amber-500 shrink-0" />
                    <span>Envío gratis en pares desde $180.000</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
