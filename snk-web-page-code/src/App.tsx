import { SeeMoreButton } from './components/SeeMoreButton';
import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { HeroIntro } from './components/HeroIntro';
import { LatestDrops } from './components/LatestDrops';
import { TrendingCarousel } from './components/TrendingCarousel';
import { CatalogView } from './components/CatalogView';
import { ProductDetail } from './components/ProductDetail';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutView } from './components/CheckoutView';
import { AdminPanel } from './components/AdminPanel';
import { ProductCard } from './components/ProductCard';
import { OriginalLogo } from './components/OriginalLogo';
import { StarfieldBackground } from './components/StarfieldBackground';
import { SplashIntro } from './components/SplashIntro';
import { RecommendationsView } from './components/RecommendationsView';
import { BrandMarquee } from './components/BrandMarquee';
import { BrandLogo } from './components/BrandLogo';
import {
  ShieldCheck,
  Truck,
  Award,
  Heart,
  ShoppingBag,
  ArrowRight,
  CornerDownRight,
  MessageCircle,
  Store,
  ClipboardCheck,
  PackageCheck,
  Clock,
  Play,
  Camera
} from 'lucide-react';
import { LogoRow, PAYMENT_LOGOS, CARRIER_LOGOS } from './components/TrustLogos';
import type { ViewState } from './types';
import { motion, AnimatePresence, useInView } from 'motion/react';

