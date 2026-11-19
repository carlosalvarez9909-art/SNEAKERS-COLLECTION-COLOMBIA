import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, Brand, CartItem, Coupon, Review, HeroBanner, Order, 
  CurrencyCode, CurrencyConfig, ViewState 
} from '../types';
import { 
  INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_COUPONS, 
  INITIAL_REVIEWS, INITIAL_HERO_BANNERS 
} from '../data/initialData';
import {
  fetchCatalog,
  importInitialCatalog,
  removeBanner as removeBannerFromDatabase,
  removeBrand as removeBrandFromDatabase,
  removeCoupon as removeCouponFromDatabase,
  removeProduct as removeProductFromDatabase,
  upsertBanner,
  upsertBrand,
  upsertCoupon,
  upsertProduct
} from '../lib/catalog';

export interface AppContextType {
  products: Product[];
  brands: Brand[];
  isCatalogLoading: boolean;
  catalogError: string;
  coupons: Coupon[];
  reviews: Review[];
  banners: HeroBanner[];
  orders: Order[];
  cart: CartItem[];
  favorites: string[];
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  activeView: ViewState;
  searchQuery: string;
  activeCoupon: Coupon | null;
  
  // Navigation actions
  navigateTo: (view: ViewState) => void;
  setSearchQuery: (query: string) => void;
  
