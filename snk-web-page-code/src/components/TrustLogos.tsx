import React, { useState } from 'react';

// Logos en silueta blanca con fondo transparente (public/payments y public/shipping).
export const PAYMENT_LOGOS = [
  { src: '/payments/nequi.png', alt: 'Nequi' },
  { src: '/payments/bancolombia.png', alt: 'Bancolombia' },
  { src: '/payments/visa.png', alt: 'Visa' },
  { src: '/payments/mastercard.png', alt: 'Mastercard' },
  { src: '/payments/pse.png', alt: 'PSE' }
];

export const CARRIER_LOGOS = [
  { src: '/shipping/servientrega.png', alt: 'Servientrega' },
  { src: '/shipping/coordinadora.png', alt: 'Coordinadora' },
  { src: '/shipping/envia.png', alt: 'Envía' },
  { src: '/shipping/interrapidisimo.png', alt: 'Inter Rapidísimo' },
  { src: '/shipping/dhl.png', alt: 'DHL' },
  { src: '/shipping/fedex.png', alt: 'FedEx' },
  { src: '/shipping/ups.png', alt: 'UPS' }
];

type Fit = { area: number; maxWidth: number; maxHeight: number };

// Mismo tamaño visual para logos anchos y cuadrados.
const FittedLogo: React.FC<{ src: string; alt: string; fit: Fit }> = ({ src, alt, fit }) => {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <img
      src={src}
      alt={alt}
      title={alt}
      loading="lazy"
      draggable={false}
      onLoad={event => {
        const img = event.currentTarget;
        if (!img.naturalWidth || !img.naturalHeight) return;
        const ratio = img.naturalWidth / img.naturalHeight;
        let height = Math.sqrt(fit.area / ratio);
        let width = height * ratio;
        if (width > fit.maxWidth) { width = fit.maxWidth; height = width / ratio; }
        if (height > fit.maxHeight) { height = fit.maxHeight; width = height * ratio; }
        setSize({ width: Math.round(width), height: Math.round(height) });
      }}
      style={size ?? { height: fit.maxHeight * 0.6 }}
      className="select-none object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
    />
  );
};

export const LogoRow: React.FC<{
  items: { src: string; alt: string }[];
  fit?: Fit;
  className?: string;
}> = ({ items, fit = { area: 1500, maxWidth: 90, maxHeight: 34 }, className = '' }) => (
  <div className={`flex flex-wrap items-center justify-center gap-x-7 gap-y-4 ${className}`}>
    {items.map(item => (
      <FittedLogo key={item.alt} src={item.src} alt={item.alt} fit={fit} />
    ))}
  </div>
);
