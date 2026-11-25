import { Product } from '../types';

/** Reparte el catálogo entre las secciones del inicio sin repetir ningún par. */
export function homeSections(products: Product[]) {
  const visible = products.filter(p => p.images.length > 0);
  const used = new Set<string>();
  const take = (list: Product[], n: number) => {
    const out: Product[] = [];
    for (const p of list) {
      if (out.length >= n) break;
      if (used.has(p.id)) continue;
      used.add(p.id);
      out.push(p);
    }
    return out;
  };

  const trending = take([...visible.filter(p => p.isBestSeller), ...visible], 4);
  const house = take([...visible.filter(p => p.isLimited), ...visible], 4);
  const remaining = visible.filter(p => !used.has(p.id));
  return { trending, house, remaining };
}
