import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft, ShoppingBag, Star, ShieldCheck, Truck, Headset, AlertCircle,
  ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Check, Share2, Heart
} from 'lucide-react';

interface ProductDetailProps {
  productId: string;
}

type Question = 'size' | 'color' | 'qty';

const TRUST = [
  { icon: ShieldCheck, title: '100% Original', text: 'Pares verificados' },
  { icon: Truck, title: 'Envío exprés', text: '1 a 3 días hábiles' },
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
  const galleryRef = useRef<HTMLDivElement>(null);

  // Al cambiar de producto se reinicia todo.
  useEffect(() => {
    setActiveImgIdx(0);
    setSelectedSize(null);
    setSelectedColor(product?.colors[0]);
    setQuantity(1);
    setOpenQuestion('size');
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
  const finalPrice = product.basePrice * (1 - product.discount / 100);
  const brandName = brands.find(b => b.id === product.brandId)?.name ?? product.brandId;

  // Galería deslizable: el índice activo sale de la posición del scroll.
  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeImgIdx) setActiveImgIdx(idx);
  };
  const goToImage = (idx: number) => {
    const el = galleryRef.current;
    if (!el) return;
    const next = (idx + images.length) % images.length;
    el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' });
    setActiveImgIdx(next);
  };

  const requireSize = () => {
    if (selectedSize) return true;
    setOpenQuestion('size');
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
    return (
      <div
        key={id}
        className={`rounded-2xl border transition-colors duration-300 ${open ? 'border-red-600/60 bg-red-950/10 shadow-[0_0_24px_rgba(209,10,31,0.18)]' : 'border-neutral-900 hover:border-neutral-700'} ${id === 'size' && needsSize ? 'nudge border-red-500' : ''}`}
      >
        <button type="button" onClick={() => toggle(id)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
          <span className="text-sm font-bold text-white sm:text-base">{question}</span>
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
              <div className="pointer-events-none absolute inset-x-10 top-1/2 h-1/2 -translate-y-1/2 rounded-full bg-red-700/25 blur-3xl" />
              <div
                ref={galleryRef}
                onScroll={onGalleryScroll}
                className="no-scrollbar relative flex aspect-square w-full snap-x snap-mandatory overflow-x-auto"
              >
                {images.map((img, idx) => (
                  <div key={idx} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-2 sm:p-6">
                    <motion.img
                      src={img}
                      alt={`${product.name} ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      draggable={false}
                      initial={{ opacity: 0, scale: 0.92, rotate: -4 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="max-h-full max-w-full select-none object-contain drop-shadow-[0_30px_35px_rgba(0,0,0,0.65)]"
                    />
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
                    className={`aspect-square w-16 shrink-0 overflow-hidden rounded-xl border p-1.5 transition-all duration-300 sm:w-20 ${activeImgIdx === idx ? 'border-red-600' : 'border-neutral-900 opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}

            {/* Sellos de confianza: solo íconos con anillo animado */}
            <div className="mt-10 grid grid-cols-3 gap-2">
              {TRUST.map(({ icon: Icon, title, text }, i) => (
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
            </motion.div>

            {/* 3 preguntas */}
            <div className="mt-8 space-y-3">
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

            {/* Acciones: comprar arriba y tres botones iguales abajo */}
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleBuyNow}
                className="glow-outline-button w-full rounded-full px-6 py-4 text-sm font-black uppercase tracking-widest active:scale-[0.98]"
              >
                Comprar ahora
              </button>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${isAdded ? 'border-white bg-white text-neutral-950' : 'red-glow-hover border-neutral-800 text-white'}`}
                >
                  {isAdded ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                  {isAdded ? 'Agregado' : 'Carrito'}
                </button>
                <button
                  type="button"
                  onClick={handleWhatsAppBuy}
                  className="flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-600/70 bg-emerald-600/10 text-[10px] font-black uppercase tracking-wider text-white transition-all hover:bg-emerald-600/20 hover:shadow-[0_0_18px_rgba(16,185,129,0.45)] active:scale-95"
                >
                  <span className="flex h-5 w-5 items-center justify-center">
                  <svg className="h-[17px] w-[17px] fill-emerald-400" viewBox="0 0 24 24" aria-hidden>
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.012 14.114.992 11.537.992c-5.451 0-9.875 4.372-9.88 9.802-.002 1.77.475 3.497 1.38 5.018l-.993 3.623 3.755-.98c1.472.8 3.111 1.222 4.808 1.222zm11.303-7.84c-.33-.162-1.953-.949-2.251-1.057-.298-.108-.517-.162-.734.162-.218.324-.844 1.057-1.036 1.272-.192.215-.384.243-.715.082-.33-.162-1.393-.506-2.656-1.615-.983-.865-1.647-1.933-1.84-2.257-.193-.324-.02-.501.144-.661.15-.143.33-.385.496-.577.165-.192.22-.324.33-.54.11-.217.056-.407-.028-.57-.085-.162-.735-1.745-1.007-2.39-.265-.63-.535-.544-.734-.554-.19-.01-.407-.01-.624-.01s-.57.081-.869.407c-.298.324-1.141 1.099-1.141 2.68s1.171 3.115 1.332 3.333c.163.217 2.305 3.468 5.586 4.847.78.328 1.389.524 1.864.673.784.245 1.498.21 2.062.127.629-.093 1.953-.787 2.229-1.547.276-.759.276-1.41.194-1.547-.082-.136-.298-.218-.628-.38z" />
                  </svg>
                  </span>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="red-glow-hover flex h-16 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-800 text-[10px] font-black uppercase tracking-wider text-white transition-all active:scale-95"
                >
                  {shared ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                  {shared ? 'Copiado' : 'Compartir'}
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
                  <span className="mt-1 text-xs font-bold text-neutral-300">{formatPrice(prod.basePrice * (1 - prod.discount / 100))}</span>
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
