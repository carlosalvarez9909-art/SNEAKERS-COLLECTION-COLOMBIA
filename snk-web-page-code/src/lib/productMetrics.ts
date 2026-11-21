import type { Product } from '../types';
import { finalUnitPrice } from './price';

export const finalPriceOf = (product: Product) =>
  finalUnitPrice(product.basePrice, product.discount);

// "Más vendidos": primero los marcados como Top ventas y luego por puntuación.
export const salesScore = (product: Product) =>
  (product.isBestSeller ? 1_000 : 0) + product.rating;

export type TopListId = 'sold' | 'rating' | 'deals' | 'new';

export const TOP_LISTS: { id: TopListId; label: string; hint: string }[] = [
  { id: 'sold', label: 'Top vendidos', hint: 'Los pares que más salen de la bóveda.' },
  { id: 'rating', label: 'Top rating', hint: 'Mejor calificados por nuestros clientes.' },
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
      // Solo los marcados como Top rating en el panel, de mayor a menor puntuación.
      return sorted
        .filter(p => p.isTopRated)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
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
