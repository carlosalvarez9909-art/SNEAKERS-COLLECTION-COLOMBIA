export interface Product {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  history: string; // The storytelling paragraph for the model
  basePrice: number; // in COP (our base currency)
  discount: number; // percentage (e.g., 15 for 15% off)
  images: string[]; // array of images for gallery / 360 simulation
  colors: { name: string; hex: string }[];
  sizes: number[]; // Tallas EU (europeas) disponibles
  technologies: string[];
  isLimited: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  rating: number;
  reviewsCount: number;
  isTopRated?: boolean; // Marcado por la tienda para Top rating
  materials: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string; // Logo placeholder SVG path or unicode character representation
  story: string;
  heroImage: string;
}

export interface CartItem {
  id: string; // unique identifier (productId + selectedSize + selectedColorName)
  product: Product;
  selectedSize: number;
  selectedColor: { name: string; hex: string };
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  validFrom: string;
  validTo: string;
}

export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  productId: string;
  tag: string;
  active: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  items: {
    productId: string;
    productName: string;
    size: number;
    color: string;
    quantity: number;
    price: number;
  }[];
  totalPrice: number;
  currency: string;
  status: 'pendiente' | 'completado' | 'cancelado';
  createdAt: string;
}

export type CurrencyCode = 'COP' | 'USD' | 'EUR' | 'MXN';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  rate: number; // conversion rate from COP
  label: string;
}

export type ViewState = 
  | { type: 'home' }
  | { type: 'brand'; brandId: string }
  | { type: 'product'; productId: string }
  | {
      type: 'catalog';
      filters?: {
        brandId?: string;
        isLimited?: boolean;
        isBestSeller?: boolean;
        isTrending?: boolean;
        onSale?: boolean;
        sortBy?: 'default' | 'price-asc' | 'price-desc' | 'rating' | 'discount';
      };
    }
  | { type: 'recommendations' }
  | { type: 'about' }
  | { type: 'favorites' }
  | { type: 'checkout' }
  | { type: 'admin' };
