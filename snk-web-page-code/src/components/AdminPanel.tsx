import React, { useEffect, useState } from 'react';
import { finalUnitPrice } from '../lib/price';
import { useApp } from '../context/AppContext';
import { Product, Brand, Coupon, HeroBanner } from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { fetchTopRankings, saveTopRanking } from '../lib/catalog';
import { TOP_LISTS, type TopListId } from '../lib/productMetrics';
import { fetchAdminOrders, updateOrderFulfillment, markOrderPaid, fetchCustomers, deleteCustomer, fetchProductCosts, type AdminOrder, type RegisteredCustomer } from '../lib/catalog';
import { CustomerSignup } from './CustomerSignup';
import { 
  Settings, Database, Plus, Trash2, Edit3, Save, CheckCircle, 
  X, ShoppingBag, Tag, Sparkles, RefreshCw, AlertCircle, 
  UserRound, MessageCircle, LogOut, ShieldCheck, Download 
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { 
    products, 
    allProducts,
    refreshCatalog,
    publishProducts,
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
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'customers' | 'top' | 'coupons' | 'banners'>('products');

  // Form states - Products
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [dbOrders, setDbOrders] = useState<AdminOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
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

  // Pedidos reales guardados en Supabase (Bold y contra entrega).
  const loadOrders = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingOrders(true);
    try {
      setDbOrders(await fetchAdminOrders());
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudieron cargar los pedidos.');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    // Al entrar se cargan los pedidos (para el contador) y se refrescan al abrir la pestaña.
    if (isAuthenticated) void loadOrders();
  }, [isAuthenticated, activeTab === 'orders']);

  // Borradores y publicados: el admin ve todo el catálogo (incluye lo que no se muestra en la tienda).
  const [productFilter, setProductFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productCosts, setProductCosts] = useState<Record<string, { cost: number; supplier: string }>>({});
  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshCatalog().catch(() => undefined);
    void fetchProductCosts().then(setProductCosts);
  }, [isAuthenticated]);

  const draftCount = allProducts.filter(p => p.isPublished === false).length;
  const listedProducts = allProducts.filter(p =>
    productFilter === 'all' ? true : productFilter === 'draft' ? p.isPublished === false : p.isPublished !== false
  );
  const toggleSelected = (id: string) =>
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const changePublished = async (ids: string[], published: boolean) => {
    if (published) {
      const withoutPrice = allProducts.filter(p => ids.includes(p.id) && !(p.basePrice > 0));
      if (withoutPrice.length) {
        setAdminMessage(`No se pudo publicar: ${withoutPrice.length} producto(s) no tienen precio de venta. Edítalos y ponles precio primero.`);
        return;
      }
    }
    try {
      await publishProducts(ids, published);
      setSelectedIds([]);
      setAdminMessage(published ? `${ids.length} producto(s) publicados en la tienda.` : `${ids.length} producto(s) pasaron a borrador.`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo cambiar el estado.');
    }
  };

  // Top rankings elegidos a mano (5 por lista; una referencia solo puede estar en un top).
  const [topDraft, setTopDraft] = useState<Record<TopListId, string[]>>({ sold: [], rating: [], deals: [], new: [] });
  const [savingTop, setSavingTop] = useState<TopListId | null>(null);
  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'top') return;
    void fetchTopRankings().then(data =>
      setTopDraft({ sold: data.sold ?? [], rating: data.rating ?? [], deals: data.deals ?? [], new: data.new ?? [] })
    );
  }, [isAuthenticated, activeTab]);

  const setTopSlot = (list: TopListId, slot: number, productId: string) => {
    setTopDraft(prev => {
      const next = [...prev[list]];
      while (next.length < 5) next.push('');
      next[slot] = productId;
      return { ...prev, [list]: next };
    });
  };

  const saveTop = async (list: TopListId, clear = false) => {
    setSavingTop(list);
    try {
      const ids = clear ? [] : topDraft[list].filter(Boolean);
      await saveTopRanking(list, ids);
      if (clear) setTopDraft(prev => ({ ...prev, [list]: [] }));
      setAdminMessage(clear ? 'Top vuelto a automático.' : 'Top guardado. Ya se ve en Recomendaciones.');
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo guardar el top.');
    } finally {
      setSavingTop(null);
    }
  };

  // Clientes registrados en la Familia Sneakers Collection (tabla customers).
  const [customers, setCustomers] = useState<RegisteredCustomer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const loadCustomers = async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingCustomers(true);
    try {
      setCustomers(await fetchCustomers());
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudieron cargar los clientes.');
    } finally {
      setIsLoadingCustomers(false);
    }
  };
  useEffect(() => {
    if (isAuthenticated && activeTab === 'customers') void loadCustomers();
  }, [isAuthenticated, activeTab]);

  const removeCustomer = async (customer: RegisteredCustomer) => {
    if (!window.confirm(`¿Borrar a ${customer.name} de los clientes registrados?`)) return;
    try {
      await deleteCustomer(customer.id);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo borrar el cliente.');
    }
  };

  const exportCustomers = () => {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ['Nombre', 'Correo', 'Teléfono', 'Ciudad', 'Fecha de registro'],
      ...customers.map(c => [c.name, c.email, c.phone, c.city ?? '', c.createdAt])
    ];
    const csv = '\ufeff' + rows.map(row => row.map(escape).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clientes-sneakers-collection.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const changeFulfillment = async (order: AdminOrder, fulfillment: AdminOrder['fulfillment']) => {
    try {
      await updateOrderFulfillment(order.id, fulfillment);
      setDbOrders(prev => prev.map(o => (o.id === order.id ? { ...o, fulfillment } : o)));
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.');
    }
  };

  const confirmCashPayment = async (order: AdminOrder) => {
    try {
      await markOrderPaid(order.id);
      setDbOrders(prev => prev.map(o => (o.id === order.id ? { ...o, paymentStatus: 'paid' } : o)));
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : 'No se pudo marcar como pagado.');
    }
  };

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
            <CustomerSignup />

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
              {dbOrders.filter(o => o.fulfillment === 'por_despachar' && o.paymentStatus !== 'failed').length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white font-mono">
                  {dbOrders.filter(o => o.fulfillment === 'por_despachar' && o.paymentStatus !== 'failed').length}
                </span>
              )}
            </button>
            <button
              id="admin-tab-customers"
              onClick={() => { setActiveTab('customers'); }}
              className={`rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'customers' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Clientes
            </button>
            <button
              id="admin-tab-top"
              onClick={() => { setActiveTab('top'); }}
              className={`rounded-lg px-4 py-2 text-xs font-mono tracking-wider uppercase transition-colors ${activeTab === 'top' ? 'bg-amber-500 text-neutral-950 font-bold' : 'bg-neutral-900 text-neutral-400 hover:text-white'}`}
            >
              Top
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
                    {prodForm.id && productCosts[prodForm.id] && (
                      <p className="mt-1 text-[10px] text-neutral-500">
                        Costo proveedor ({productCosts[prodForm.id].supplier}): {formatPrice(productCosts[prodForm.id].cost)}
                      </p>
                    )}
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
              <h3 className="font-sans text-md font-bold text-white uppercase">
                Zapatillas ({allProducts.length})
                {draftCount > 0 && <span className="ml-2 text-amber-400">· {draftCount} borradores</span>}
              </h3>
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

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {([['all', 'Todos'], ['draft', `Borradores (${draftCount})`], ['published', 'Publicados']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setProductFilter(key); setSelectedIds([]); }}
                    className={`rounded-full px-4 py-2 text-[10px] font-bold uppercase ${productFilter === key ? 'bg-white text-neutral-950' : 'border border-neutral-800 text-neutral-400 hover:text-white'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {selectedIds.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void changePublished(selectedIds, true)}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-[10px] font-bold uppercase text-white hover:bg-emerald-500"
                  >
                    Publicar {selectedIds.length}
                  </button>
                  <button
                    type="button"
                    onClick={() => void changePublished(selectedIds, false)}
                    className="rounded-full border border-neutral-700 px-4 py-2 text-[10px] font-bold uppercase text-neutral-300 hover:text-white"
                  >
                    Pasar a borrador
                  </button>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-neutral-900 bg-neutral-950 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full min-w-[700px] text-left text-xs text-neutral-400 font-sans">
                <thead className="bg-neutral-900 text-[10px] font-mono tracking-wider text-neutral-500 uppercase border-b border-neutral-900">
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        aria-label="Seleccionar todos"
                        checked={listedProducts.length > 0 && selectedIds.length === listedProducts.length}
                        onChange={e => setSelectedIds(e.target.checked ? listedProducts.map(p => p.id) : [])}
                        className="h-4 w-4 accent-red-600"
                      />
                    </th>
                    <th className="p-4">Visual</th>
                    <th className="p-4">Modelo</th>
                    <th className="p-4">SKU / Marca</th>
                    <th className="p-4">Precio Real</th>
                    <th className="p-4">Estado / Tags</th>
                    <th className="p-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {listedProducts.map(p => (
                    <tr key={p.id} className={`hover:bg-neutral-900/40 transition-colors ${selectedIds.includes(p.id) ? 'bg-neutral-900/60' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          aria-label={`Seleccionar ${p.name}`}
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelected(p.id)}
                          className="h-4 w-4 accent-red-600"
                        />
                      </td>
                      <td className="p-4">
                        <img src={p.images[0]} alt="" className="h-10 w-10 object-contain rounded bg-neutral-900 p-1" referrerPolicy="no-referrer" />
                      </td>
                      <td className="p-4 max-w-[220px]">
                        <p className="truncate font-bold text-white">{p.name}</p>
                        <p className="truncate text-[10px] text-neutral-500">{p.colors[0]?.name} · EU {p.sizes[0]}–{p.sizes[p.sizes.length - 1]}</p>
                      </td>
                      <td className="p-4 font-mono">
                        <p>{p.sku}</p>
                        <p className="text-[10px] text-amber-500 uppercase font-semibold">{p.brandId}</p>
                      </td>
                      <td className="p-4 font-mono text-white">
                        {p.basePrice > 0 ? <p>{formatPrice(finalUnitPrice(p.basePrice, p.discount))}</p> : <p className="font-bold text-amber-400">Sin precio</p>}
                        {productCosts[p.id] && <p className="text-[10px] text-neutral-500">Costo: {formatPrice(productCosts[p.id].cost)}</p>}
                        {p.discount > 0 && <p className="text-[10px] text-neutral-500 line-through">{formatPrice(p.basePrice)}</p>}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => void changePublished([p.id], p.isPublished === false)}
                            title={p.isPublished === false ? 'Tocar para publicar' : 'Tocar para pasar a borrador'}
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${p.isPublished === false ? 'border border-amber-500/40 text-amber-400' : 'bg-emerald-600/20 text-emerald-400'}`}
                          >
                            {p.isPublished === false ? 'Borrador' : 'Publicado'}
                          </button>
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

        {/* 2. PEDIDOS (Supabase) */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-md font-bold text-white uppercase">Pedidos ({dbOrders.length})</h3>
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="flex items-center gap-1.5 rounded-full border border-neutral-800 px-4 py-2 text-[10px] font-bold uppercase text-neutral-300 hover:text-white"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
            </div>

            {dbOrders.length > 0 ? (
              <div className="space-y-4">
                {dbOrders.map(order => (
                  <div
                    id={`admin-order-row-${order.id}`}
                    key={order.id}
                    className="rounded-2xl border border-neutral-900 bg-neutral-900/10 p-5 space-y-4"
                  >
                    <div className="flex flex-col gap-3 border-b border-neutral-900 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-black text-white">#{order.reference.slice(0, 12)}</span>
                        <span className="text-[10px] font-mono text-neutral-500">{order.createdAt}</span>
                        <span className="rounded-full border border-neutral-800 px-2 py-0.5 text-[9px] font-bold uppercase text-neutral-300">
                          {order.paymentMethod === 'bold' ? 'Bold' : 'Contra entrega'}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-600/15 text-emerald-400'
                            : order.paymentStatus === 'failed'
                              ? 'bg-red-600/15 text-red-400'
                              : 'bg-yellow-600/15 text-yellow-400'
                        }`}>
                          {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'failed' ? 'Pago fallido' : 'Pago pendiente'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.paymentMethod === 'contraentrega' && order.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => void confirmCashPayment(order)}
                            className="rounded-lg border border-emerald-700 px-3 py-1 text-[10px] font-bold uppercase text-emerald-400 hover:bg-emerald-700/10"
                          >
                            Marcar pagado
                          </button>
                        )}
                        <select
                          id={`admin-order-status-select-${order.id}`}
                          value={order.fulfillment}
                          onChange={(e) => void changeFulfillment(order, e.target.value as AdminOrder['fulfillment'])}
                          className="cursor-pointer rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1 text-xs font-bold text-white outline-none"
                        >
                          <option value="por_despachar">Por despachar</option>
                          <option value="despachado">Despachado</option>
                          <option value="entregado">Entregado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase text-neutral-500">Cliente y envío</p>
                        <p className="font-bold text-white">{order.customerName}</p>
                        <p className="font-mono text-neutral-400">
                          Tel: <a className="hover:underline" href={`https://wa.me/57${order.customerPhone.replace(/\D/g, '').replace(/^57/, '')}`} target="_blank" rel="noreferrer">{order.customerPhone}</a>
                        </p>
                        <p className="font-mono text-neutral-400">Mail: {order.customerEmail}</p>
                        <p className="text-neutral-400">Dirección: {order.address}, {order.city}</p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase text-neutral-500">Productos</p>
                        <div className="space-y-1 bg-neutral-950 p-2.5 rounded-lg font-mono text-[11px] text-neutral-400">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between gap-3">
                              <span className="truncate">{item.productName} (EU {item.size}, {item.color})</span>
                              <span className="shrink-0">x{item.quantity} · {formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between border-t border-neutral-900 pt-1.5 mt-1.5 text-xs text-white font-black">
                            <span>TOTAL</span>
                            <span>{formatPrice(order.total)}</span>
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

        {/* TOP RANKINGS MANUAL */}
        {activeTab === 'top' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-sans text-md font-bold text-white uppercase">Top rankings</h3>
              <p className="mt-1 text-xs text-neutral-500">
                Elige hasta 5 referencias por top, en orden. Una referencia solo puede estar en un top. Los puestos vacíos se completan solos.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {TOP_LISTS.map(list => {
                const slots = [...topDraft[list.id]];
                while (slots.length < 5) slots.push('');
                const usedElsewhere = new Set(
                  TOP_LISTS.filter(l => l.id !== list.id).flatMap(l => topDraft[l.id]).filter(Boolean)
                );
                return (
                  <div key={list.id} className="rounded-2xl border border-neutral-900 bg-neutral-950 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-black uppercase text-white">{list.label}</h4>
                      <span className="text-[10px] uppercase text-neutral-500">{topDraft[list.id].filter(Boolean).length}/5 a mano</span>
                    </div>
                    <div className="space-y-2">
                      {slots.map((value, slot) => {
                        const selected = products.find(p => p.id === value);
                        const takenHere = new Set(slots.filter((id, i) => id && i !== slot));
                        return (
                          <div key={slot} className="flex items-center gap-3">
                            <span className="w-12 shrink-0 text-[10px] font-black uppercase text-red-500">Top {slot + 1}</span>
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-900">
                              {selected && <img src={selected.images[0]} alt="" className="max-h-9 max-w-9 object-contain" />}
                            </div>
                            <select
                              value={value}
                              onChange={e => setTopSlot(list.id, slot, e.target.value)}
                              className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-xs text-white outline-none focus:border-red-500"
                            >
                              <option value="">Automático</option>
                              {products
                                .filter(p => p.id === value || (!usedElsewhere.has(p.id) && !takenHere.has(p.id)))
                                .map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => void saveTop(list.id, true)}
                        disabled={savingTop === list.id}
                        className="rounded-full border border-neutral-800 px-4 py-2 text-[10px] font-bold uppercase text-neutral-400 hover:text-white disabled:opacity-50"
                      >
                        Volver a automático
                      </button>
                      <button
                        type="button"
                        onClick={() => void saveTop(list.id)}
                        disabled={savingTop === list.id}
                        className="rounded-full bg-red-600 px-4 py-2 text-[10px] font-bold uppercase text-white hover:bg-red-500 disabled:opacity-50"
                      >
                        {savingTop === list.id ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CLIENTES REGISTRADOS */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-sans text-md font-bold text-white uppercase">Clientes registrados ({customers.length})</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportCustomers}
                  disabled={customers.length === 0}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-800 px-4 py-2 text-[10px] font-bold uppercase text-neutral-300 hover:text-white disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={() => void loadCustomers()}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-800 px-4 py-2 text-[10px] font-bold uppercase text-neutral-300 hover:text-white"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

            {customers.length > 0 ? (
              <div className="space-y-3">
                {customers.map(customer => (
                  <div key={customer.id} className="flex flex-col gap-3 rounded-2xl border border-neutral-900 bg-neutral-950 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-bold text-white">
                        <UserRound className="h-4 w-4 shrink-0 text-neutral-500" />
                        <span className="truncate">{customer.name}</span>
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-400">{customer.email}</p>
                      <p className="text-xs text-neutral-500">
                        {customer.phone}{customer.city ? ` · ${customer.city}` : ''} · {customer.createdAt}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, '').replace(/^(?!57)(3\d{9})$/, '57$1')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-[10px] font-bold uppercase text-white hover:bg-emerald-500"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                      <button
                        type="button"
                        onClick={() => void removeCustomer(customer)}
                        title="Borrar cliente"
                        className="rounded-full border border-neutral-800 p-2 text-neutral-400 hover:border-red-800 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-neutral-900 bg-neutral-950 p-8 text-center text-sm text-neutral-500">
                {isLoadingCustomers ? 'Cargando clientes…' : 'Todavía no hay clientes registrados.'}
              </p>
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