  // Cart actions
  addToCart: (product: Product, size: number, color: { name: string; hex: string }, quantity?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  
  // Favorite actions
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
  
  
  // Currency actions
  setCurrency: (code: CurrencyCode) => void;
  formatPrice: (priceInCOP: number) => string;
  
  // Coupon actions
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  
  // Order actions
  placeOrder: (customer: { name: string; phone: string; email: string; address: string; city: string }) => Order;
  
  // Admin actions
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  importInitialProducts: () => Promise<void>;
  addBrand: (brand: Brand) => Promise<void>;
  deleteBrand: (brandId: string) => Promise<void>;
  addCoupon: (coupon: Coupon) => Promise<void>;
  deleteCoupon: (couponId: string) => Promise<void>;
  addBanner: (banner: HeroBanner) => Promise<void>;
  deleteBanner: (bannerId: string) => Promise<void>;
  updateBannerStatus: (bannerId: string, active: boolean) => Promise<void>;
  updateOrderStatus: (orderId: string, status: 'pendiente' | 'completado' | 'cancelado') => void;
  addReview: (productId: string, customerName: string, rating: number, comment: string) => void;
}

const CURRENCY_MAP: Record<CurrencyCode, CurrencyConfig> = {
  COP: { code: 'COP', symbol: '$', rate: 1, label: 'COP ($)' },
  USD: { code: 'USD', symbol: 'US$', rate: 0.00025, label: 'USD ($)' }, // $1 USD = $3157 COP
  EUR: { code: 'EUR', symbol: '€', rate: 0.00023, label: 'EUR (€)' },  // €1 EUR = $3633 COP
  MXN: { code: 'MXN', symbol: 'Mex$', rate: 0.0042, label: 'MXN ($)' }  // $1 MXN = $183 COP
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global States
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>(INITIAL_HERO_BANNERS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [currency, setCurrencyState] = useState<CurrencyCode>('COP');
  const [activeView, setActiveView] = useState<ViewState>({ type: 'home' });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  // The local seed is a fallback; configured stores always load the current database catalog.
  useEffect(() => {
    const localCoupons = localStorage.getItem('snk_coupons');
    const localReviews = localStorage.getItem('snk_reviews');
    const localOrders = localStorage.getItem('snk_orders');
    const localFavorites = localStorage.getItem('snk_favorites');
    const localCart = localStorage.getItem('snk_cart');
    const localCurrency = localStorage.getItem('snk_currency');

    setCoupons(localCoupons ? JSON.parse(localCoupons) : INITIAL_COUPONS);
    setReviews(localReviews ? JSON.parse(localReviews) : INITIAL_REVIEWS);
    setOrders(localOrders ? JSON.parse(localOrders) : []);
    setFavorites(localFavorites ? JSON.parse(localFavorites) : []);
    setCart(localCart ? JSON.parse(localCart) : []);
    setCurrencyState((localCurrency as CurrencyCode) || 'COP');

    let isMounted = true;
    fetchCatalog()
      .then(catalog => {
        if (!isMounted) return;
        setProducts(catalog.products);
        setBrands(catalog.brands);
        setBanners(catalog.banners);
        setCoupons(catalog.coupons);
        setReviews(catalog.reviews);
        setCatalogError('');
      })
      .catch(error => {
        console.error('No se pudo cargar el catálogo de Supabase:', error);
        if (isMounted) setCatalogError('No se pudo cargar el catálogo de Supabase. Se muestran los datos iniciales.');
      })
      .finally(() => {
        if (isMounted) setIsCatalogLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to LocalStorage helpers
  const saveToLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const navigateTo = (view: ViewState) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart Management
  const addToCart = (product: Product, size: number, color: { name: string; hex: string }, quantity = 1) => {
    const itemId = `${product.id}-${size}-${color.name.replace(/\s+/g, '')}`;
    const existingIndex = cart.findIndex(item => item.id === itemId);

    let newCart: CartItem[];
    if (existingIndex > -1) {
      newCart = [...cart];
      newCart[existingIndex].quantity += quantity;
    } else {
      newCart = [...cart, { id: itemId, product, selectedSize: size, selectedColor: color, quantity }];
    }
    setCart(newCart);
    saveToLocal('snk_cart', newCart);
  };

  const removeFromCart = (cartItemId: string) => {
    const newCart = cart.filter(item => item.id !== cartItemId);
    setCart(newCart);
    saveToLocal('snk_cart', newCart);
  };

  const updateCartQuantity = (cartItemId: string, qty: number) => {
    const newCart = cart.map(item => {
      if (item.id === cartItemId) {
        return { ...item, quantity: Math.max(1, qty) };
      }
      return item;
    });
    setCart(newCart);
    saveToLocal('snk_cart', newCart);
  };

  const clearCart = () => {
    setCart([]);
    saveToLocal('snk_cart', []);
    setActiveCoupon(null);
  };

  // Favorites Management
  const toggleFavorite = (productId: string) => {
    let newFavorites: string[];
    if (favorites.includes(productId)) {
      newFavorites = favorites.filter(id => id !== productId);
    } else {
      newFavorites = [...favorites, productId];
    }
    setFavorites(newFavorites);
    saveToLocal('snk_favorites', newFavorites);
  };

  const isFavorite = (productId: string) => favorites.includes(productId);


  // Currency Converter
  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    localStorage.setItem('snk_currency', code);
  };

  const formatPrice = (priceInCOP: number) => {
    const config = CURRENCY_MAP[currency];
    const converted = priceInCOP * config.rate;
    
    if (currency === 'COP') {
      return `${config.symbol} ${Math.round(converted).toLocaleString('es-CO')}`;
    } else {
      return `${config.symbol}${converted.toFixed(2)}`;
    }
  };

  // Coupon application
  const applyCoupon = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code === cleanCode);
    
    if (!coupon) {
      return { success: false, message: 'Cupón no encontrado' };
    }
    
    const today = new Date().toISOString().split('T')[0];
    if (today < coupon.validFrom || today > coupon.validTo) {
      return { success: false, message: 'Este cupón ha expirado' };
    }

    setActiveCoupon(coupon);
    return { success: true, message: 'Cupón aplicado con éxito' };
  };

  const removeCoupon = () => {
    setActiveCoupon(null);
  };

  // Order Placement
  const placeOrder = (customer: { name: string; phone: string; email: string; address: string; city: string }) => {
    const discountAmount = activeCoupon
      ? activeCoupon.type === 'percent'
        ? cart.reduce((sum, item) => sum + (item.product.basePrice * (1 - item.product.discount / 100)) * item.quantity, 0) * (activeCoupon.value / 100)
        : activeCoupon.value
      : 0;

    const subtotal = cart.reduce((sum, item) => {
      const discountedUnit = item.product.basePrice * (1 - item.product.discount / 100);
      return sum + discountedUnit * item.quantity;
    }, 0);

    const total = Math.max(0, subtotal - discountAmount);

    const newOrder: Order = {
      id: `SNK-${Date.now().toString().slice(-6)}`,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      address: customer.address,
      city: customer.city,
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        size: item.selectedSize,
        color: item.selectedColor.name,
        quantity: item.quantity,
        price: item.product.basePrice * (1 - item.product.discount / 100)
      })),
      totalPrice: total,
      currency,
      status: 'pendiente',
      createdAt: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveToLocal('snk_orders', updatedOrders);
    return newOrder;
  };

  // Admin Actions
  // Garantiza que la marca exista en Supabase antes de guardar un producto de esa marca.
  const ensureBrandSaved = async (brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (brand) await upsertBrand(brand);
  };

  const addProduct = async (product: Product) => {
    await ensureBrandSaved(product.brandId);
    await upsertProduct(product);
    const updated = [product, ...products];
    setProducts(updated);
  };

  const updateProduct = async (updatedProd: Product) => {
    await ensureBrandSaved(updatedProd.brandId);
    await upsertProduct(updatedProd);
    const updated = products.map(p => p.id === updatedProd.id ? updatedProd : p);
    setProducts(updated);
  };

  const deleteProduct = async (productId: string) => {
    await removeProductFromDatabase(productId);
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);
    setBanners(banners.filter(banner => banner.productId !== productId));
    setReviews(reviews.filter(review => review.productId !== productId));
    
    // Clear product from cart and favorites
    const newCart = cart.filter(item => item.product.id !== productId);
    setCart(newCart);
    saveToLocal('snk_cart', newCart);
    
    const newFavorites = favorites.filter(id => id !== productId);
    setFavorites(newFavorites);
    saveToLocal('snk_favorites', newFavorites);
  };

