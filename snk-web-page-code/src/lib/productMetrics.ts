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

export type ManualRankings = Partial<Record<TopListId, string[]>>;

/**
 * Arma los 4 tops. Lo elegido a mano en el panel va primero; si un top tiene menos de 5,
 * se completa con el orden automático. Una referencia nunca aparece en dos tops distintos.
 */
export function resolveRankings(products: Product[], manual: ManualRankings, limit = 5): Record<TopListId, Product[]> {
  const byId = new Map(products.map(p => [p.id, p]));
  const used = new Set<string>();
  const result = {} as Record<TopListId, Product[]>;

  // Primero se reservan todas las elegidas a mano, para que el relleno automático no las use.
  for (const list of TOP_LISTS) {
    for (const id of manual[list.id] ?? []) if (byId.has(id)) used.add(id);
  }

  for (const list of TOP_LISTS) {
    const picked = (manual[list.id] ?? []).map(id => byId.get(id)).filter((p): p is Product => Boolean(p)).slice(0, limit);
    if (picked.length < limit) {
      for (const p of topProducts(products, list.id, products.length)) {
        if (picked.length >= limit) break;
        if (used.has(p.id)) continue;
        picked.push(p);
        used.add(p.id);
      }
    }
    result[list.id] = picked;
  }
  return result;
}
