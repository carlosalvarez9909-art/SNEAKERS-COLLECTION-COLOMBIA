import React, { useState } from 'react';
import type { Brand } from '../types';

const isImagePath = (value: string) =>
  /^(https?:\/\/|\/|data:image\/)/i.test(value) || /\.(svg|png|webp|jpe?g)(\?.*)?$/i.test(value);

interface BrandLogoProps {
  brand: Brand;
  className?: string;
  /** Texto que se muestra si la marca no tiene logo. */
  fallbackClassName?: string;
  /**
   * Tamaño visual parejo: todos los logos ocupan más o menos la misma área
   * (px²) sin pasarse del ancho y alto máximos, sean anchos o cuadrados.
   */
  fit?: { area: number; maxWidth: number; maxHeight: number };
}

const fitSize = (ratio: number, fit: NonNullable<BrandLogoProps['fit']>) => {
  let height = Math.sqrt(fit.area / ratio);
  let width = height * ratio;
  if (width > fit.maxWidth) { width = fit.maxWidth; height = width / ratio; }
  if (height > fit.maxHeight) { height = fit.maxHeight; width = height * ratio; }
  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Logo de una marca (silueta blanca con fondo transparente, en /public/brands/<id>.png).
 * Usa primero el logo guardado en la marca si es una imagen. Si no hay ninguno, muestra el nombre.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  className = 'h-12 w-auto max-w-[150px]',
  fallbackClassName = 'font-sans text-sm font-black uppercase tracking-[-0.04em] text-white',
  fit
}) => {
  const candidates = Array.from(new Set([
    ...(brand.logo && isImagePath(brand.logo) ? [brand.logo] : []),
    `/brands/${brand.id}.png`,
    `/brands/${brand.id}.svg`
  ]));
  const [attempt, setAttempt] = useState(0);
  const [ratio, setRatio] = useState<number | null>(null);

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
      onLoad={event => {
        const img = event.currentTarget;
        if (img.naturalWidth && img.naturalHeight) setRatio(img.naturalWidth / img.naturalHeight);
      }}
      style={fit && ratio ? fitSize(ratio, fit) : undefined}
      className={`object-contain ${className}`}
    />
  );
};