  const importInitialProducts = async () => {
    await importInitialCatalog();
    const catalog = await fetchCatalog();
    setProducts(catalog.products);
    setBrands(catalog.brands);
    setBanners(catalog.banners);
    setCoupons(catalog.coupons);
    setReviews(catalog.reviews);
    setCatalogError('');
  };

  const addBrand = async (brand: Brand) => {
    await upsertBrand(brand);
    const updated = [...brands, brand];
    setBrands(updated);
  };

  const deleteBrand = async (brandId: string) => {
    await removeBrandFromDatabase(brandId);
    const updated = brands.filter(b => b.id !== brandId);
    setBrands(updated);
  };

  const addCoupon = async (coupon: Coupon) => {
    await upsertCoupon(coupon);
    const updated = [coupon, ...coupons];
    setCoupons(updated);
  };

  const deleteCoupon = async (couponId: string) => {
    await removeCouponFromDatabase(couponId);
    const updated = coupons.filter(c => c.id !== couponId);
    setCoupons(updated);
  };

  const addBanner = async (banner: HeroBanner) => {
    await upsertBanner(banner);
    const updated = [banner, ...banners];
    setBanners(updated);
  };

  const deleteBanner = async (bannerId: string) => {
    await removeBannerFromDatabase(bannerId);
    const updated = banners.filter(b => b.id !== bannerId);
    setBanners(updated);
  };

  const updateBannerStatus = async (bannerId: string, active: boolean) => {
    const banner = banners.find(item => item.id === bannerId);
    if (!banner) throw new Error('No se encontró el banner.');
    await upsertBanner({ ...banner, active });
    const updated = banners.map(b => b.id === bannerId ? { ...b, active } : b);
    setBanners(updated);
  };

  const updateOrderStatus = (orderId: string, status: 'pendiente' | 'completado' | 'cancelado') => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status } : o);
    setOrders(updated);
    saveToLocal('snk_orders', updated);
  };

  const addReview = (productId: string, customerName: string, rating: number, comment: string) => {
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId,
      customerName,
      rating,
      comment,
      createdAt: 'Justo ahora'
    };
    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    saveToLocal('snk_reviews', updatedReviews);

    // Update product average rating
    const prodReviews = updatedReviews.filter(r => r.productId === productId);
    const avgRating = prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length;
    
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return {
          ...p,
          rating: Number(avgRating.toFixed(2)),
          reviewsCount: prodReviews.length
        };
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  return (
    <AppContext.Provider value={{
      products,
      brands,
      isCatalogLoading,
      catalogError,
      coupons,
      reviews,
      banners,
      orders,
      cart,
      favorites,
      currency,
      currencyConfig: CURRENCY_MAP[currency],
      activeView,
      searchQuery,
      activeCoupon,
      
      navigateTo,
      setSearchQuery,
      
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      
      toggleFavorite,
      isFavorite,
      
      
      setCurrency,
      formatPrice,
      
      applyCoupon,
      removeCoupon,
      
      placeOrder,
      
      addProduct,
      updateProduct,
      deleteProduct,
      importInitialProducts,
      addBrand,
      deleteBrand,
      addCoupon,
      deleteCoupon,
      addBanner,
      deleteBanner,
      updateBannerStatus,
      updateOrderStatus,
      addReview
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
