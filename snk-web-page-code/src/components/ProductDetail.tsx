import React, { useEffect, useRef, useState } from 'react';
import { finalUnitPrice, hasFreeShipping } from '../lib/price';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft, ShoppingBag, Star, ShieldCheck, Truck, Headset, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Check, Share2, Heart, Lock, Banknote
} from 'lucide-react';
import { ZoomableImage } from './ZoomableImage';

interface ProductDetailProps {
  productId: string;
}

type Question = 'size' | 'color' | 'qty';

const TRUST = [
  { icon: ShieldCheck, title: 'Calidad premium', text: 'Alta gama, revisados uno a uno' },
  { icon: Truck, title: 'Envío gratis', text: 'A todo Colombia, 1 a 3 días' },
  { icon: Headset, title: 'Soporte VIP', text: 'Asesoría por WhatsApp' }
];

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const { products, brands, addToCart, formatPrice, navigateTo, toggleFavorite, isFavorite } = useApp();
  const product = products.find(p => p.id === productId);

  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState(product?.colors[0]);
  const [quantity, setQuantity] = useState(1);
  const [openQuestion, setOpenQuestion] = useState<Question | null>('size');
  const [needsSize, setNeedsSize] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [shared, setShared] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const buyRef = useRef<HTMLDivElement>(null);
  const [buyVisible, setBuyVisible] = useState(true);

  // Barra fija de compra en celular cuando el botón principal sale de la pantalla.
  useEffect(() => {
    const el = buyRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setBuyVisible(e.isIntersecting || e.boundingClientRect.top > window.innerHeight));
    io.observe(el);
    return () => io.disconnect();
  }, [productId]);

  // Al cambiar de producto se reinicia todo.
  useEffect(() => {
    setActiveImgIdx(0);
    setSelectedSize(null);
    setSelectedColor(product?.colors[0]);
    setQuantity(1);
    setOpenQuestion('size');
    setZoomed(false);
    galleryRef.current?.scrollTo({ left: 0 });
  }, [productId]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-bold uppercase text-white">Calzado no encontrado</h3>
        <p className="mt-2 text-sm text-neutral-500">La referencia especificada no existe en el catálogo.</p>
        <button
          onClick={() => navigateTo({ type: 'catalog' })}
          className="glow-button mt-6 rounded-full px-6 py-2.5 text-xs font-bold uppercase"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  const images = product.images.length ? product.images : [''];
  const color = selectedColor ?? product.colors[0] ?? { name: 'Único', hex: '#111111' };
  const finalPrice = finalUnitPrice(product.basePrice, product.discount);
  const brandName = brands.find(b => b.id === product.brandId)?.name ?? product.brandId;

  // Galería deslizable: el índice activo sale de la posición del scroll.
  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeImgIdx) {
      setActiveImgIdx(idx);
      setZoomed(false);
    }
  };
  const goToImage = (idx: number) => {
    const el = galleryRef.current;
    if (!el) return;
    const next = (idx + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setActiveImgIdx(next);
    setZoomed(false);
  };

  const requireSize = () => {
    if (selectedSize) return true;
    setOpenQuestion('size');
    document.getElementById('product-steps')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setNeedsSize(true);
    setTimeout(() => setNeedsSize(false), 600);
    return false;
  };

  const handleAddToCart = () => {
    if (!requireSize() || !selectedSize) return;
    addToCart(product, selectedSize, color, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!requireSize() || !selectedSize) return;
    addToCart(product, selectedSize, color, quantity);
    navigateTo({ type: 'checkout' });
  };

  const handleWhatsAppBuy = () => {
    const text =
      `Hola Sneakers Collection! 👋 Me interesa esta referencia:\n\n*Referencia:* ${product.name}\n` +
      `*Talla:* ${selectedSize ? `EU ${selectedSize}` : 'por definir'}\n*Color:* ${color.name}\n` +
      `*Pares:* ${quantity}\n*Precio:* ${formatPrice(finalPrice)}\n\n¿Tienen disponibilidad?`;
    window.open(`https://wa.me/573208646516?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      /* el cliente canceló */
    }
  };

  const toggle = (q: Question) => setOpenQuestion(prev => (prev === q ? null : q));

  // Se llama como función (no como componente) para que no se vuelva a montar en cada cambio.
  const renderQuestion = (id: Question, question: string, answer: string | null, children: React.ReactNode) => {
    const open = openQuestion === id;
    const step = ({ size: 1, color: 2, qty: 3 } as const)[id];
    const done = id === 'size' ? !!selectedSize : true;
    return (
      <div
        key={id}
        className={`rounded-2xl border transition-colors duration-300 ${open ? 'border-red-600/60 bg-red-950/10 shadow-[0_0_24px_rgba(209,10,31,0.18)]' : 'border-neutral-900 hover:border-neutral-700'} ${id === 'size' && needsSize ? 'nudge border-red-500' : ''}`}
      >
        <button type="button" onClick={() => toggle(id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <span className="flex items-center gap-3">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors ${done ? 'bg-red-600 text-white' : 'border border-red-600 text-red-500'}`}>
              {done ? <Check className="h-3.5 w-3.5" /> : step}
            </span>
            <span className="text-sm font-bold text-white sm:text-base">{question}</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            {answer ? (
              <span className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold uppercase text-white">
                <Check className="h-3 w-3" />
                {answer}
              </span>
            ) : (
              <span className="text-[11px] uppercase tracking-widest text-red-500">Elegir</span>
            )}
            <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform duration-300 ${open ? 'rotate-180 text-white' : ''}`} />
          </span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-5">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const recommendations = products
    .filter(p => p.id !== product.id && (p.brandId === product.brandId || p.isTrending))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigateTo({ type: 'catalog' })}
          className="group mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver al catálogo
        </button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          {/* GALERÍA: se desliza con el dedo */}
          <div className="flex flex-col lg:col-span-6">
            <div className="relative">
              {/* brillo rojo detrás del tenis */}
              <div className="pointer-events-none absolute inset-x-16 top-1/2 h-1/2 -translate-y-1/2 rounded-full bg-white/[0.07] blur-3xl" />
              <div
                ref={galleryRef}
                onScroll={onGalleryScroll}
                className={`no-scrollbar relative flex aspect-square w-full snap-x snap-mandatory ${zoomed ? 'overflow-x-hidden' : 'overflow-x-auto'}`}
              >
                {images.map((img, idx) => (
                  <div key={idx} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-2 sm:p-6">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="flex h-full w-full items-center justify-center"
                    >
                      <ZoomableImage
                        src={img}
                        alt={`${product.name} ${idx + 1}`}
                        zoomed={zoomed && idx === activeImgIdx}
                        onZoomChange={setZoomed}
                        className="drop-shadow-[0_30px_35px_rgba(0,0,0,0.65)]"
                      />
                    </motion.div>
                  </div>
                ))}
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.8 }}
                onClick={() => toggleFavorite(product.id)}
                aria-label={isFavorite(product.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                className="absolute right-2 top-2 z-10 rounded-full border border-neutral-800 bg-black/60 p-3 backdrop-blur transition-colors hover:border-red-600"
              >
                <Heart className={`h-5 w-5 transition-colors ${isFavorite(product.id) ? 'fill-red-600 text-red-600' : 'text-white'}`} />
              </motion.button>
              {/* sombra de piso */}
              <div className="pointer-events-none mx-auto -mt-6 h-4 w-2/3 rounded-[100%] bg-black/70 blur-md" />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() => goToImage(activeImgIdx - 1)}
                    className="absolute left-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-neutral-800 bg-black/60 p-2.5 text-white backdrop-blur transition hover:border-red-600 hover:shadow-[0_0_18px_rgba(209,10,31,0.5)] sm:block"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => goToImage(activeImgIdx + 1)}
                    className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded-full border border-neutral-800 bg-black/60 p-2.5 text-white backdrop-blur transition hover:border-red-600 hover:shadow-[0_0_18px_rgba(209,10,31,0.5)] sm:block"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="mt-4 flex justify-center gap-2">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Ver imagen ${idx + 1}`}
                        onClick={() => goToImage(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeImgIdx === idx ? 'w-7 bg-red-600 shadow-[0_0_10px_rgba(209,10,31,0.8)]' : 'w-1.5 bg-neutral-700'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="no-scrollbar mt-5 flex gap-3 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => goToImage(idx)}
                    className={`aspect-square w-16 shrink-0 overflow-hidden rounded-xl border p-1.5 transition-all duration-300 sm:w-20 ${activeImgIdx === idx ? 'border-neutral-900 opacity-100' : 'border-neutral-900 opacity-40 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Sellos de confianza: solo íconos con anillo animado */}
            <div className="mt-10 grid grid-cols-3 gap-2">
              {TRUST.map(({ icon: Icon, title, text }, i) => (title === 'Envío gratis' && !hasFreeShipping(finalPrice) ? { icon: Icon, title: 'Envío nacional', text: 'A todo Colombia, 1 a 3 días' } : { icon: Icon, title, text })).map(({ icon: Icon, title, text }, i) => (
                <motion.div
                  key={title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="trust-badge flex flex-col items-center text-center"
                >
                  <span className="trust-ring">
                    <Icon className="h-6 w-6" strokeWidth={1.6} />
                  </span>
                  <h5 className="mt-3 text-[11px] font-black uppercase tracking-wider text-white sm:text-xs">{title}</h5>
                  <p className="mt-1 text-[10px] text-neutral-500 sm:text-[11px]">{text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* COMPRA */}
          <div className="flex flex-col lg:col-span-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <p className="red-glow-label text-[11px] font-bold uppercase tracking-[0.3em]">{brandName}</p>
              <h1 className="mt-2 text-3xl font-black uppercase leading-[1.05] tracking-tight sm:text-4xl">{product.name}</h1>
              <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-wider text-neutral-500">
                {product.sku && <span>Ref. {product.sku}</span>}
                {product.rating > 0 && (
                  <span className="flex items-center gap-1 border-l border-neutral-800 pl-4 font-bold text-white">
                    <Star className="h-3.5 w-3.5 fill-red-600 text-red-600" />
                    {product.rating.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-black tracking-tight text-white drop-shadow-[0_0_18px_rgba(209,10,31,0.45)] sm:text-5xl">
                  {formatPrice(finalPrice * quantity)}
                </span>
                {product.discount > 0 && (
                  <>
                    <span className="pb-1 text-base text-neutral-500 line-through">{formatPrice(product.basePrice * quantity)}</span>
                    <span className="mb-1.5 rounded-full bg-red-600 px-2.5 py-0.5 text-[11px] font-black uppercase text-white">-{product.discount}%</span>
                  </>
                )}
              </div>
              {quantity > 1 && <p className="mt-1 text-xs text-neutral-500">{quantity} pares · {formatPrice(finalPrice)} c/u</p>}
              {hasFreeShipping(finalPrice) && <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-600/50 bg-red-600/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white">
                <Truck className="h-3.5 w-3.5 text-red-500" />
                Envío gratis a todo Colombia
              </p>}
            </motion.div>

            {/* 3 preguntas */}
            <div id="product-steps" className="mt-8 space-y-3">
              {renderQuestion('size', '¿Qué talla los quieres?', selectedSize ? `EU ${selectedSize}` : null, <>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setOpenQuestion(product.colors.length > 1 ? 'color' : 'qty');
                      }}
                      className={`rounded-xl border py-3 text-sm font-bold transition-all duration-200 active:scale-95 ${selectedSize === size ? 'border-red-600 bg-red-600 text-white shadow-[0_0_16px_rgba(209,10,31,0.6)]' : 'border-neutral-800 text-neutral-300 hover:border-red-600/60 hover:text-white'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-neutral-500">Tallas europeas (EU). ¿Dudas con tu talla? Escríbenos por WhatsApp.</p>
              </>)}

              {renderQuestion('color', '¿De qué color?', color.name, <>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map(c => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(c);
                        setOpenQuestion('qty');
                      }}
                      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all ${color.name === c.name ? 'border-red-600 text-white shadow-[0_0_14px_rgba(209,10,31,0.45)]' : 'border-neutral-800 text-neutral-400 hover:text-white'}`}
                    >
                      <span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: c.hex }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </>)}

              {renderQuestion('qty', '¿Cuántos pares?', `${quantity}`, <>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    aria-label="Menos"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="rounded-full border border-neutral-800 p-3 transition hover:border-red-600 active:scale-90"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-2xl font-black">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Más"
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    className="rounded-full border border-neutral-800 p-3 transition hover:border-red-600 active:scale-90"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-[11px] text-neutral-500">¿Más de 6 pares? Pregunta por precio mayorista.</span>
                </div>
              </>)}
            </div>

            {/* Acciones: el botón de comprar guía al cliente */}
            <div ref={buyRef} className="mt-6 space-y-3">
              <p className={`text-center text-xs font-bold ${selectedSize ? 'text-neutral-300' : 'text-red-500'}`}>
                {selectedSize
                  ? `Listo: talla EU ${selectedSize}, ${color.name}, ${quantity} ${quantity === 1 ? 'par' : 'pares'}`
                  : 'Elige tu talla en el paso 1 para continuar'}
              </p>
              <button
                type="button"
                onClick={handleBuyNow}
                className="buy-cta group relative w-full overflow-hidden rounded-full px-6 py-4 text-white active:scale-[0.98]"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <span className="text-base font-black uppercase tracking-wider">
                    {selectedSize ? 'Comprar ahora' : 'Elegir talla y comprar'}
                  </span>
                </span>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-red-500" />Pago seguro con Bold</span>
                <span className="flex items-center gap-1.5"><Banknote className="h-3.5 w-3.5 text-red-500" />Contra entrega</span>
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-red-500" />Llega en 1 a 3 días</span>
              </div>

              <div className="grid grid-cols-[1fr_1fr_auto] gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex h-14 items-center justify-center gap-2 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${isAdded ? 'border-white bg-white text-neutral-950' : 'border-red-600/70 text-red-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_18px_rgba(209,10,31,0.5)]'}`}
                >
                  {isAdded ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                  {isAdded ? 'Agregado' : 'Al carrito'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppBuy}
                  className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-emerald-600/70 bg-emerald-600/10 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-emerald-600/20 hover:shadow-[0_0_18px_rgba(16,185,129,0.45)] active:scale-95"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#25D366]">
                    <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24" aria-hidden>
                      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.04 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.44 9.42z"/>
                    </svg>
                  </span>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={shared ? 'Link copiado' : 'Compartir'}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 text-neutral-300 transition-all hover:border-red-600 hover:text-white active:scale-95"
                >
                  {shared ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sobre este par */}
            {(product.history || product.description || product.technologies.length > 0 || product.materials.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
                className="mt-12 border-t border-neutral-900 pt-10"
              >
                <p className="red-glow-label text-[11px] font-bold uppercase tracking-[0.3em]">Sobre este par</p>
                {(product.history || product.description) && (
                  <p className="mt-4 border-l-2 border-red-600 pl-5 text-base leading-relaxed text-neutral-200 sm:text-lg">
                    {product.history || product.description}
                  </p>
                )}

                <div className="mt-8 grid gap-8 sm:grid-cols-2">
                  {product.technologies.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Tecnología</h3>
                      <ul className="mt-3 space-y-2">
                        {product.technologies.map(tech => (
                          <li key={tech} className="flex items-center gap-3 text-sm text-neutral-400">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600 shadow-[0_0_8px_rgba(209,10,31,0.9)]" />
                            {tech}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {product.materials.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">Materiales</h3>
                      <ul className="mt-3 space-y-2">
                        {product.materials.map(mat => (
                          <li key={mat} className="flex items-center gap-3 text-sm text-neutral-400">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600 shadow-[0_0_8px_rgba(209,10,31,0.9)]" />
                            {mat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {recommendations.length > 0 && (
          <section className="mt-20 border-t border-neutral-900 pt-12">
            <p className="red-glow-label text-[11px] font-bold uppercase tracking-[0.3em]">Sigue explorando</p>
            <h3 className="luxury-title mt-2 text-2xl font-black uppercase tracking-[-0.04em] sm:text-3xl">Te podría interesar</h3>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {recommendations.map((prod, i) => (
                <motion.button
                  key={prod.id}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.08 }}
                  onClick={() => {
                    navigateTo({ type: 'product', productId: prod.id });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group glow-card flex flex-col rounded-2xl border border-neutral-900 p-3 text-left"
                >
                  <div className="flex aspect-square items-center justify-center overflow-hidden p-2">
                    <img
                      src={prod.images[0]}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full object-contain transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                    />
                  </div>
                  <h4 className="mt-2 truncate text-xs font-bold uppercase text-white">{prod.name}</h4>
                  <span className="mt-1 text-xs font-bold text-neutral-300">{formatPrice(finalUnitPrice(prod.basePrice, prod.discount))}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>
      {/* Barra fija de compra (celular), aparece cuando el botón principal ya no se ve */}
      <AnimatePresence>
        {!buyVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-red-600/40 bg-black/90 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur lg:hidden"
          >
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] uppercase text-neutral-400">{product.name}</p>
                <p className="text-lg font-black">{formatPrice(finalPrice * quantity)}</p>
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                className="buy-cta relative overflow-hidden rounded-full px-6 py-3 text-sm font-black uppercase tracking-wider text-white active:scale-95"
              >
                {selectedSize ? 'Comprar' : 'Elegir talla'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
