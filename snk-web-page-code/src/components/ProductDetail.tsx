import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { 
  ArrowLeft, Heart, ShoppingBag, Send, Star, Shield, 
  Award, Truck, Sparkles, AlertCircle, Plus, MessageSquare 
} from 'lucide-react';

interface ProductDetailProps {
  productId: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ productId }) => {
  const { 
    products, 
    reviews, 
    addToCart, 
    toggleFavorite, 
    isFavorite, 
    toggleCompare, 
    compareProductIds, 
    formatPrice, 
    navigateTo,
    addReview,
    currency,
    setCurrency
  } = useApp();

  const product = products.find(p => p.id === productId);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h3 className="mt-4 text-lg font-bold text-white uppercase">Calzado no encontrado</h3>
        <p className="mt-2 text-sm text-neutral-500">La referencia especificada no existe en el catálogo.</p>
        <button
          id="detail-back-catalog-err"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="mt-6 rounded-full bg-amber-500 px-6 py-2.5 text-xs font-bold text-neutral-950"
        >
          Volver al catálogo
        </button>
      </div>
    );
  }

  // Gallery and 360 simulator states
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSize, setSelectedSize] = useState<number | null>(product.sizes[2] || product.sizes[0] || null);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);

  // Review states
  const [newComment, setNewComment] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newName, setNewName] = useState('');
  const [showReviewSuccess, setShowReviewSuccess] = useState(false);

  // Cart animation state
  const [isAdded, setIsAdded] = useState(false);

  const productReviews = reviews.filter(r => r.productId === product.id);
  const finalPrice = product.basePrice * (1 - product.discount / 100);
  const isFav = isFavorite(product.id);
  const isCompared = compareProductIds.includes(product.id);

  // Handle manual 360-degree spin button
  const handleSpin360 = () => {
    setIsSpinning(true);
    let current = activeImgIdx;
    const interval = setInterval(() => {
      current = (current + 1) % product.images.length;
      setActiveImgIdx(current);
    }, 150);

    setTimeout(() => {
      clearInterval(interval);
      setIsSpinning(false);
    }, 150 * product.images.length * 2);
  };

  const handleAddToCart = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, selectedColor);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize) return;
    addToCart(product, selectedSize, selectedColor);
    navigateTo({ type: 'checkout' });
  };

  // WhatsApp Purchase pre-filled order builder
  const handleWhatsAppBuy = () => {
    if (!selectedSize) return;
    const currencySym = formatPrice(finalPrice);
    const text = `Hola Sneakers Collection! 👋 Estoy interesado en comprar una referencia desde el sitio web:\n\n*Referencia:* ${product.name}\n*SKU:* ${product.sku}\n*Talla:* US ${selectedSize}\n*Color:* ${selectedColor.name}\n*Precio:* ${currencySym}\n\n¿Tienen disponibilidad para envío inmediato? ¡Muchas gracias!`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/573000000000?text=${encodedText}`, '_blank');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newComment.trim()) return;

    addReview(product.id, newName, newRating, newComment);
    setNewName('');
    setNewComment('');
    setNewRating(5);
    setShowReviewSuccess(true);
    setTimeout(() => setShowReviewSuccess(false), 3000);
  };

  // Get other brand products as recommendations
  const recommendations = products
    .filter(p => p.brandId === product.brandId && p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="bg-transparent text-white min-h-screen">
      
      {/* Detail Layout Wrapper */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Back and Breadcrumbs */}
        <button
          id="detail-back-nav"
          onClick={() => navigateTo({ type: 'catalog' })}
          className="flex items-center space-x-2 text-xs font-mono tracking-wider text-neutral-400 hover:text-white transition-colors uppercase mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Volver al catálogo</span>
        </button>

        {/* Primary Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* LEFT: GALLERY & 360 VIEWER STAGE (5 columns) */}
          <div className="lg:col-span-6 flex flex-col space-y-4">
            
            {/* Main Stage Image display */}
            <div className="relative aspect-square w-full rounded-2xl bg-neutral-900/50 p-6 flex items-center justify-center border border-neutral-900 overflow-hidden">
              <img
                id="detail-main-img"
                src={product.images[activeImgIdx]}
                alt={product.name}
                referrerPolicy="no-referrer"
                className={`max-h-[350px] sm:max-h-[420px] object-contain drop-shadow-[0_20px_40px_rgba(255,255,255,0.03)] transition-transform duration-500 ${isSpinning ? 'scale-105 rotate-3' : 'hover:scale-105'}`}
              />
              
              {/* Spinning 360 indicator */}
              <button
                id="detail-spin-360-btn"
                onClick={handleSpin360}
                disabled={isSpinning}
                className="absolute bottom-4 right-4 flex items-center space-x-1.5 rounded-full border border-neutral-800 bg-neutral-950/80 px-4 py-2 text-[10px] font-mono tracking-widest text-neutral-300 hover:border-neutral-700 hover:text-white backdrop-blur-md disabled:opacity-50"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isSpinning ? 'animate-spin text-amber-500' : ''}`} />
                <span>{isSpinning ? 'GIRANDO...' : 'VISTA 360°'}</span>
              </button>
            </div>

            {/* Thumbnail Carousel Selector */}
            <div className="flex space-x-3 overflow-x-auto py-1">
              {product.images.map((img, idx) => (
                <button
                  id={`detail-thumb-${idx}`}
                  key={idx}
                  onClick={() => setActiveImgIdx(idx)}
                  className={`relative aspect-square w-20 shrink-0 rounded-xl bg-neutral-900/50 p-2 border overflow-hidden transition-all ${activeImgIdx === idx ? 'border-amber-500' : 'border-neutral-900 hover:border-neutral-800'}`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>

            {/* Quality & Authenticity Trust Badges */}
            <div className="grid grid-cols-3 gap-3 border-t border-neutral-900 pt-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-neutral-900/10 border border-neutral-900">
                <Shield className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="text-[10px] font-bold uppercase tracking-wider">100% Original</h5>
                <p className="text-[8px] text-neutral-500 mt-1 font-mono">Garantizado por certificado</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-neutral-900/10 border border-neutral-900">
                <Truck className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="text-[10px] font-bold uppercase tracking-wider">Envío Exprés</h5>
                <p className="text-[8px] text-neutral-500 mt-1 font-mono">Nacional Asegurado</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-neutral-900/10 border border-neutral-900">
                <Award className="h-5 w-5 text-amber-500 mb-2" />
                <h5 className="text-[10px] font-bold uppercase tracking-wider">Soporte VIP</h5>
                <p className="text-[8px] text-neutral-500 mt-1 font-mono">Asesoría directa 24/7</p>
              </div>
            </div>

          </div>

          {/* RIGHT: BUYING TRIGGERS & STORIES (6 columns) */}
          <div className="lg:col-span-6 flex flex-col justify-start">
            
            {/* Header Product Info */}
            <div className="border-b border-neutral-900 pb-5">
              <span className="text-xs font-mono tracking-widest text-amber-500 uppercase font-semibold">
                {product.brandId}
              </span>
              <h2 className="mt-1 font-sans text-2xl sm:text-3xl font-extrabold tracking-tight">
                {product.name}
              </h2>
              <div className="mt-2.5 flex items-center space-x-4">
                {/* SKU Code */}
                <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                  SKU: {product.sku}
                </span>
                
                {/* Rating summary */}
                <div className="flex items-center space-x-1 border-l border-neutral-800 pl-4">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                  <span className="text-xs font-mono font-bold text-white">{product.rating}</span>
                  <span className="text-xs text-neutral-500 font-mono">({productReviews.length} reseñas)</span>
                </div>
              </div>
            </div>

            {/* STICKY ACCIONES / BUYING BOX */}
            <div className="py-6 border-b border-neutral-900 space-y-6">
              
              {/* Pricing & Inline Currency Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-baseline space-x-4">
                  <span className="text-3xl sm:text-4xl font-sans font-black text-white tracking-tight">
                    {formatPrice(finalPrice)}
                  </span>
                  {product.discount > 0 && (
                    <>
                      <span className="text-base font-sans text-neutral-500 line-through">
                        {formatPrice(product.basePrice)}
                      </span>
                      <span className="rounded bg-red-600/25 px-2.5 py-0.5 text-xs font-bold text-red-500 uppercase tracking-wider font-sans">
                        -{product.discount}% OFF
                      </span>
                    </>
                  )}
                </div>

                {/* Localized Inline Currency Switcher right next to price */}
                <div className="flex items-center space-x-1 rounded-full bg-neutral-900 border border-neutral-850 p-1">
                  <span className="text-[9px] font-sans font-extrabold text-neutral-500 px-2 uppercase">DIVISA:</span>
                  {(['COP', 'USD', 'EUR', 'MXN'] as const).map(code => (
                    <button
                      id={`detail-currency-opt-${code}`}
                      key={code}
                      onClick={() => setCurrency(code)}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-sans font-black uppercase transition-all duration-200 ${
                        currency === code 
                          ? 'bg-amber-500 text-neutral-950 shadow' 
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Swatches */}
              <div>
                <h4 className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase mb-2.5">
                  Color Seleccionado: <span className="text-white">{selectedColor.name}</span>
                </h4>
                <div className="flex space-x-3">
                  {product.colors.map((color, idx) => (
                    <button
                      id={`detail-color-${idx}`}
                      key={idx}
                      onClick={() => setSelectedColor(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 ${selectedColor.name === color.name ? 'border-amber-500 scale-105' : 'border-neutral-900'}`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[11px] font-mono tracking-widest text-neutral-400 uppercase">
                    Tallas Disponibles (US)
                  </h4>
                  <span className="text-[10px] font-mono text-neutral-500 underline cursor-pointer">
                    Guía de tallas
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                  {product.sizes.map(size => (
                    <button
                      id={`detail-size-${size}`}
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`rounded-lg border py-2.5 text-xs font-mono tracking-wider font-bold transition-colors ${selectedSize === size ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-900 text-neutral-300 hover:border-neutral-700 hover:text-white'}`}
                    >
                      US {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* ACTION CTAs (Cart & Checkout) */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
                
                {/* Buy Now checkout link */}
                <button
                  id="detail-buy-now-btn"
                  onClick={handleBuyNow}
                  className="flex-1 rounded-full bg-white text-neutral-950 font-bold text-xs py-4 px-6 tracking-widest hover:bg-neutral-200 transition-colors uppercase shadow-lg shadow-white/5"
                >
                  Comprar Ahora
                </button>

                {/* Add to Cart button */}
                <button
                  id="detail-add-cart-btn"
                  onClick={handleAddToCart}
                  className={`flex-1 rounded-full font-bold text-xs py-4 px-6 tracking-widest border transition-all uppercase flex items-center justify-center space-x-2 ${isAdded ? 'bg-amber-500 border-amber-500 text-neutral-950' : 'border-neutral-800 text-white bg-neutral-900/30 hover:border-neutral-700'}`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{isAdded ? 'AGREGADO ✓' : 'AÑADIR AL CARRITO'}</span>
                </button>

              </div>

              {/* Direct WhatsApp Preorder Button */}
              <button
                id="detail-wa-preorder"
                onClick={handleWhatsAppBuy}
                className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-neutral-950 font-extrabold text-xs py-4 px-6 tracking-widest transition-all uppercase flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/10"
              >
                {/* Inline WhatsApp logo replacement SVG */}
                <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.588 2.012 14.114.992 11.537.992c-5.451 0-9.875 4.372-9.88 9.802-.002 1.77.475 3.497 1.38 5.018l-.993 3.623 3.755-.98c1.472.8 3.111 1.222 4.808 1.222zm11.303-7.84c-.33-.162-1.953-.949-2.251-1.057-.298-.108-.517-.162-.734.162-.218.324-.844 1.057-1.036 1.272-.192.215-.384.243-.715.082-.33-.162-1.393-.506-2.656-1.615-.983-.865-1.647-1.933-1.84-2.257-.193-.324-.02-.501.144-.661.15-.143.33-.385.496-.577.165-.192.22-.324.33-.54.11-.217.056-.407-.028-.57-.085-.162-.735-1.745-1.007-2.39-.265-.63-.535-.544-.734-.554-.19-.01-.407-.01-.624-.01s-.57.081-.869.407c-.298.324-1.141 1.099-1.141 2.68s1.171 3.115 1.332 3.333c.163.217 2.305 3.468 5.586 4.847.78.328 1.389.524 1.864.673.784.245 1.498.21 2.062.127.629-.093 1.953-.787 2.229-1.547.276-.759.276-1.41.194-1.547-.082-.136-.298-.218-.628-.38z" />
                </svg>
                <span>CONSULTAR POR WHATSAPP</span>
              </button>

              {/* Compare and share toggles */}
              <div className="flex items-center justify-between border-t border-neutral-950 pt-4 text-xs font-mono text-neutral-400">
                <button
                  id="detail-compare-toggle"
                  onClick={() => toggleCompare(product.id)}
                  className="hover:text-white transition-colors uppercase font-bold flex items-center space-x-1.5"
                >
                  <span>{isCompared ? '✓ QUITAR DE COMPARACIÓN' : '+ AGREGAR A COMPARAR'}</span>
                </button>
                <button
                  id="detail-share-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('¡Enlace del calzado copiado al portapapeles!');
                  }}
                  className="hover:text-white transition-colors uppercase font-bold"
                >
                  COMPARTIR
                </button>
              </div>

            </div>

            {/* PRODUCT STORIES & MATERIALS (Accordion style, but flat/editorial for impact) */}
            <div className="py-6 space-y-6">
              
              {/* Editorial / Story paragraph */}
              <div>
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase mb-3">
                  La Historia Detrás del Diseño
                </h3>
                <p className="text-sm text-neutral-300 font-sans leading-relaxed">
                  {product.history}
                </p>
              </div>

              {/* Technologies */}
              <div>
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase mb-3">
                  Tecnologías Incorporadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.technologies.map((tech, idx) => (
                    <span
                      id={`detail-tech-${idx}`}
                      key={idx}
                      className="rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 text-[10px] font-mono text-neutral-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Materials */}
              <div>
                <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase mb-3">
                  Materiales Premium
                </h3>
                <ul className="list-disc pl-5 text-xs text-neutral-400 font-sans space-y-1.5">
                  {product.materials.map((mat, idx) => (
                    <li key={idx}>{mat}</li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>

        {/* REVIEW CENTER SECTION */}
        <section className="mt-16 border-t border-neutral-900 pt-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left: Star Breakdown and list (7 columns) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-sans text-lg font-bold uppercase text-white">Opiniones de la Comunidad</h3>
                  <p className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">Testimonios verificados de compradores reales</p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                {productReviews.length > 0 ? (
                  productReviews.map(review => (
                    <div
                      id={`review-item-${review.id}`}
                      key={review.id}
                      className="rounded-xl border border-neutral-900 bg-neutral-900/10 p-5 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="h-7 w-7 rounded-full bg-neutral-800 flex items-center justify-center text-[10px] font-bold font-mono">
                            {review.customerName.charAt(0)}
                          </div>
                          <span className="text-xs font-bold">{review.customerName}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono">{review.createdAt}</span>
                      </div>
                      <div className="flex items-center space-x-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < review.rating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-500 font-sans">Aún no hay reseñas para este modelo. ¡Sé el primero en dejar tu opinión!</p>
                )}
              </div>
            </div>

            {/* Right: Add Review form (5 columns) */}
            <div className="lg:col-span-5 rounded-2xl border border-neutral-900 bg-neutral-950 p-6 self-start space-y-4">
              <h4 className="text-xs font-mono tracking-widest text-amber-400 uppercase">Escribir una reseña</h4>
              
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Nombre Completo</label>
                  <input
                    id="review-name-input"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Puntuación</label>
                  <div className="flex space-x-1.5">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const starVal = i + 1;
                      return (
                        <button
                          id={`review-form-star-${starVal}`}
                          key={i}
                          type="button"
                          onClick={() => setNewRating(starVal)}
                          className="text-neutral-500 hover:scale-110 transition-transform"
                        >
                          <Star className={`h-5 w-5 ${starVal <= newRating ? 'fill-amber-500 text-amber-500' : 'text-neutral-700'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Comentario</label>
                  <textarea
                    id="review-comment-textarea"
                    required
                    rows={4}
                    placeholder="Comparte tu opinión sobre la comodidad, los acabados y el tallaje del producto..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white placeholder-neutral-600 outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>

                <button
                  id="review-submit-btn"
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-neutral-950 shadow-lg shadow-amber-500/10 transition-all hover:opacity-90"
                >
                  ENVIAR RESEÑA VERIFICADA
                </button>

                {showReviewSuccess && (
                  <div id="review-success" className="text-center text-xs font-medium text-emerald-500">
                    ¡Gracias! Tu reseña ha sido guardada y publicada.
                  </div>
                )}
              </form>

            </div>

          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {recommendations.length > 0 && (
          <section className="mt-16 border-t border-neutral-900 pt-12">
            <h3 className="font-sans text-lg font-bold uppercase text-white mb-8">Te Podría Interesar</h3>
            <div id="recommendations-list" className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {recommendations.map(prod => (
                <div 
                  id={`rec-item-${prod.id}`}
                  key={prod.id} 
                  onClick={() => {
                    navigateTo({ type: 'product', productId: prod.id });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="cursor-pointer group flex flex-col p-2.5 rounded-xl border border-neutral-900 bg-neutral-950 hover:border-neutral-800 transition-all"
                >
                  <div className="aspect-square bg-neutral-900/40 rounded-lg flex items-center justify-center p-3 overflow-hidden">
                    <img 
                      src={prod.images[0]} 
                      alt={prod.name} 
                      className="max-h-24 object-contain transition-transform group-hover:scale-110 group-hover:-rotate-3" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h4 className="mt-2 text-xs font-semibold truncate leading-none text-white group-hover:text-amber-500">
                    {prod.name}
                  </h4>
                  <span className="mt-1 text-xs font-sans font-bold text-white">
                    {formatPrice(prod.basePrice * (1 - prod.discount / 100))}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};
