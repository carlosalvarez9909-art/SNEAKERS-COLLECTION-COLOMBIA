import type { Brand, Coupon, HeroBanner, Product, Review } from '../types';
import {
  INITIAL_BRANDS,
  INITIAL_COUPONS,
  INITIAL_HERO_BANNERS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS
} from '../data/initialData';
import { supabase } from './supabase';

type ProductRow = {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  history: string;
  base_price: number;
  discount: number;
  images: string[];
  colors: Product['colors'];
  sizes: number[];
  technologies: string[];
  is_limited: boolean;
  is_best_seller: boolean;
  is_trending: boolean;
  is_top_rated: boolean;
  is_published?: boolean;
  rating: number;
  reviews_count: number;
  materials: string[];
};

type BrandRow = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  story: string;
  hero_image: string;
};

type BannerRow = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  product_id: string;
  tag: string;
  active: boolean;
};

type CouponRow = {
  id: string;
  code: string;
  type: Coupon['type'];
  value: number;
  valid_from: string;
  valid_to: string;
};

type ReviewRow = {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

export const toProductRow = (product: Product): ProductRow => ({
  id: product.id,
  brand_id: product.brandId,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  description: product.description,
  history: product.history,
  base_price: product.basePrice,
  discount: product.discount,
  images: product.images,
  colors: product.colors,
  sizes: product.sizes,
  technologies: product.technologies,
  is_limited: product.isLimited,
  is_best_seller: product.isBestSeller,
  is_trending: product.isTrending,
  is_top_rated: product.isTopRated ?? false,
  is_published: product.isPublished ?? true,
  rating: product.rating,
  reviews_count: product.reviewsCount,
  materials: product.materials
});

export const fromProductRow = (row: ProductRow): Product => ({
  id: row.id,
  brandId: row.brand_id,
  name: row.name,
  slug: row.slug,
  sku: row.sku,
  description: row.description,
  history: row.history,
  basePrice: Number(row.base_price),
  discount: Number(row.discount),
  images: row.images ?? [],
  colors: row.colors ?? [],
  sizes: row.sizes ?? [],
  technologies: row.technologies ?? [],
  isLimited: row.is_limited,
  isBestSeller: row.is_best_seller,
  isTrending: row.is_trending,
  isTopRated: row.is_top_rated ?? false,
  isPublished: row.is_published ?? true,
  shopifyVariants: row.shopify_variants ?? undefined,
  rating: Number(row.rating),
  reviewsCount: row.reviews_count,
  materials: row.materials ?? []
});

const toBrandRow = (brand: Brand): BrandRow => ({
  id: brand.id,
  name: brand.name,
  slug: brand.slug,
  logo: brand.logo,
  story: brand.story,
  hero_image: brand.heroImage
});

const fromBrandRow = (row: BrandRow): Brand => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logo: row.logo,
  story: row.story,
  heroImage: row.hero_image
});

const toBannerRow = (banner: HeroBanner): BannerRow => ({
  id: banner.id,
  title: banner.title,
  subtitle: banner.subtitle,
  image: banner.image,
  product_id: banner.productId,
  tag: banner.tag,
  active: banner.active
});

const fromBannerRow = (row: BannerRow): HeroBanner => ({
  id: row.id,
  title: row.title,
  subtitle: row.subtitle,
  image: row.image,
  productId: row.product_id,
  tag: row.tag,
  active: row.active
});

const toCouponRow = (coupon: Coupon): CouponRow => ({
  id: coupon.id,
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  valid_from: coupon.validFrom,
  valid_to: coupon.validTo
});

const fromCouponRow = (row: CouponRow): Coupon => ({
  id: row.id,
  code: row.code,
  type: row.type,
  value: Number(row.value),
  validFrom: row.valid_from,
  validTo: row.valid_to
});

const toReviewRow = (review: Review): ReviewRow => ({
  id: review.id,
  product_id: review.productId,
  customer_name: review.customerName,
  rating: review.rating,
  comment: review.comment,
  created_at: review.createdAt
});

const fromReviewRow = (row: ReviewRow): Review => ({
  id: row.id,
  productId: row.product_id,
  customerName: row.customer_name,
  rating: Number(row.rating),
  comment: row.comment,
  createdAt: row.created_at
});

