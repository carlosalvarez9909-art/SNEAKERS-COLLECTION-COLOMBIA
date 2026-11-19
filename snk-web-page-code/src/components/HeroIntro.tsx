import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const isVideoBanner = /\.mp4($|\?)/i.test(currentBanner.image);

  const handleNext = () => {
    setCurrentIdx((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  return (
    <section className="hero-shell relative h-[85vh] w-full overflow-hidden bg-transparent flex items-center justify-center">
      
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.4)_38%,rgba(0,0,0,0.28)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.7),transparent_35%,rgba(0,0,0,0.18)_100%)] pointer-events-none" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentBanner.id}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0 z-0"
        >
          {isVideoBanner ? (
            <video
              src={currentBanner.image}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={currentBanner.image}
              alt={currentBanner.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl items-end px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex w-full items-end justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="max-w-xl text-left"
          >
            <motion.div 
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mb-4 inline-flex items-center space-x-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-mono tracking-[0.22em] text-white/80 backdrop-blur-sm"
            >
              <Sparkles className="h-3 w-3 text-white/80" />
              <span className="uppercase font-bold">{currentBanner.tag}</span>
            </motion.div>

            <motion.h2
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="luxury-title font-sans text-4xl sm:text-5xl lg:text-7xl font-black uppercase leading-[0.88] tracking-[-0.06em]"
            >
              {currentBanner.title.split(' "')[0]}
              <br />
              <span className="block luxury-accent">
                {currentBanner.title.includes('"') ? `"${currentBanner.title.split('"')[1]}"` : ''}
              </span>
            </motion.h2>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-5 max-w-md text-sm sm:text-base text-neutral-200/80 font-sans leading-relaxed"
            >
              {currentBanner.subtitle}
            </motion.p>

            {linkedProduct && (
              <motion.div
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-6 flex items-baseline gap-3"
              >
                <span className="luxury-price text-2xl sm:text-4xl font-sans font-black tracking-[-0.04em]">
                  {formatPrice(linkedProduct.basePrice * (1 - linkedProduct.discount / 100))}
                </span>
                {linkedProduct.discount > 0 && (
                  <>
                    <span className="text-base font-sans text-neutral-300/70 line-through">
                      {formatPrice(linkedProduct.basePrice)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-sans font-extrabold text-white/80 uppercase tracking-[0.18em]">
                      -{linkedProduct.discount}%
                    </span>
                  </>
                )}
              </motion.div>
            )}

            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.42 }}
              className="mt-8 flex items-center gap-3"
            >
              <button
                id="hero-view-ref-btn"
                onClick={() => navigateTo({ type: 'product', productId: currentBanner.productId })}
                className="group inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-[10px] font-bold tracking-[0.22em] text-white backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/10"
              >
                <span>VER REFERENCIA</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button
                id="hero-go-catalog-btn"
                onClick={() => navigateTo({ type: 'catalog' })}
                className="rounded-full border border-white/10 bg-black/30 px-5 py-3 text-[10px] font-bold tracking-[0.22em] text-white/80 transition-colors hover:border-white/25 hover:text-white"
              >
                EXPLORAR
              </button>
            </motion.div>
          </motion.div>

        </div>
      </div>

      {/* Manual Sliders Left/Right arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            id="hero-prev-arrow"
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-neutral-900 bg-neutral-950/80 p-2.5 text-neutral-400 transition-colors hover:border-neutral-800 hover:text-white z-30"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            id="hero-next-arrow"
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-neutral-900 bg-neutral-950/80 p-2.5 text-neutral-400 transition-colors hover:border-neutral-800 hover:text-white z-30"
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
              className={`h-1.5 rounded-full transition-all duration-300 ${currentIdx === idx ? 'w-6 bg-amber-500' : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'}`}
            />
          ))}
        </div>
      )}

    </section>
  );
};