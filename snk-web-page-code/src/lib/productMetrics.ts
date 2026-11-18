import type { Product } from '../types';

export const finalPriceOf = (product: Product) =>
  product.basePrice * (1 - product.discount / 100);

// Mientras no haya historial de ventas reales, "más vendidos" combina la marca
// de Top Ventas con la cantidad de reseñas (más reseñas ≈ más compras).
export const salesScore = (product: Product) =>
  (product.isBestSeller ? 1_000_000 : 0) + product.reviewsCount;

export type TopListId = 'sold' | 'rating' | 'reviews' | 'deals' | 'new';

export const TOP_LISTS: { id: TopListId; label: string; hint: string }[] = [
  { id: 'sold', label: 'Top vendidos', hint: 'Los pares que más salen de la bóveda.' },
  { id: 'rating', label: 'Top rating', hint: 'Mejor calificados por nuestros clientes.' },
  { id: 'reviews', label: 'Más reseñados', hint: 'Los que más opiniones acumulan.' },
  { id: 'deals', label: 'Top ofertas', hint: 'Los mayores descuentos activos.' },
  { id: 'new', label: 'Recién llegados', hint: 'Lo último que entró al catálogo.' }
];

export function topProducts(products: Product[], list: TopListId, limit = 5) {
  const sorted = [...products];
  switch (list) {
    case 'sold':
      sorted.sort((a, b) => salesScore(b) - salesScore(a));
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating || b.reviewsCount - a.reviewsCount);
      break;
    case 'reviews':
      sorted.sort((a, b) => b.reviewsCount - a.reviewsCount);
      break;
    case 'deals':
      return sorted
        .filter(p => p.discount > 0)
        .sort((a, b) => b.discount - a.discount)
        .slice(0, limit);
    case 'new':
      break; // el catálogo ya llega ordenado del más nuevo al más antiguo
  }
  return sorted.slice(0, limit);
}