// Las marcas de la tienda (con su logo) se muestran aunque todavía no estén en Supabase.
// Las que sí están en la base de datos mandan; solo se agregan las que falten.
const mergeWithKnownBrands = (databaseBrands: Brand[]): Brand[] => {
  const known = new Set(databaseBrands.map(brand => brand.id));
  const missing = INITIAL_BRANDS.filter(brand => !known.has(brand.id));
  return [...databaseBrands, ...missing].sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

export async function fetchCatalog() {
  if (!supabase) {
    return {
      products: INITIAL_PRODUCTS,
      brands: INITIAL_BRANDS,
      banners: INITIAL_HERO_BANNERS,
      coupons: INITIAL_COUPONS,
      reviews: INITIAL_REVIEWS
    };
  }

  const [productsResult, brandsResult, bannersResult, couponsResult, reviewsResult] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('brands').select('*').order('name'),
    supabase.from('banners').select('*').order('created_at', { ascending: false }),
    supabase.from('coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').order('created_at', { ascending: false })
  ]);

  const error = productsResult.error ?? brandsResult.error ?? bannersResult.error ??
    couponsResult.error ?? reviewsResult.error;
  if (error) throw error;

  return {
    products: (productsResult.data as ProductRow[]).map(fromProductRow),
    brands: mergeWithKnownBrands((brandsResult.data as BrandRow[]).map(fromBrandRow)),
    banners: (bannersResult.data as BannerRow[]).map(fromBannerRow),
    coupons: (couponsResult.data as CouponRow[]).map(fromCouponRow),
    reviews: (reviewsResult.data as ReviewRow[]).map(fromReviewRow)
  };
}

export async function importInitialCatalog() {
  if (!supabase) throw new Error('Configura Supabase antes de importar el catálogo.');

  const { data: importRecord, error: checkError } = await supabase
    .from('catalog_imports')
    .select('id')
    .eq('id', 'initial_catalog_v1')
    .maybeSingle();

  if (checkError) throw checkError;
  if (importRecord) throw new Error('El catálogo inicial ya fue importado.');

  const { error: brandsError } = await supabase
    .from('brands')
    .upsert(INITIAL_BRANDS.map(toBrandRow), { onConflict: 'id' });
  if (brandsError) throw brandsError;

  const { error: productsError } = await supabase
    .from('products')
    .upsert(INITIAL_PRODUCTS.map(toProductRow), { onConflict: 'id' });
  if (productsError) throw productsError;

  const { error: bannersError } = await supabase
    .from('banners')
    .upsert(INITIAL_HERO_BANNERS.map(toBannerRow), { onConflict: 'id' });
  if (bannersError) throw bannersError;

  const { error: couponsError } = await supabase
    .from('coupons')
    .upsert(INITIAL_COUPONS.map(toCouponRow), { onConflict: 'id' });
  if (couponsError) throw couponsError;

  const { error: reviewsError } = await supabase
    .from('reviews')
    .upsert(INITIAL_REVIEWS.map(toReviewRow), { onConflict: 'id' });
  if (reviewsError) throw reviewsError;

  const { error: markerError } = await supabase
    .from('catalog_imports')
    .insert({ id: 'initial_catalog_v1' });
  if (markerError) throw markerError;
}

export async function upsertProduct(product: Product) {
  if (!supabase) throw new Error('Configura Supabase para guardar productos.');
  const { error } = await supabase.from('products').upsert(toProductRow(product));
  if (error) throw error;
}

