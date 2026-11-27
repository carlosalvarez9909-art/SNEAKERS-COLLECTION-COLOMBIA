import React, { useState, useEffect } from 'react';
import { finalUnitPrice } from '../lib/price';
import { useApp } from '../context/AppContext';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const HeroIntro: React.FC = () => {
  const { banners, navigateTo, formatPrice, products } = useApp();
  const [currentIdx, setCurrentIdx] = useState(0);

  const activeBanners = banners.filter(b => b.active);

  // Auto rotate banners every 6 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIdx];
  const linkedProduct = products.find(p => p.id === currentBanner.productId);
  const isVideoBanner = /\.(mp4|webm)($|\?)/i.test(currentBanner.image);
  // "AIR JORDAN 4 \"BLACK CAT\"" -> modelo arriba, apodo grande en rojo
  const [modelName, nickname] = (() => {
    const m = currentBanner.title.match(/^(.*?)\s*["“](.+?)["”]\s*$/);
    return m ? [m[1], m[2]] : [currentBanner.title, ''];
  })();

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <section className="hero-shell relative h-[85svh] sm:h-[85vh] lg:h-[88vh] w-full overflow-hidden bg-transparent flex items-center justify-center">
      
      {/* Oscurece solo la franja inferior: el video queda limpio y el texto se lee */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(to_top,rgba(0,0,0,0.92)_0%,rgba(0,0,0,0.55)_28%,transparent_55%)] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.4)_45%,transparent_65%)]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          {/* Fondo: el mismo video, ampliado y desenfocado, para llenar los lados sin recortar */}
          {isVideoBanner ? (
            <video
              src={currentBanner.image}
              autoPlay
              muted
              loop
              playsInline
              aria-hidden
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            />
          ) : (
            <img
              src={currentBanner.image}
              alt=""
              aria-hidden
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            />
          )}

          {/* Video completo: en celular centrado, en PC a la derecha del texto */}
          <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[8%]">
            {isVideoBanner ? (
              <video
                src={currentBanner.image}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain lg:w-auto lg:rounded-3xl lg:shadow-[0_0_60px_rgba(209,10,31,0.25)]"
              />
            ) : (
              <img
                src={currentBanner.image}
                alt={currentBanner.title}
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain lg:w-auto"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-end px-4 pb-14 sm:px-6 sm:pb-16 lg:items-center lg:px-8 lg:pb-0">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-lg text-left"
        >
          {currentBanner.tag && (
            <span className="inline-flex items-center gap-2 rounded-full border border-red-600/60 bg-black/40 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-500 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
              </span>
              {currentBanner.tag}
            </span>
          )}

          <h2 className="mt-4 font-sans font-black uppercase leading-[0.9] tracking-[-0.05em] drop-shadow-[0_6px_24px_rgba(0,0,0,0.8)]">
            <span className="block text-lg text-white/85 sm:text-2xl">{modelName}</span>
            {nickname && <span className="red-glow-label mt-1 block text-4xl sm:text-6xl">{nickname}</span>}
          </h2>

          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-base">
            {currentBanner.subtitle}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              id="hero-view-ref-btn"
              onClick={() => navigateTo({ type: 'product', productId: currentBanner.productId })}
              className="glow-button group inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.16em]"
            >
              Descúbrelo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              id="hero-go-catalog-btn"
              onClick={() => navigateTo({ type: 'catalog' })}
              className="rounded-full border border-red-600/70 bg-black/40 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-red-500 backdrop-blur-sm transition-all hover:border-red-500 hover:text-white hover:shadow-[0_0_22px_rgba(209,10,31,0.5)]"
            >
              Ver catálogo
            </button>
            {linkedProduct && (
              <span className="ml-1 flex items-baseline gap-2">
                <span className="luxury-price text-xl font-black tracking-[-0.03em] sm:text-2xl">
                  {formatPrice(finalUnitPrice(linkedProduct.basePrice, linkedProduct.discount))}
                </span>
                {linkedProduct.discount > 0 && (
                  <span className="text-xs text-white/50 line-through">{formatPrice(linkedProduct.basePrice)}</span>
                )}
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Manual Sliders Left/Right arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            id="hero-prev-arrow"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-red-600/50 bg-black/50 p-2.5 text-red-500 transition-all hover:border-red-500 hover:text-white hover:shadow-[0_0_18px_rgba(209,10,31,0.5)] sm:block"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            id="hero-next-arrow"
            onClick={handleNext}
            className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-red-600/50 bg-black/50 p-2.5 text-red-500 transition-all hover:border-red-500 hover:text-white hover:shadow-[0_0_18px_rgba(209,10,31,0.5)] sm:block"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Bullet Dot indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
          {activeBanners.map((_, idx) => (
            <button
              id={`hero-bullet-${idx}`}
              key={idx}
              onClick={() => setCurrentIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${currentIdx === idx ? 'w-6 bg-red-600 shadow-[0_0_10px_rgba(209,10,31,0.8)]' : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'}`}
            />
          ))}
        </div>
      )}

    </section>
  );
};