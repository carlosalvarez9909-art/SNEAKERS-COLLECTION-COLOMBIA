import React, { useEffect, useState } from 'react';
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
import {
  ShieldCheck,
  Truck,
  Award,
  Heart,
  ShoppingBag,
  ArrowRight,
  CornerDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Mismo formato de título para todas las secciones del sitio.
const SectionTitle: React.FC<{
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}> = ({ title, subtitle, align = 'left' }) => (
  <div className={align === 'center' ? 'text-center' : 'text-left'}>
    <h2 className="font-sans text-2xl font-black uppercase tracking-[-0.06em] text-white sm:text-4xl">
      {title}
    </h2>
    <div className={`title-rgb-bar mt-3 ${align === 'center' ? 'mx-auto' : ''}`} />
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
        <div className="absolute inset-0 z-0">
          <img
            src={brand.heroImage}
            alt={brand.name}
            className="h-full w-full object-cover opacity-35"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center space-y-3">
          <span className="rounded-full bg-white px-3.5 py-1 text-[10px] font-mono font-extrabold text-neutral-950 tracking-widest uppercase">
            CASA DE DISEÑO ORIGINAL
          </span>

          <h2 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-[-0.06em] text-white">
            {brand.name}
          </h2>

          <div className="title-rgb-bar mx-auto" />

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
            subtitle="Zapatillas icónicas de procedencia verificada por Sneakers Collection"
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
            title="Tus Favoritos Curados"
            subtitle="Piezas guardadas en tu bóveda personal de estilo"
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
            <Heart className="mx-auto h-12 w-12 text-neutral-700" />

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

const storyBlocks = [
  {
    title: 'Ganadores',
    text: 'Para quienes se mueven con propósito y no esperan permiso para llegar primero.'
  },
  {
    title: 'Soñadores',
    text: 'Para quienes ven en cada par una historia y se atreven a imaginar más grande.'
  },
  {
    title: 'Gente de lujo underground',
    text: 'Para quienes entienden que el verdadero lujo está en lo que no todos conocen.'
  }
];

const howItWorks = [
  { title: 'Elige tu par', text: 'Explora el catálogo, escoge tu modelo y tu talla.' },
  { title: 'Paga en línea', text: 'Pagas de forma segura con Bold, directamente desde la tienda.' },
  { title: 'Recíbelo en casa', text: 'Despachamos a todo el país y te acompañamos por WhatsApp.' }
];

// Sobre nosotros: logo flotante centrado, descripción y storytelling con scroll.
const AboutView: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <div
      id="about-page"
      className="relative overflow-hidden bg-transparent text-white min-h-screen"
    >
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
        {/* Logo flotante centrado */}
        <section className="flex min-h-[75vh] w-full flex-col items-center justify-center py-20">
          <div className="origin-center scale-[1.5] sm:scale-[2]">
            <div className="logo-float">
              <OriginalLogo
                size="md"
                showTagline={true}
                className="!items-center !justify-center"
              />
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
            className="mt-24 max-w-2xl text-base leading-8 text-neutral-300 sm:text-lg"
          >
            Sneakers Collection es una tienda online colombiana de zapatillas de colección
            y alta calidad. Seleccionamos cada referencia con criterio y la ponemos a tu
            alcance con un proceso simple: eliges tu modelo y talla, pagas de forma segura
            en línea y despachamos tu pedido a todo el país, con acompañamiento por WhatsApp
            en cada paso.
          </motion.p>
        </section>

        {/* Storytelling de marca */}
        <section className="w-full space-y-28 py-16">
          {storyBlocks.map(block => (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="flex flex-col items-center"
            >
              <h2 className="font-sans text-3xl font-black uppercase tracking-[-0.06em] text-white sm:text-5xl">
                {block.title}
              </h2>
              <div className="title-rgb-bar mt-4" />
              <p className="mt-5 max-w-md text-sm leading-7 text-neutral-400 sm:text-base">
                {block.text}
              </p>
            </motion.div>
          ))}
        </section>

        {/* Cómo funciona (aquí sí es una secuencia real) */}
        <section className="w-full py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
          >
            <SectionTitle align="center" title="Cómo funciona" />
          </motion.div>

          <div className="mt-14 space-y-12">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{ duration: 0.7, delay: index * 0.1 }}
              >
                <p className="font-mono text-[11px] tracking-[0.3em] text-neutral-500">
                  PASO {index + 1}
                </p>
                <h3 className="mt-2 font-sans text-xl font-black uppercase tracking-[-0.04em] text-white sm:text-2xl">
                  {step.title}
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-400">
                  {step.text}
                </p>
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigateTo({ type: 'catalog' })}
            className="group mt-16 inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/30 hover:text-white"
          >
            <span>Ver catálogo</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </section>
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