export async function removeProduct(productId: string) {
  if (!supabase) throw new Error('Configura Supabase para borrar productos.');
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

export async function upsertBrand(brand: Brand) {
  if (!supabase) throw new Error('Configura Supabase para guardar marcas.');
  const { error } = await supabase.from('brands').upsert(toBrandRow(brand));
  if (error) throw error;
}

export async function removeBrand(brandId: string) {
  if (!supabase) throw new Error('Configura Supabase para borrar marcas.');
  const { error } = await supabase.from('brands').delete().eq('id', brandId);
  if (error) throw error;
}

export async function upsertBanner(banner: HeroBanner) {
  if (!supabase) throw new Error('Configura Supabase para guardar banners.');
  const { error } = await supabase.from('banners').upsert(toBannerRow(banner));
  if (error) throw error;
}

export async function removeBanner(bannerId: string) {
  if (!supabase) throw new Error('Configura Supabase para borrar banners.');
  const { error } = await supabase.from('banners').delete().eq('id', bannerId);
  if (error) throw error;
}

export async function upsertCoupon(coupon: Coupon) {
  if (!supabase) throw new Error('Configura Supabase para guardar cupones.');
  const { error } = await supabase.from('coupons').upsert(toCouponRow(coupon));
  if (error) throw error;
}

export async function removeCoupon(couponId: string) {
  if (!supabase) throw new Error('Configura Supabase para borrar cupones.');
  const { error } = await supabase.from('coupons').delete().eq('id', couponId);
  if (error) throw error;
}

// ---------- Pedidos (solo administradores) ----------
export type AdminOrder = {
  id: string;
  reference: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  address: string;
  city: string;
  items: { productId: string; productName: string; size: number; color: string; quantity: number; price: number }[];
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'bold' | 'contraentrega';
  fulfillment: 'por_despachar' | 'despachado' | 'entregado' | 'cancelado';
};

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    reference: row.reference,
    createdAt: new Date(row.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    address: row.customer_address,
    city: row.customer_city,
    items: row.items ?? [],
    total: Number(row.total),
    paymentStatus: row.status,
    paymentMethod: row.payment_method ?? 'bold',
    fulfillment: row.fulfillment ?? 'por_despachar'
  }));
}

export async function updateOrderFulfillment(id: string, fulfillment: AdminOrder['fulfillment']) {
  if (!supabase) throw new Error('Configura Supabase.');
  const { error } = await supabase.from('orders').update({ fulfillment }).eq('id', id);
  if (error) throw error;
}

export async function markOrderPaid(id: string) {
  if (!supabase) throw new Error('Configura Supabase.');
  const { error } = await supabase.from('orders').update({ status: 'paid' }).eq('id', id);
  if (error) throw error;
}

export type RegisteredCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  createdAt: string;
};

export async function fetchCustomers(): Promise<RegisteredCustomer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, email, phone, city, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((row: Record<string, any>) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: row.city,
    createdAt: new Date(row.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
  }));
}

export async function deleteCustomer(id: string) {
  if (!supabase) return;
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw error;
}

// Publica u oculta varios productos a la vez (borrador ↔ publicado).
export async function setProductsPublished(ids: string[], published: boolean) {
  if (!supabase) throw new Error('Configura Supabase para publicar productos.');
  const { error } = await supabase.from('products').update({ is_published: published }).in('id', ids);
  if (error) throw error;
}

// Costo del proveedor (solo lo ve el admin).
export async function fetchProductCosts(): Promise<Record<string, { cost: number; supplier: string }>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('product_costs').select('product_id, cost, supplier');
  if (error) return {};
  return Object.fromEntries((data ?? []).map((row: Record<string, any>) => [row.product_id, { cost: Number(row.cost), supplier: row.supplier }]));
}

// Top rankings elegidos a mano en el panel (lista → ids en orden).
export async function fetchTopRankings(): Promise<Partial<Record<'sold' | 'rating' | 'deals' | 'new', string[]>>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('top_rankings').select('list_id, position, product_id').order('position');
  if (error) return {};
  const out: Partial<Record<'sold' | 'rating' | 'deals' | 'new', string[]>> = {};
  for (const row of (data ?? []) as { list_id: 'sold' | 'rating' | 'deals' | 'new'; product_id: string }[]) {
    (out[row.list_id] ??= []).push(row.product_id);
  }
  return out;
}

export async function saveTopRanking(listId: 'sold' | 'rating' | 'deals' | 'new', productIds: string[]) {
  if (!supabase) throw new Error('Configura Supabase para guardar el top.');
  const { error: delError } = await supabase.from('top_rankings').delete().eq('list_id', listId);
  if (delError) throw delError;
  const rows = productIds.slice(0, 5).map((product_id, i) => ({ list_id: listId, position: i + 1, product_id }));
  if (!rows.length) return;
  const { error } = await supabase.from('top_rankings').insert(rows);
  if (error) {
    if (error.code === '23505') throw new Error('Una de esas referencias ya está en otro top. Quítala de allá primero.');
    throw error;
  }
}
