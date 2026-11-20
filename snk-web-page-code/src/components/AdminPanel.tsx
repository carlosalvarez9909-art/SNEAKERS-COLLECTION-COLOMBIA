import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product, Brand, Coupon, HeroBanner } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { 
  Settings, Database, Plus, Trash2, Edit3, Save, CheckCircle, 
  X, ShoppingBag, Tag, Sparkles, RefreshCw, AlertCircle, 
  UserRound, HelpCircle, MessageCircle, LogOut, ShieldCheck 
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    products, 
    brands, 
    catalogError,
    coupons, 
    banners, 
    orders, 
    addProduct, 
    updateProduct, 
    deleteProduct, 
    importInitialProducts,
    addCoupon, 
    deleteCoupon, 
    addBanner, 
    deleteBanner, 
    updateBannerStatus, 
    updateOrderStatus,
    formatPrice 
  } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [adminMessage, setAdminMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [hasImportedSeed, setHasImportedSeed] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Active Admin Sub-tab state
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'coupons' | 'banners'>('products');

  // Form states - Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isDraggingImages, setIsDraggingImages] = useState(false);
  const [prodForm, setProdForm] = useState<Partial<Product>>({
    id: '',
    brandId: 'jordan',
    name: '',
    sku: '',
    description: '',
    history: '',
    basePrice: 600000,
    discount: 0,
    images: [],
    colors: [{ name: 'Black', hex: '#000000' }],
    sizes: [38, 39, 40, 41, 42, 43],
    technologies: ['Visible Air-Sole Unit'],
    materials: ['Cuero premium', 'Suela de goma'],
    isLimited: false,
    isBestSeller: false,
    isTrending: false,
    rating: 4.8,
    reviewsCount: 1,
    slug: ''
  });

  // Campos de lista escritos como texto separado por comas (tallas, materiales, tecnologías).
  const [listText, setListText] = useState({ sizes: '38, 39, 40, 41, 42, 43', materials: '', technologies: '' });
  const loadListText = (product: Partial<Product>) =>
    setListText({
      sizes: (product.sizes ?? []).join(', '),
      materials: (product.materials ?? []).join(', '),
      technologies: (product.technologies ?? []).join(', ')
    });
  const splitList = (text: string) => text.split(',').map(item => item.trim()).filter(Boolean);

  // Form states - Coupons
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '',
    type: 'percent',
    value: 15,
    validFrom: '2026-01-01',
    validTo: '2027-12-31'
  });

  // Form states - Banners
  const [bannerForm, setBannerForm] = useState<Partial<HeroBanner>>({
    title: '',
    subtitle: '',
    image: '',
    productId: '',
    tag: 'EDICIÓN ESPECIAL',
    active: true
  });

  useEffect(() => {
    if (!supabase) {
      setAuthError('Agrega las variables de Supabase para habilitar el acceso de administración.');
      return;
    }

    let active = true;
    const verifyAdmin = async (userId: string) => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!active) return;
      if (error) {
        setAuthError(`No se pudo verificar el acceso de administrador: ${error.message}`);
        setIsAuthenticated(false);
        return;
      }
      setIsAuthenticated(Boolean(data));
      if (data) {
        const { data: importMarker, error: importError } = await supabase
          .from('catalog_imports')
          .select('id')
          .eq('id', 'initial_catalog_v1')
          .maybeSingle();
        if (importError) {
          setAdminMessage(`No se pudo consultar la importación inicial: ${importError.message}`);
          return;
        }
        setHasImportedSeed(Boolean(importMarker));
      }
      if (!data) setAuthError('Esta cuenta no tiene permisos de administrador.');
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthError(`No se pudo recuperar la sesión: ${error.message}`);
        return;
      }
      if (data.session?.user.id) void verifyAdmin(data.session.user.id);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user.id) {
        void verifyAdmin(session.user.id);
      } else if (active) {
        setIsAuthenticated(false);
      }
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Imagen o video del banner: se sube a Supabase y queda su enlace en el banner.
  const [isUploadingBannerMedia, setIsUploadingBannerMedia] = useState(false);
  const handleBannerMedia = async (file?: File) => {
    if (!file) return;
    if (!supabase) {
      setAdminMessage('Configura Supabase antes de subir archivos.');
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';
    if (!isImage && !isVideo) {
      setAdminMessage('Sube una imagen (JPG, PNG, WEBP) o un video MP4. Los .MOV del iPhone hay que convertirlos a MP4.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setAdminMessage('El archivo supera el límite de 50 MB.');
      return;
    }
    setIsUploadingBannerMedia(true);
    setAdminMessage('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Inicia sesión antes de subir archivos.');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const objectPath = `${user.id}/banners/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage
        .from('product-images')
        .upload(objectPath, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('product-images').getPublicUrl(objectPath);
      setBannerForm(prev => ({ ...prev, image: data.publicUrl }));
      setAdminMessage(isVideo ? 'Video del banner subido.' : 'Imagen del banner subida.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo subir el archivo.');
    } finally {
      setIsUploadingBannerMedia(false);
    }
  };

  const handleImageFiles = async (fileList: FileList | File[]) => {
    const remainingSlots = Math.max(0, 10 - (prodForm.images?.length ?? 0));
    const files = Array.from(fileList).slice(0, remainingSlots);
    if (files.length === 0) return;

    if (!supabase) {
      setAdminMessage('Configura Supabase antes de subir imágenes.');
      return;
    }

    setIsUploadingImages(true);
    setAdminMessage('');
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Inicia sesión antes de subir imágenes.');

      const imageUrls = await Promise.all(files.map(async file => {
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} no es una imagen.`);
        }
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`${file.name} supera el límite de 10 MB.`);
        }

        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const objectPath = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(objectPath, file, { contentType: file.type, upsert: false });
        if (error) throw error;

        const { data } = supabase.storage.from('product-images').getPublicUrl(objectPath);
        return data.publicUrl;
      }));

      setProdForm(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls].slice(0, 10)
      }));
      setAdminMessage('Fotos subidas al almacenamiento de Supabase.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudieron subir las fotos.');
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Handle product edit load
  const handleEditProdClick = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm(prod);
    loadListText(prod);
    setIsAddingNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNewProdClick = () => {
    setIsAddingNew(true);
    setEditingProduct(null);
    setProdForm({
      id: `prod-${Date.now()}`,
      brandId: 'jordan',
      name: '',
      sku: '',
      description: '',
      history: '',
      basePrice: 600000,
      discount: 0,
      images: [],
      colors: [{ name: 'Negro', hex: '#000000' }],
      sizes: [38, 39, 40, 41, 42, 43],
      technologies: [],
      materials: [],
      isLimited: false,
      isBestSeller: false,
      isTrending: false,
      rating: 5,
      reviewsCount: 0,
      isTopRated: false,
      slug: ''
    });
    setListText({ sizes: '38, 39, 40, 41, 42, 43', materials: '', technologies: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.sku) return;

    const sizes = splitList(listText.sizes).map(Number).filter(n => !Number.isNaN(n) && n > 0);
    const finalProduct: Product = {
      ...(prodForm as Product),
      sizes: sizes.length ? sizes : prodForm.sizes ?? [],
      materials: splitList(listText.materials),
      technologies: splitList(listText.technologies),
      slug: prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    setAdminMessage('');
    try {
      if (isAddingNew) {
        await addProduct(finalProduct);
      } else if (editingProduct) {
        await updateProduct(finalProduct);
      }
      setAdminMessage('Producto guardado en Supabase.');
      setIsAddingNew(false);
      setEditingProduct(null);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.value) return;

    const newCoupon: Coupon = {
      id: `cpn-${Date.now()}`,
      code: couponForm.code.trim().toUpperCase(),
      type: couponForm.type as 'percent' | 'fixed',
      value: Number(couponForm.value),
      validFrom: couponForm.validFrom || '2026-01-01',
      validTo: couponForm.validTo || '2027-12-31'
    };

    try {
      await addCoupon(newCoupon);
      setAdminMessage('Cupón guardado en Supabase.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo guardar el cupón.');
      return;
    }

    setCouponForm({
      code: '',
      type: 'percent',
      value: 15,
      validFrom: '2026-01-01',
      validTo: '2027-12-31'
    });
  };

  const handleCouponDelete = async (couponId: string) => {
    try {
      await deleteCoupon(couponId);
      setAdminMessage('Cupón eliminado de Supabase.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo eliminar el cupón.');
    }
  };

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.productId) return;

    const linkedP = products.find(p => p.id === bannerForm.productId);
    const newBanner: HeroBanner = {
      id: `bnr-${Date.now()}`,
      title: bannerForm.title.toUpperCase(),
      subtitle: bannerForm.subtitle || '',
      image: bannerForm.image || linkedP?.images[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600',
      productId: bannerForm.productId,
      tag: bannerForm.tag || 'EDICIÓN ESPECIAL',
      active: true
    };

    void addBanner(newBanner).then(() => {
      setAdminMessage('Banner guardado en Supabase.');
    }).catch(error => {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo guardar el banner.');
    });
    setBannerForm({
      title: '',
      subtitle: '',
      image: '',
      productId: '',
      tag: 'EDICIÓN ESPECIAL'
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Agrega las variables de Supabase antes de iniciar sesión.');
      return;
    }

    setAuthError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginForm.email.trim(),
      password: loginForm.password
    });
    if (error) {
      setAuthError(`No se pudo iniciar sesión: ${error.message}`);
      return;
    }

    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (roleError || !role) {
      await supabase.auth.signOut();
      setAuthError(roleError
        ? `No se pudo verificar el acceso: ${roleError.message}`
        : 'Esta cuenta no tiene permisos de administrador.');
      return;
    }

    setIsAuthenticated(true);
    setLoginForm({ email: '', password: '' });
  };

  const handleLogout = async () => {
    const { error } = await supabase?.auth.signOut() ?? { error: null };
    if (error) {
      setAdminMessage(`No se pudo cerrar sesión: ${error.message}`);
      return;
    }
    setIsAuthenticated(false);
    setLoginForm({ email: '', password: '' });
    setAuthError('');
  };

  const handleInitialImport = async () => {
    setIsImporting(true);
    setAdminMessage('');
    try {
      await importInitialProducts();
      setHasImportedSeed(true);
      setAdminMessage('Catálogo inicial importado a Supabase.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo importar el catálogo.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleBannerStatusChange = async (bannerId: string, active: boolean) => {
    try {
      await updateBannerStatus(bannerId, active);
      setAdminMessage('Estado del banner guardado.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo guardar el banner.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-transparent text-white min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-neutral-900 bg-neutral-950 p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-500">Ajustes</p>
                  <h2 className="font-sans text-2xl font-black uppercase text-white">Mi cuenta</h2>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-5">
                  <div className="mb-3 flex items-center gap-2 text-amber-500">
                    <UserRound className="h-4 w-4" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Perfil</span>
                  </div>
                  <p className="text-sm text-neutral-300">Nombre: Carlos Alberto</p>
                  <p className="text-sm text-neutral-300">Correo: carlos@sneakerscollection.com</p>
                  <p className="text-sm text-neutral-300">Ciudad: Bogotá, Colombia</p>
                </div>

                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-5">
                  <div className="mb-3 flex items-center gap-2 text-amber-500">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Preguntas frecuentes</span>
                  </div>
                  <div className="space-y-2 text-sm text-neutral-300">
                    <p><span className="font-bold text-white">¿Cuánto tarda el envío?</span> De 2 a 5 días hábiles.</p>
                    <p><span className="font-bold text-white">¿Son originales?</span> Sí, todos los pares pasan por verificación.</p>
                    <p><span className="font-bold text-white">¿Puedo pagar por WhatsApp?</span> Sí, con coordinación directa.</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-900 bg-neutral-900/30 p-5">
                  <div className="mb-3 flex items-center gap-2 text-amber-500">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-[11px] font-mono uppercase tracking-[0.2em]">Contacto</span>
                  </div>
                  <a
                    href="https://wa.me/573000000000"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-xs font-bold uppercase text-white hover:bg-emerald-400"
                  >
                    Hablar por WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-900 bg-neutral-950 p-8">
              <div className="mb-5 flex items-center gap-2 text-amber-500">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-[11px] font-mono uppercase tracking-[0.25em]">Acceso admin</span>
              </div>

              <h3 className="mb-6 font-sans text-xl font-black uppercase text-white">Iniciar sesión</h3>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Correo</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm text-white outline-none focus:border-amber-500/60"
                    placeholder="admin@tudominio.com"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-500">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 p-3 text-sm text-white outline-none focus:border-amber-500/60"
                    placeholder="Contraseña"
                  />
                </div>

                {authError && (
                  <p className="text-sm text-red-400">{authError}</p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold uppercase text-neutral-950"
                >
                  Entrar al panel
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-transparent text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {(adminMessage || catalogError) && (
          <div className={`mb-5 rounded-xl border p-3 text-xs ${adminMessage.includes('No se pudo') || catalogError ? 'border-red-900 bg-red-950/30 text-red-300' : 'border-emerald-900 bg-emerald-950/30 text-emerald-300'}`}>
            {adminMessage || catalogError}
          </div>
        )}

        {/* Panel Header */}
        <div className="mb-8 border-b border-neutral-900 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-sans text-xl font-black uppercase tracking-tight text-white">Panel de Administración</h2>
              <p className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase mt-0.5">Control de Inventario, Órdenes, Cupones y Campañas</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-neutral-300 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
              Cerrar sesión
            </button>
          </div>

          {/* Sub-tab navigation bar */}
          <div className="flex flex-wrap gap-2">
            <button
              id="admin-tab-products"
              onClick={() => { setActiveTab('products'); setIsAddingNew(false); setEditingProduct(null); }}
              className={`rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'products' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Zapatillas
            </button>
            <button
              id="admin-tab-orders"
              onClick={() => { setActiveTab('orders'); }}
              className={`relative rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'orders' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Pedidos
              {orders.filter(o => o.status === 'pendiente').length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white font-mono">
                  {orders.filter(o => o.status === 'pendiente').length}
                </span>
              )}
            </button>
            <button
              id="admin-tab-coupons"
              onClick={() => { setActiveTab('coupons'); }}
              className={`rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'coupons' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Cupones
            </button>
            <button
              id="admin-tab-banners"
              onClick={() => { setActiveTab('banners'); }}
              className={`rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'banners' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Banners
            </button>
          </div>
        </div>

        {/* 1. PRODUCT INVENTORY VIEW */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* ADD/EDIT PRODUCT FORM PANEL */}
            {(isAddingNew || editingProduct) && (
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950 p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase">
                    {isAddingNew ? 'Agregar Nuevo Modelo de Calzado' : 'Editar Especificaciones de Calzado'}
                  </h3>
                  <button
                    id="admin-close-prod-form"
                    onClick={() => { setIsAddingNew(false); setEditingProduct(null); }}
                    className="rounded-lg bg-neutral-900 p-1.5 text-neutral-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Nombre Comercial *</label>
                    <input
                      type="text"
                      required
                      value={prodForm.name}
                      onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Código SKU *</label>
                    <input
                      type="text"
                      required
                      value={prodForm.sku}
                      onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Casa / Marca *</label>
                    <select
                      value={prodForm.brandId}
                      onChange={(e) => setProdForm({ ...prodForm, brandId: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none cursor-pointer focus:border-amber-500/50"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Descripción de Introducción *</label>
                    <input
                      type="text"
                      required
                      value={prodForm.description}
                      onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Historia / Storytelling del Calzado *</label>
                    <textarea
                      rows={3}
                      required
                      value={prodForm.history}
                      onChange={(e) => setProdForm({ ...prodForm, history: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Precio Base (COP) *</label>
                    <input
                      type="number"
                      required
                      value={prodForm.basePrice}
                      onChange={(e) => setProdForm({ ...prodForm, basePrice: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Descuento (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={prodForm.discount}
                      onChange={(e) => setProdForm({ ...prodForm, discount: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Color principal</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={prodForm.colors?.[0]?.hex ?? '#000000'}
                        onChange={(e) => setProdForm({ ...prodForm, colors: [{ name: prodForm.colors?.[0]?.name ?? '', hex: e.target.value }] })}
                        className="h-[42px] w-12 shrink-0 cursor-pointer rounded-xl border border-neutral-800 bg-neutral-900/50 p-1"
                        title="Elegir color"
                      />
                      <input
                        type="text"
                        placeholder="Ej: Negro / Rojo"
                        value={prodForm.colors?.[0]?.name ?? ''}
                        onChange={(e) => setProdForm({ ...prodForm, colors: [{ name: e.target.value, hex: prodForm.colors?.[0]?.hex ?? '#000000' }] })}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3 grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Puntuación (0 a 5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={prodForm.rating ?? 5}
                        onChange={(e) => setProdForm({ ...prodForm, rating: Math.min(5, Math.max(0, Number(e.target.value))) })}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Tallas disponibles (EU, separadas por coma) *</label>
                    <input
                      type="text"
                      placeholder="Ej: 38, 39, 40, 41, 42, 43"
                      value={listText.sizes}
                      onChange={(e) => setListText({ ...listText, sizes: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div className="sm:col-span-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Materiales (opcional, separados por coma)</label>
                      <input
                        type="text"
                        placeholder="Ej: Cuero, Gamuza, Suela de goma"
                        value={listText.materials}
                        onChange={(e) => setListText({ ...listText, materials: e.target.value })}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Tecnologías (opcional, separadas por coma)</label>
                      <input
                        type="text"
                        placeholder="Ej: Air, Boost, Gore-Tex"
                        value={listText.technologies}
                        onChange={(e) => setListText({ ...listText, technologies: e.target.value })}
                        className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Fotos del producto (máx. 10) *</label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingImages(true);
                      }}
                      onDragLeave={() => setIsDraggingImages(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingImages(false);
                        handleImageFiles(e.dataTransfer.files);
                      }}
                      className={`rounded-2xl border border-dashed p-4 transition-all ${isDraggingImages ? 'border-amber-500 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900/40'}`}
                    >
                      <div className="flex flex-col items-center justify-center gap-3 text-center">
                        <div className="text-xs text-neutral-400">
                          {isUploadingImages ? 'Subiendo fotos a Supabase...' : 'Arrastra y suelta aquí tus fotos o busca desde tu escritorio'}
                        </div>
                        <label className={`inline-flex cursor-pointer rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[10px] font-bold uppercase text-neutral-950 ${isUploadingImages ? 'pointer-events-none opacity-50' : ''}`}>
                          {isUploadingImages ? 'Subiendo...' : 'Buscar fotos'}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files) handleImageFiles(e.target.files);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {prodForm.images && prodForm.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        {prodForm.images.map((image, index) => (
                          <div key={`${image}-${index}`} className="relative">
                            <img
                              src={image}
                              alt={`producto ${index + 1}`}
                              className="h-20 w-full rounded-xl object-cover border border-neutral-800 bg-neutral-900"
                            />
                            <button
                              type="button"
                              onClick={() => setProdForm(prev => ({
                                ...prev,
                                images: (prev.images || []).filter((_, i) => i !== index)
                              }))}
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Badges indicators toggles */}
                  <div className="sm:col-span-3 grid grid-cols-1 gap-3 border-t border-neutral-900 pt-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isLimited}
                        onChange={(e) => setProdForm({ ...prodForm, isLimited: e.target.checked })}
                        className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs text-neutral-300 font-sans">Edición Limitada <span className="text-neutral-500">(La casa de los sneakers)</span></span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isBestSeller}
                        onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                        className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs text-neutral-300 font-sans">Top Ventas <span className="text-neutral-500">(Más vendidos)</span></span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isTrending}
                        onChange={(e) => setProdForm({ ...prodForm, isTrending: e.target.checked })}
                        className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs text-neutral-300 font-sans">Tendencia <span className="text-neutral-500">(Recomendaciones)</span></span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodForm.isTopRated ?? false}
                        onChange={(e) => setProdForm({ ...prodForm, isTopRated: e.target.checked })}
                        className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0"
                      />
                      <span className="text-xs text-neutral-300 font-sans">Top rating <span className="text-neutral-500">(Top rating y Mejor calificados)</span></span>
                    </label>
                  </div>

                  <div className="sm:col-span-3 pt-3 flex justify-end">
                    <button
                      id="admin-submit-prod-btn"
                      type="submit"
                      disabled={isUploadingImages}
                      className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-neutral-950 shadow-lg"
                    >
                      GUARDAR REFERENCIA DE SNEAKER
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* PRODUCT TABLE LIST */}
            <div className="flex justify-between items-center">
              <h3 className="font-sans text-md font-bold text-white uppercase">Zapatillas en Catálogo ({products.length})</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  id="admin-import-initial-products"
                  type="button"
                  onClick={handleInitialImport}
                  disabled={isImporting || hasImportedSeed || !isSupabaseConfigured}
                  className="rounded-full border border-amber-500/40 px-4 py-2 text-[10px] font-bold uppercase text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {hasImportedSeed ? 'CATÁLOGO INICIAL IMPORTADO' : isImporting ? 'IMPORTANDO...' : 'IMPORTAR PRODUCTOS INICIALES'}
                </button>
                <button
                  id="admin-add-prod-btn"
                  onClick={handleAddNewProdClick}
                  className="flex items-center space-x-1.5 rounded-full bg-white text-neutral-950 px-4 py-2 text-xs font-bold"
                >
                  <Plus className="h-4 w-4" />
                  <span>NUEVA REFERENCIA</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full min-w-[700px] text-left text-xs text-neutral-400 font-sans">
                <thead className="bg-neutral-900 text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-b border-neutral-900">
                  <tr>
                    <th className="p-4">Visual</th>
                    <th className="p-4">Modelo</th>
                    <th className="p-4">SKU / Marca</th>
                    <th className="p-4">Precio Real</th>
                    <th className="p-4">Tags</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="p-4">
                        <img src={p.images[0]} alt="" className="h-10 w-10 object-contain rounded bg-neutral-900 p-1" referrerPolicy="no-referrer" />
                      </td>
                      <td className="p-4 font-bold text-white truncate max-w-[200px]">{p.name}</td>
                      <td className="p-4 font-mono">
                        <p>{p.sku}</p>
                        <p className="text-[10px] text-amber-500 uppercase font-semibold">{p.brandId}</p>
                      </td>
                      <td className="p-4 font-mono text-white">
                        <p>{formatPrice(p.basePrice * (1 - p.discount / 100))}</p>
                        {p.discount > 0 && <p className="text-[10px] text-neutral-500 line-through">{formatPrice(p.basePrice)}</p>}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          {p.isLimited && <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-500 uppercase">LTD</span>}
                          {p.isBestSeller && <span className="rounded bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 text-[8px] font-bold text-blue-400 uppercase">BEST</span>}
                          {p.isTrending && <span className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[8px] font-bold text-purple-400 uppercase">TREND</span>}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2.5">
                          <button
                            id={`admin-edit-prod-${p.id}`}
                            onClick={() => handleEditProdClick(p)}
                            className="text-neutral-400 hover:text-amber-500"
                          >
                            <Edit3 className="h-4.5 w-4.5" />
                          </button>
                          <button
                            id={`admin-delete-prod-${p.id}`}
                            onClick={() => {
                              if (confirm('¿Está seguro de eliminar esta zapatilla del catálogo?')) {
                                void deleteProduct(p.id).then(() => {
                                  setAdminMessage('Producto eliminado de Supabase.');
                                }).catch(error => {
                                  setAdminMessage(error instanceof Error ? error.message : 'No se pudo eliminar el producto.');
                                });
                              }
                            }}
                            className="text-neutral-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* 2. ORDERS LOG BOOK VIEW */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h3 className="font-sans text-md font-bold text-white uppercase">Registro de Órdenes ({orders.length})</h3>
            
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map(order => (
                  <div
                    id={`admin-order-row-${order.id}`}
                    key={order.id}
                    className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-5 space-y-4"
                  >
                    {/* Header info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-neutral-900 pb-3 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-black text-amber-500">#{order.id}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{order.createdAt}</span>
                      </div>
                      
                      {/* Order status dropdown */}
                      <div className="flex items-center space-x-2.5">
                        <span className="text-[10px] font-mono uppercase text-neutral-500">Estado</span>
                        <select
                          id={`admin-order-status-select-${order.id}`}
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                          className={`rounded-lg border px-3 py-1 text-xs font-bold font-mono outline-none cursor-pointer ${order.status === 'pendiente' ? 'border-yellow-600 bg-yellow-600/10 text-yellow-500' : order.status === 'completado' ? 'border-emerald-600 bg-emerald-600/10 text-emerald-500' : 'border-red-600 bg-red-600/10 text-red-500'}`}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    {/* Client & Items grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      {/* Client parameters */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase text-neutral-500">Destinatario y Envío</p>
                        <p className="font-bold text-white">{order.customerName}</p>
                        <p className="font-mono text-neutral-400">Tel: {order.customerPhone}</p>
                        <p className="font-mono text-neutral-400">Mail: {order.customerEmail}</p>
                        <p className="text-neutral-400">Dirección: {order.address}, {order.city}</p>
                      </div>

                      {/* Items pre-ordered */}
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase text-neutral-500">Calzado Solicitado</p>
                        <div className="space-y-1 bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-neutral-400">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate max-w-[200px]">{item.productName} (EU {item.size})</span>
                              <span>x{item.quantity} - {formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-neutral-900 pt-1.5 mt-1.5 text-xs text-white font-black">
                            <span>TOTAL DE ORDEN</span>
                            <span>{formatPrice(order.totalPrice)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <div id="admin-orders-empty" className="text-center py-20 border border-neutral-900 rounded-2xl bg-neutral-900/10">
                <ShoppingBag className="mx-auto h-10 w-10 text-neutral-600" />
                <h3 className="mt-4 text-sm font-bold text-white uppercase">Sin órdenes registradas</h3>
                <p className="mt-1 text-xs text-neutral-500">Las compras generadas aparecerán registradas aquí.</p>
              </div>
            )}
          </div>
        )}

        {/* 3. ACTIVE COUPONS MANAGEMENT VIEW */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Add coupon Form (5 columns) */}
            <div className="lg:col-span-5 rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4 self-start">
              <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase">Habilitar Nuevo Cupón</h3>
              
              <form onSubmit={handleCouponSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Código Promocional *</label>
                  <input
                    id="admin-coupon-code"
                    type="text"
                    required
                    placeholder="Ej. SNEAKER30"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none uppercase focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Tipo de Descuento</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none cursor-pointer focus:border-amber-500/50"
                    >
                      <option value="percent">Porcentaje (%)</option>
                      <option value="fixed">Fijo (Moneda COP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Valor de Descuento *</label>
                    <input
                      id="admin-coupon-value"
                      type="number"
                      required
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <button
                  id="admin-coupon-submit-btn"
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-neutral-950 shadow-lg"
                >
                  HABILITAR CÓDIGO
                </button>
              </form>
            </div>

            {/* Right: Coupon lists (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-sans text-md font-bold text-white uppercase">Cupones de Descuento Activos</h3>
              
              <div className="space-y-3">
                {coupons.map(cpn => (
                  <div
                    id={`admin-coupon-row-${cpn.id}`}
                    key={cpn.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-900 bg-neutral-900/10 p-4 font-mono text-xs text-neutral-400"
                  >
                    <div className="flex items-center space-x-3">
                      <Tag className="h-5 w-5 text-amber-500" />
                      <div>
                        <p className="font-bold text-white text-sm">{cpn.code}</p>
                        <p className="text-[10px] text-neutral-500">
                          Válido: {cpn.validFrom} al {cpn.validTo}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-emerald-500 font-bold">
                        {cpn.type === 'percent' ? `-${cpn.value}%` : `-$${cpn.value.toLocaleString('es-CO')}`}
                      </span>
                      <button
                        id={`admin-delete-coupon-${cpn.id}`}
                        onClick={() => void handleCouponDelete(cpn.id)}
                        className="text-neutral-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. ACTIVE BANNERS MANAGEMENT VIEW */}
        {activeTab === 'banners' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: Add Banner Form (5 columns) */}
            <div className="lg:col-span-5 rounded-2xl border border-neutral-900 bg-neutral-950 p-6 space-y-4 self-start">
              <h3 className="text-xs font-mono tracking-widest text-amber-400 uppercase">Añadir Banner al Hero</h3>
              
              <form onSubmit={handleBannerSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Título de Campaña *</label>
                  <input
                    id="admin-banner-title"
                    type="text"
                    required
                    placeholder="Ej. RETRO HIGHS"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Subtítulo Descriptivo</label>
                  <input
                    id="admin-banner-sub"
                    type="text"
                    placeholder="Ej. El regreso de los clásicos de 1985."
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Tag de Resaltado</label>
                    <input
                      id="admin-banner-tag"
                      type="text"
                      placeholder="Ej. NUEVA TENDENCIA"
                      value={bannerForm.tag}
                      onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Zapatilla Enlazada *</label>
                    <select
                      value={bannerForm.productId}
                      onChange={(e) => setBannerForm({ ...bannerForm, productId: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none cursor-pointer focus:border-amber-500/50"
                    >
                      <option value="">Seleccione...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Imagen o video del banner (opcional)</label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id="admin-banner-img"
                      type="text"
                      placeholder="Dejar vacío para usar la foto del calzado, o subir un archivo"
                      value={bannerForm.image}
                      onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                    <label className={`shrink-0 cursor-pointer rounded-xl border border-amber-500/40 px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-amber-400 ${isUploadingBannerMedia ? 'pointer-events-none opacity-50' : ''}`}>
                      {isUploadingBannerMedia ? 'Subiendo…' : 'Subir imagen o video'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => {
                          void handleBannerMedia(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>

                <button
                  id="admin-banner-submit-btn"
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-bold text-neutral-950 shadow-lg"
                >
                  AÑADIR BANNER DE PORTADA
                </button>
              </form>
            </div>

            {/* Right: Banners controller lists (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="font-sans text-md font-bold text-white uppercase">Banners de Portada Activos</h3>
              
              <div className="space-y-4">
                {banners.map(bnr => (
                  <div
                    id={`admin-banner-row-${bnr.id}`}
                    key={bnr.id}
                    className="rounded-xl border border-neutral-900 bg-neutral-900/10 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-amber-500 px-2 py-0.5 text-[8px] font-bold text-neutral-950 uppercase">{bnr.tag}</span>
                        <h4 className="font-bold text-white text-xs">{bnr.title}</h4>
                      </div>
                      
                      {/* Active switch status toggle */}
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-1.5 cursor-pointer">
                          <input
                            id={`admin-banner-status-${bnr.id}`}
                            type="checkbox"
                            checked={bnr.active}
                            onChange={(e) => void handleBannerStatusChange(bnr.id, e.target.checked)}
                            className="rounded border-neutral-800 bg-neutral-900 text-amber-500 focus:ring-0"
                          />
                          <span className="text-[10px] text-neutral-400">Activo</span>
                        </label>
                        <button
                          id={`admin-delete-banner-${bnr.id}`}
                          onClick={() => void deleteBanner(bnr.id).then(() => {
                            setAdminMessage('Banner eliminado.');
                          }).catch(error => {
                            setAdminMessage(error instanceof Error ? error.message : 'No se pudo eliminar el banner.');
                          })}
                          className="text-neutral-500 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-neutral-400 font-sans">
                      <img src={bnr.image} alt="" className="h-10 w-12 object-contain bg-neutral-900 rounded p-1" referrerPolicy="no-referrer" />
                      <div>
                        <p>{bnr.subtitle}</p>
                        <p className="text-[9px] font-mono text-neutral-500 mt-0.5">Zapatilla ID: {bnr.productId}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