// Mismo formato de título para todas las secciones del sitio.
const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}> = ({ title, subtitle, align = 'left' }) => (
  <div className={align === 'center' ? 'text-center' : 'text-left'}>
    <h2 className="font-sans text-2xl font-black uppercase tracking-[-0.06em] luxury-title sm:text-4xl">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-3 max-w-2xl text-xs leading-relaxed text-neutral-400 sm:text-sm mx-0 data-[center=true]:mx-auto" data-center={align === 'center'}>
        {subtitle}
      </p>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Vistas                                                              */
/* ------------------------------------------------------------------ */

// BrandView sub-component for specific brand pages
const BrandView: React.FC<{ brandId: string }> = ({ brandId }) => {
  const { brands, products } = useApp();
  const brand = brands.find(b => b.id === brandId);

  if (!brand) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-white">
        <h3 className="text-lg font-bold uppercase">Marca no encontrada</h3>
        <p className="text-xs text-neutral-500 mt-2">
          La marca seleccionada no se encuentra disponible.
        </p>
      </div>
    );
  }

  const brandProducts = products.filter(p => p.brandId === brand.id);

  return (
    <div
      id={`brand-view-page-${brand.id}`}
      className="bg-transparent text-white min-h-screen"
    >
      {/* Brand Hero Banner */}
      <div className="relative h-[45vh] w-full overflow-hidden flex items-center justify-center">
        {brand.heroImage && (
          <div className="absolute inset-0 z-0">
            <img
              src={brand.heroImage}
              alt={brand.name}
              className="h-full w-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center space-y-3">
          <span className="rounded-full bg-white px-3.5 py-1 text-[10px] font-mono font-extrabold text-neutral-950 tracking-widest uppercase">
            COLECCIÓN EXCLUSIVA
          </span>

          <div className="flex justify-center py-2">
            <BrandLogo brand={brand} className="h-20 w-auto max-w-[260px] sm:h-24" fallbackClassName="hidden" />
          </div>

          <h2 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.06em] luxury-title">
            {brand.name}
          </h2>


          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed">
            {brand.story}
          </p>
        </div>
      </div>

      {/* Brand Catalog Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 border-b border-neutral-900 pb-5">
          <SectionTitle
            title={`Colección ${brand.name} (${brandProducts.length})`}
            subtitle="Zapatillas icónicas de alta gama, seleccionadas por Sneakers Collection"
          />
        </div>

        {brandProducts.length > 0 ? (
          <div
            id="brand-products-grid"
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {brandProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-neutral-900 rounded-2xl bg-neutral-900/10">
            <ShoppingBag className="mx-auto h-10 w-10 text-neutral-600" />
            <h4 className="mt-4 text-sm font-bold text-white uppercase">
              Sin existencias
            </h4>
            <p className="mt-1 text-xs text-neutral-500">
              Próximamente agregaremos lanzamientos de {brand.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// FavoritesView sub-component for saved sneakers
const FavoritesView: React.FC = () => {
  const { favorites, products, navigateTo } = useApp();
  const favProducts = products.filter(p => favorites.includes(p.id));

  return (
    <div id="favorites-page" className="bg-transparent text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 border-b border-neutral-900 pb-6">
          <SectionTitle
            title="Tus favoritos"
          />
        </div>

        {favProducts.length > 0 ? (
          <div
            id="favorites-products-grid"
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {favProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div
            id="favorites-empty-card"
            className="mx-auto max-w-md text-center py-16 px-6 border border-neutral-900 rounded-3xl bg-neutral-900/10 space-y-4"
          >
            <Heart className="mx-auto h-12 w-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.55)]" />

            <h4 className="text-sm font-bold text-white uppercase">
              Tu bóveda está vacía
            </h4>

            <p className="text-xs text-neutral-500 max-w-xs mx-auto">
              Guarda tus lanzamientos preferidos presionando el ícono de corazón en cualquiera de nuestros modelos.
            </p>

            <button
              id="favorites-go-catalog"
              onClick={() => navigateTo({ type: 'catalog' })}
              className="rounded-full bg-white hover:bg-neutral-200 px-6 py-2.5 text-xs font-bold text-neutral-950 transition-colors uppercase tracking-widest"
            >
              Explorar Catálogo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const evidenceVideos = [
  { src: '/evidencia/video-1.mp4', poster: '/evidencia/video-1.jpg', title: 'Nike', caption: 'Recién llegados' },
  { src: '/evidencia/video-2.mp4', poster: '/evidencia/video-2.jpg', title: 'Salomon', caption: 'Revisión previa' },
  { src: '/evidencia/video-3.mp4', poster: '/evidencia/video-3.jpg', title: 'Listos', caption: 'Rumbo al cliente' }
];

const evidencePhotos = [
  { src: '/evidencia/foto-1.jpg', title: 'NB 9060', caption: 'Full black' },
  { src: '/evidencia/foto-2.jpg', title: 'Campus 00s', caption: 'Adidas' },
  { src: '/evidencia/foto-3.jpg', title: 'Tommy', caption: 'Hilfiger' }
];

const EvidenceCaption: React.FC<{ title: string; caption: string; kind: 'video' | 'photo' }> = ({ title, caption, kind }) => (
  <>
    <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:text-[10px]">
      {kind === 'video' ? <Play className="h-2.5 w-2.5 fill-current sm:h-3 sm:w-3" /> : <Camera className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
      <span className="hidden sm:inline">{kind === 'video' ? 'Video' : 'Foto'}</span>
    </span>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-2 pb-2 pt-10 sm:px-4 sm:pb-4">
      <p className="glow-title truncate font-sans text-[11px] font-black uppercase tracking-[-0.02em] text-white sm:text-base">{title}</p>
      <p className="truncate text-[9px] text-neutral-300 sm:text-xs">{caption}</p>
    </div>
  </>
);

// Video que se reproduce solo cuando está en pantalla (ahorra datos en celular).
const EvidenceVideo: React.FC<(typeof evidenceVideos)[number]> = ({ src, poster, title, caption }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const inView = useInView(ref, { amount: 0.4 });

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (inView) video.play().catch(() => undefined);
    else video.pause();
  }, [inView]);

  return (
    <div className="glow-card group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 sm:rounded-2xl">
      <video
        ref={ref}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        className="h-full w-full object-cover"
      />
      <EvidenceCaption title={title} caption={caption} kind="video" />
    </div>
  );
};

const aboutStats = [
  { value: 2, label: 'años vendiendo' },
  { value: 40, label: 'proveedores aliados' },
  { value: 500, label: 'pares entregados' },
  { value: 20, label: 'ciudades con envíos' }
];

// Cifra estilo tragamonedas: cada dígito gira y se detiene en su número, de izquierda a derecha.
const SlotNumber: React.FC<{ value: number; prefix?: string }> = ({ value, prefix = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const digits = String(value).split('').map(Number);
  const SPINS = 3; // vueltas completas antes de detenerse

  return (
    <span ref={ref} className="slot-number inline-flex items-center" aria-label={`${prefix}${value}`}>
      {prefix && <span aria-hidden="true" className="leading-[1.1em]">{prefix}</span>}
      {digits.map((digit, i) => {
        const reel = Array.from({ length: SPINS * 10 + digit + 1 }, (_, n) => n % 10);
        return (
          <span key={i} aria-hidden="true" className="relative inline-block h-[1.1em] overflow-hidden">
            <motion.span
              className="flex flex-col"
              initial={{ y: '0em' }}
              animate={inView ? { y: `-${(reel.length - 1) * 1.1}em` } : { y: '0em' }}
              transition={{ duration: 1.6 + i * 0.45, ease: [0.12, 0.75, 0.2, 1] }}
            >
              {reel.map((n, k) => (
                <span key={k} className="block h-[1.1em] leading-[1.1em]">{n}</span>
              ))}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
};

const salesModels = [
  {
    icon: ShoppingBag,
    title: 'Consumidor final',
    text: 'Compra tu par desde la tienda, paga en línea y recíbelo en la puerta de tu casa.',
    cta: 'Ver catálogo',
    action: 'catalog' as const
  },
  {
    icon: Store,
    title: 'Al por mayor',
    text: 'Para tiendas, emprendedores y revendedores: precios por volumen y surtido de calzado importado.',
    cta: 'Cotizar por WhatsApp',
    action: 'wholesale' as const
  }
];

const shippingSteps = [
  { icon: ClipboardCheck, title: 'Procesamos tu pedido', text: 'Apenas compras, tu pedido entra a preparación de inmediato.' },
  { icon: PackageCheck, title: 'Verificamos el stock', text: 'Confirmamos tu talla y revisamos el par antes de empacarlo.' },
  { icon: Truck, title: 'Lo despachamos', text: 'Sale con transportadora (gratis en pares desde $180.000) y te compartimos la guía por WhatsApp.' },
  { icon: Clock, title: 'Llega en 1 a 3 días hábiles', text: 'Según tu ciudad y la transportadora, después de enviado.' }
];

const WHOLESALE_URL =
  'https://wa.me/573208646516?text=' +
  encodeURIComponent('Hola, quiero información para comprar al por mayor en Sneakers Collection.');

const AboutTitle: React.FC<{ kicker?: string; title: string }> = ({ kicker, title }) => (
  <div className="text-center">
    {kicker && <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500">{kicker}</p>}
    <h2 className="luxury-title mt-3 font-sans text-3xl font-black uppercase tracking-[-0.06em] sm:text-5xl">
      {title}
    </h2>
  </div>
);

const reveal = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.8, ease: 'easeOut' as const }
};

// Sobre nosotros: quiénes somos, cifras, modelos de venta, envíos y medios de pago.
const AboutView: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div id="about-page" className="relative overflow-hidden bg-transparent text-white min-h-screen">
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* Portada */}
        <section className="flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
          <motion.img
            src="/logo-sneakers-collection.png"
            alt="Sneakers Collection"
            draggable={false}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="logo-float h-auto w-[62%] max-w-[340px] select-none"
          />
          <motion.h1 {...reveal} className="red-glow-label mt-10 text-5xl font-black uppercase tracking-[-0.04em] sm:text-7xl">
            Llega seguro.
          </motion.h1>
          <motion.p {...reveal} className="mt-6 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg">
            Somos una red de distribución y comercialización de calzado importado en Colombia.
            Nacimos en Cali y hoy llevamos sneakers de alta calidad a todo el país, tanto al
            consumidor final como a tiendas y revendedores.
          </motion.p>
        </section>

        {/* Cifras */}
        <motion.section {...reveal} className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-4">
          {aboutStats.map(stat => (
            <div key={stat.label} className="bg-[#050506] px-4 py-8 text-center">
              <p className="font-sans text-4xl font-black tabular-nums tracking-[-0.04em] sm:text-5xl">
                <SlotNumber value={stat.value} prefix="+" />
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-neutral-400">{stat.label}</p>
            </div>
          ))}
        </motion.section>
        <motion.p {...reveal} className="mt-6 flex flex-col items-center justify-center gap-1.5 text-center text-sm text-neutral-400 sm:flex-row sm:gap-2">
          <span className="flex gap-0.5 text-base text-[#d10a1f]">{'★★★★★'}</span>
          4.9 de calificación promedio de nuestros clientes
        </motion.p>

        {/* Modelos de venta */}
        <section className="pt-24 pb-24">
          <AboutTitle title="¿Cómo vendemos?" />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {salesModels.map(({ icon: Icon, title, text, cta, action }) => (
              <motion.div
                key={title}
                {...reveal}
                className="glow-card group flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.02] px-6 py-10 text-center"
              >
                <Icon className="glow-icon h-8 w-8 text-white/80" />
                <h3 className="luxury-title mt-5 font-sans text-2xl font-black uppercase tracking-[-0.05em]">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-neutral-400">{text}</p>
                {action === 'catalog' ? (
                  <button
                    type="button"
                    onClick={() => navigateTo({ type: 'catalog' })}
                    className="glow-button mt-7 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.18em]"
                  >
                    {cta}
                  </button>
                ) : (
                  <a
                    href={WHOLESALE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="glow-button mt-7 rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.18em]"
                  >
                    {cta}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Evidencia: videos arriba y fotos abajo */}
        <section className="pb-24">
          <motion.h2
            {...reveal}
            className="luxury-title mx-auto max-w-3xl text-center font-sans text-2xl font-black tracking-[-0.04em] sm:text-4xl"
          >
            Pares de verdad, revisados y despachados por nosotros mismos.
          </motion.h2>

          <motion.div {...reveal} className="mt-10 grid grid-cols-3 gap-2 sm:gap-4">
            {evidenceVideos.map(video => (
              <EvidenceVideo key={video.src} {...video} />
            ))}
          </motion.div>

          <motion.div {...reveal} className="mt-2 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-4">
            {evidencePhotos.map(photo => (
              <div
                key={photo.src}
                className="glow-card group relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-neutral-900 sm:rounded-2xl"
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <EvidenceCaption title={photo.title} caption={photo.caption} kind="photo" />
              </div>
            ))}
          </motion.div>

        </section>

        {/* Envíos */}
        <section className="pb-24">
          <motion.img
            {...reveal}
            src="/shipping/logistica.png"
            alt=""
            className="mx-auto mb-8 h-20 w-auto opacity-80"
          />
          <AboutTitle kicker="Envío gratis a todo Colombia" title="Así llega tu pedido" />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {shippingSteps.map(({ icon: Icon, title, text }, index) => (
              <motion.div
                key={title}
                {...reveal}
                transition={{ ...reveal.transition, delay: index * 0.1 }}
                className="glow-card group rounded-3xl border border-white/10 bg-white/[0.02] p-6 text-center"
              >
                <p className="glow-title font-sans text-3xl font-black text-white/30">{index + 1}</p>
                <Icon className="glow-icon mx-auto mt-3 h-7 w-7 text-white/80" />
                <h3 className="glow-title mt-4 font-sans text-lg font-black uppercase tracking-[-0.03em] text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-400">{text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div {...reveal} className="mt-12 text-center">
            <p className="red-glow-label text-xs font-bold uppercase tracking-[0.3em]">Transportadoras</p>
            <LogoRow items={CARRIER_LOGOS} fit={{ area: 3200, maxWidth: 140, maxHeight: 48 }} className="mt-6 gap-x-12 gap-y-8" />
          </motion.div>
        </section>

        {/* Medios de pago */}
        <section className="pb-24">
          <motion.div {...reveal} className="text-center">
            <p className="red-glow-label text-xs font-bold uppercase tracking-[0.3em]">Medios de pago</p>
            <LogoRow items={PAYMENT_LOGOS} fit={{ area: 3200, maxWidth: 140, maxHeight: 52 }} className="mt-6 gap-x-12 gap-y-8" />
          </motion.div>
        </section>

        {/* Cierre */}
        <motion.section {...reveal} className="flex flex-col items-center pb-28 text-center">
          <h2 className="red-glow-label font-sans text-3xl font-black uppercase tracking-[-0.06em] sm:text-4xl">
            ¡Encuentra tu próximo par!
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigateTo({ type: 'catalog' })}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-black transition-colors hover:bg-neutral-200"
            >
              Ver catálogo
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="https://wa.me/573208646516"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white/85 transition-colors hover:border-white/50 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Escríbenos
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

const PaymentResultView: React.FC = () => {
  const reference = new URLSearchParams(window.location.search).get('reference') ?? '';
  const [status, setStatus] = useState<'checking' | 'pending' | 'paid' | 'failed' | 'unavailable'>('checking');

  useEffect(() => {
    let active = true;
    let attempts = 0;
    let timer: number | undefined;

    const checkStatus = async () => {
      if (!reference) {
        setStatus('unavailable');
        return;
      }

      try {
        const response = await fetch(`/api/payment-status?reference=${encodeURIComponent(reference)}`);
        if (!response.ok) throw new Error('No se pudo consultar el pedido.');
        const result = await response.json() as { status?: 'pending' | 'paid' | 'failed' };
        if (!active || !result.status) return;
        setStatus(result.status);
        attempts += 1;
        if (result.status === 'pending' && attempts < 20) {
          timer = window.setTimeout(checkStatus, 3000);
        }
      } catch {
        if (active) setStatus('unavailable');
      }
    };

    void checkStatus();
    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [reference]);

  const statusText = {
    checking: 'Consultando el estado de tu pago...',
    pending: 'Pago recibido. La confirmación puede tardar unos minutos.',
    paid: 'Pago confirmado. ¡Gracias por tu compra!',
    failed: 'El pago no fue aprobado. Puedes volver a intentarlo.',
    unavailable: 'No pudimos consultar el pago. Conserva tu referencia y vuelve a intentarlo.'
  }[status];

  return (
    <main className="flex min-h-screen items-center justify-center bg-transparent px-4 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-neutral-900 bg-neutral-950 p-8 text-center">
        <h1 className="text-2xl font-black uppercase tracking-tight">Estado del pago</h1>
        <p className="mt-4 text-sm text-neutral-300">{statusText}</p>
        {reference && <p className="mt-4 font-mono text-xs text-neutral-400">Referencia: {reference}</p>}
        <a
          href="/"
          className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-xs font-bold uppercase text-neutral-950"
        >
          Volver a Sneakers Collection
        </a>
      </section>
    </main>
  );
};

const footerLinks: { label: string; view: ViewState }[] = [
  { label: 'Inicio', view: { type: 'home' } },
  { label: 'Catálogo', view: { type: 'catalog' } },
  { label: 'Recomendaciones', view: { type: 'recommendations' } },
  { label: 'Sobre nosotros', view: { type: 'about' } },
  { label: 'Tus favoritos', view: { type: 'favorites' } }
];

// Inner App Layout that can safely consume useApp context
function MainLayout() {
  const { activeView, navigateTo, products } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Ediciones limitadas primero; si hay pocas, se completa con el resto del catálogo.
  const homeNewArrivals = [
    ...products.filter(p => p.isLimited),
    ...products.filter(p => !p.isLimited)
  ].slice(0, 4);

  const renderCurrentView = () => {
    switch (activeView.type) {
      case 'home':
        return (
          <div id="home-view" className="space-y-4">

            {/* Cinematic Carousel Portada */}
            <HeroIntro />

            {/* Recién llegados — carrusel tipo hype.com.co */}
            <LatestDrops />

            {/* Tendencias del momento slider */}
            <TrendingCarousel />

            <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <motion.div {...reveal} className="mb-8">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-red-500">Exclusivo</p>
                <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.06em] luxury-title sm:text-5xl">
                  La casa de los sneakers
                </h2>
              </motion.div>

              <div
                id="home-new-arrivals-grid"
                className="grid grid-cols-2 gap-4 lg:grid-cols-4"
              >
                {homeNewArrivals.map((p, index) => (
                  <ProductCard key={p.id} product={p} index={index} />
                ))}
              </div>

              <div className="mt-10 text-center">
                <SeeMoreButton
                  id="home-view-all-catalog-btn"
                  label="Ver catálogo completo"
                  onClick={() => navigateTo({ type: 'catalog' })}
                />
              </div>
            </section>

            {/* Carrusel de marcas, al final del inicio */}
            <BrandMarquee />
          </div>
        );

      case 'brand':
        return <BrandView brandId={activeView.brandId} />;

      case 'product':
        return <ProductDetail productId={activeView.productId} />;

      case 'catalog':
        return <CatalogView />;

      case 'recommendations':
        return <RecommendationsView />;

      case 'about':
        return <AboutView />;

      case 'favorites':
        return <FavoritesView />;

      case 'checkout':
        return <CheckoutView />;

      case 'admin':
        return <AdminPanel />;

      default:
        return (
          <div className="text-center py-20 text-white">
            Cargando Bóveda...
          </div>
        );
    }
  };

  return (
    <div
      id="app-root-container"
      className="bg-transparent font-sans text-neutral-100 min-h-screen flex flex-col justify-between selection:bg-white selection:text-neutral-950"
    >
      <Header onOpenCart={() => setIsCartOpen(true)} />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={
              activeView.type +
              (
                activeView.type === 'brand'
                  ? activeView.brandId
                  : activeView.type === 'product'
                    ? activeView.productId
                    : activeView.type
              )
            }
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <footer className="border-t border-neutral-900 bg-transparent pt-16 pb-10 text-neutral-400 font-sans z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-10">

            {/* Marca: logo, descripción y redes */}
            <div className="flex flex-col items-center text-center md:col-span-5 md:items-start md:text-left">
              <button
                type="button"
                onClick={() => navigateTo({ type: 'home' })}
                aria-label="Ir al inicio"
                className="transition-transform duration-200 hover:scale-105"
              >
                <OriginalLogo size="md" showTagline={false} className="footer-logo" />
              </button>

              <p className="mt-6 max-w-sm text-sm leading-relaxed text-neutral-400">
                Tienda colombiana de sneakers de alta calidad. Seleccionamos cada par de Jordan,
                Nike, Adidas, New Balance y más marcas para que encuentres tu estilo sin
                complicaciones: compras en línea, pago seguro y envío gratis a todo el país en pares desde $180.000, con
                acompañamiento por WhatsApp de principio a fin.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
                <a
                  href="https://www.instagram.com/sneakerscollectionsc/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  <img src="/social/instagram.png" alt="" className="h-4 w-4" />
                  <span>Instagram</span>
                </a>
                <a
                  href="https://www.facebook.com/marketplace/profile/61592753193624/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Store className="h-4 w-4 text-[#4da3ff]" />
                  <span>Facebook Marketplace</span>
                </a>
              </div>
            </div>

            {/* Navegación */}
            <div className="text-center md:col-span-3 md:text-left">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                Navegación
              </h4>

              <ul className="mt-5 space-y-3 text-sm">
                {footerLinks.map(({ label, view }) => (
                  <li key={label}>
                    <button
                      onClick={() => navigateTo(view)}
                      className="text-neutral-400 transition-colors hover:text-white"
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Atención de ventas */}
            <div className="text-center md:col-span-4 md:text-left">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white">
                Atención de ventas
              </h4>

              <ul className="mt-5 space-y-4 text-sm">
                <li>
                  <Truck className="mr-2 inline h-4 w-4 align-[-3px] text-neutral-500" />
                  Envío gratis a todo Colombia en pares desde $180.000. Llega en 1 a 3 días hábiles.
                </li>

                <li>
                  <MessageCircle className="mr-2 inline h-4 w-4 align-[-3px] text-neutral-500" />
                  WhatsApp:{' '}
                  <a
                    href="https://wa.me/573208646516"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white hover:underline"
                  >
                    +57 320 864 6516
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Logotipo de la marca: Top Quality Shoes · Sneakers World® · 5 estrellas */}
          <div className="mt-16 flex justify-center">
            <img
              src="/sneakers-world.png"
              alt="Top Quality Shoes · Sneakers World®"
              className="h-auto w-[92%] max-w-[880px] select-none"
              draggable={false}
            />
          </div>

          {/* Medios de pago y transportadoras */}
          <div className="mt-12 grid gap-8 border-t border-neutral-900 pt-10 md:grid-cols-2">
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">Medios de pago</p>
              <LogoRow items={PAYMENT_LOGOS} fit={{ area: 1300, maxWidth: 80, maxHeight: 30 }} className="mt-5" />
            </div>
            <div className="text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-neutral-500">Envíos con</p>
              <LogoRow items={CARRIER_LOGOS} fit={{ area: 1300, maxWidth: 80, maxHeight: 30 }} className="mt-5" />
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-neutral-900 pt-8 text-xs text-neutral-600 sm:flex-row">
            <p>© {new Date().getFullYear()} Sneakers Collection. Todos los derechos reservados.</p>
            <p>Hecho en Colombia</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  // La apertura con el logo se muestra al cargar la página (no al volver del pago).
  const [splashPhase, setSplashPhase] = useState<'playing' | 'revealing' | 'done'>(() =>
    window.location.pathname === '/pago-resultado' ? 'done' : 'playing'
  );

  return (
    <>
      <StarfieldBackground />
      {splashPhase !== 'done' && (
        <SplashIntro
          onReveal={() => setSplashPhase('revealing')}
          onFinish={() => setSplashPhase('done')}
        />
      )}
      <div
        className="relative z-10 min-h-screen transition-opacity duration-500 ease-out"
        style={{ opacity: splashPhase === 'playing' ? 0 : 1 }}
      >
        <AppProvider>
          {window.location.pathname === '/pago-resultado'
            ? <PaymentResultView />
            : <MainLayout />}
        </AppProvider>
      </div>
    </>
  );
}