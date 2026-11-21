import type { Product } from '../types';

// Filtros por color y estilo, deducidos del nombre del color y del modelo.

export const COLOR_FAMILIES = [
  { id: 'negro', label: 'Negro', hex: '#111111', words: ['negro', 'black', 'graphite', 'slate', 'stealth'] },
  { id: 'blanco', label: 'Blanco', hex: '#f2f2f2', words: ['blanco', 'white', 'vela', 'sail', 'crema', 'cream', 'cloud'] },
  { id: 'rojo', label: 'Rojo', hex: '#c8102e', words: ['rojo', 'red', 'cereza', 'cherry', 'varsity'] },
  { id: 'azul', label: 'Azul', hex: '#1f5fd1', words: ['azul', 'blue', 'denim', 'navy', 'royal'] },
  { id: 'gris', label: 'Gris', hex: '#8a8d91', words: ['gris', 'grey', 'gray', 'cemento', 'cement'] },
  { id: 'cafe', label: 'Café y beige', hex: '#8a5a2b', words: ['café', 'cafe', 'beige', 'wheat', 'mocca', 'sand', 'arena'] },
  { id: 'rosa', label: 'Rosa', hex: '#f2a7c8', words: ['rosa', 'pink', 'pastel'] },
  { id: 'morado', label: 'Morado', hex: '#7b3fd1', words: ['morado', 'violet', 'purple'] },
  { id: 'verde', label: 'Verde', hex: '#2f8f5a', words: ['verde', 'green', 'menta', 'mint', 'jungle'] },
  { id: 'amarillo', label: 'Amarillo y dorado', hex: '#f2b400', words: ['amarillo', 'dorado', 'oro', 'gold', 'yellow'] },
  { id: 'naranja', label: 'Naranja', hex: '#e8521f', words: ['naranja', 'orange', 'lava', 'inferno'] }
] as const;
export type ColorFamilyId = typeof COLOR_FAMILIES[number]['id'];

export const STYLES = [
  { id: 'retro', label: 'Jordan retro' },
  { id: 'basket', label: 'Basketball' },
  { id: 'running', label: 'Running y Air' },
  { id: 'casual', label: 'Casual y street' },
  { id: 'lujo', label: 'Lujo' }
] as const;
export type StyleId = typeof STYLES[number]['id'];

export function colorFamiliesOf(product: Product): ColorFamilyId[] {
  const text = `${product.colors.map(c => c.name).join(' ')} ${product.name}`.toLowerCase();
  return COLOR_FAMILIES.filter(f => f.words.some(w => text.includes(w))).map(f => f.id);
}

export function styleOf(product: Product): StyleId {
  const name = product.name.toLowerCase();
  if (product.brandId === 'louisvuitton') return 'lujo';
  if (/hyperdunk|uptempo|lebron|kobe|dunk high/.test(name)) return 'basket';
  if (/adizero|air max|shox|running|pegasus|vomero|ultraboost|tn\b/.test(name)) return 'running';
  if (product.brandId === 'jordan' || /jordan/.test(name)) return 'retro';
  return 'casual';
}
