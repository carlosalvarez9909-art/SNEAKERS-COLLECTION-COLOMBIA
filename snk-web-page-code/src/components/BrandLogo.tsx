import React, { useState } from 'react';
import type { Brand } from '../types';

const isImagePath = (value: string) =>
  /^(https?:\/\/|\/|data:image\/)/i.test(value) || /\.(svg|png|webp|jpe?g)(\?.*)?$/i.test(value);

interface BrandLogoProps {
  brand: Brand;
  className?: string;
  /** Texto que se muestra si la marca no tiene logo. */
  fallbackClassName?: string;
}

/**
 * Logo de una marca (silueta blanca con fondo transparente, en /public/brands/<id>.png).
 * Usa primero el logo guardado en la marca si es una imagen. Si no hay ninguno, muestra el nombre.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  className = 'h-12 w-auto max-w-[150px]',
  fallbackClassName = 'font-sans text-sm font-black uppercase tracking-[-0.04em] text-white'
}) => {
  const candidates = Array.from(new Set([
    ...(brand.logo && isImagePath(brand.logo) ? [brand.logo] : []),
    `/brands/${brand.id}.png`,
    `/brands/${brand.id}.svg`
  ]));
  const [attempt, setAttempt] = useState(0);

  if (attempt >= candidates.length) {
    return <span className={fallbackClassName}>{brand.name}</span>;
  }

  return (
    <img
      src={candidates[attempt]}
      alt={brand.name}
      loading="lazy"
      draggable={false}
      onError={() => setAttempt(current => current + 1)}
      className={`object-contain ${className}`}
    />
  );
};