// Inner App Layout that can safely consume useApp context
function MainLayout() {
  const { activeView, navigateTo, products } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const homeNewArrivals = products.slice(0, 5);

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

            {/* Carrusel de marcas */}
            <BrandMarquee />

            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
              <div className="mb-8">
                <SectionTitle title="Los favoritos de la casa" />
              </div>

              <div
                id="home-new-arrivals-grid"
                className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5"
              >
                {homeNewArrivals.map((p, index) => (
                  <ProductCard key={p.id} product={p} index={index} />
                ))}
              </div>

              <div className="mt-12 text-center">
                <button
                  id="home-view-all-catalog-btn"
                  onClick={() => navigateTo({ type: 'catalog' })}
                  className="group inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-7 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:text-white"
                >
                  <span>VER CATÁLOGO COMPLETO</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </section>
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

      <footer className="border-t border-neutral-900 bg-transparent py-16 text-neutral-400 font-sans z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            <div className="space-y-4 md:col-span-2">
              <div className="flex items-start justify-start">
                <OriginalLogo
                  size="md"
                  showTagline={true}
                  className="!items-start !justify-start"
                />
              </div>

              <p className="text-xs text-neutral-500 leading-relaxed max-w-sm">
                Curaduría y despacho de calzado de colección limitado. Autenticidad certificada en cada costura, empacado bajo condiciones premium de conservación para coleccionistas y entusiastas exigentes.
              </p>

              <div className="flex space-x-4 pt-1">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase text-amber-500">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>Autenticidad Verificada</span>
                </div>

                <div className="flex items-center space-x-1.5 text-[10px] font-mono uppercase text-amber-500">
                  <Award className="h-4.5 w-4.5" />
                  <span>Sello de Originalidad</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[11px] font-mono tracking-widest text-white uppercase font-bold">
                Navegación
              </h4>

              <ul className="space-y-2 text-xs">
                <li>
                  <button
                    onClick={() => navigateTo({ type: 'home' })}
                    className="hover:text-amber-500 transition-colors text-left flex items-center space-x-1"
                  >
                    <CornerDownRight className="h-3 w-3 text-neutral-700" />
                    <span>Inicio Principal</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo({ type: 'catalog' })}
                    className="hover:text-amber-500 transition-colors text-left flex items-center space-x-1"
                  >
                    <CornerDownRight className="h-3 w-3 text-neutral-700" />
                    <span>Catálogo de Referencias</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo({ type: 'favorites' })}
                    className="hover:text-amber-500 transition-colors text-left flex items-center space-x-1"
                  >
                    <CornerDownRight className="h-3 w-3 text-neutral-700" />
                    <span>Tus Favoritos</span>
                  </button>
                </li>

                <li>
                  <button
                    onClick={() => navigateTo({ type: 'admin' })}
                    className="hover:text-amber-500 transition-colors text-left flex items-center space-x-1"
                  >
                    <CornerDownRight className="h-3 w-3 text-neutral-700" />
                    <span>Panel de Control</span>
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-3.5">
              <h4 className="text-[11px] font-mono tracking-widest text-white uppercase font-bold">
                Atención de Ventas
              </h4>

              <ul className="space-y-2 text-xs text-neutral-500">
                <li className="flex items-start space-x-2.5">
                  <Truck className="h-4 w-4 text-neutral-700 shrink-0 mt-0.5" />
                  <span>
                    Despachos nacionales asegurados mediante transportadoras premium.
                  </span>
                </li>

                <li className="text-[10px] font-mono uppercase text-neutral-400">
                  Soporte Telefónico / WhatsApp:
                  <br />

                  <a
                    href="https://wa.me/573208646516"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-500 hover:underline"
                  >
                    +57 320 864 6516
                  </a>
                </li>
              </ul>
            </div>

          </div>

          <div className="mt-12 border-t border-neutral-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] font-mono tracking-wider uppercase text-neutral-600 gap-4">
            <p>
              © {new Date().getFullYear()} Sneakers Collection. Todos los derechos reservados.
            </p>

            <p className="flex items-center gap-1.5">
              <span>Hecho en Colombia</span>
              <span>•</span>
              <span>Autenticidad Garantizada</span>
            </p>
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