import React, { useRef, useState } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Foto del producto con lupa.
 * - Con mouse: al pasar por encima aparece una lupa redonda que amplía la zona.
 * - En celular: un toque amplía donde tocaste, arrastra el dedo para recorrer
 *   la zapatilla y otro toque vuelve al tamaño normal. Sin zoom, el deslizar
 *   de la galería funciona como siempre.
 */
interface Props {
  src: string;
  alt: string;
  /** Zoom táctil activo (lo controla la galería para bloquear el deslizar). */
  zoomed: boolean;
  onZoomChange: (zoomed: boolean) => void;
  zoom?: number;
  lensSize?: number;
  className?: string;
}

type Point = { x: number; y: number; w: number; h: number; ox: number; oy: number; inside: boolean };

export const ZoomableImage: React.FC<Props> = ({
  src, alt, zoomed, onZoomChange, zoom = 2.6, lensSize = 190, className = ''
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const downRef = useRef<{ x: number; y: number } | null>(null);
  const [lens, setLens] = useState<Point | null>(null);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  // Coordenadas sobre la foto (medidas de diseño, no afectadas por el zoom).
  const locate = (clientX: number, clientY: number): Point | null => {
    const img = imgRef.current;
    const box = boxRef.current?.getBoundingClientRect();
    if (!img || !box || !img.offsetWidth) return null;
    const ox = img.offsetLeft, oy = img.offsetTop, w = img.offsetWidth, h = img.offsetHeight;
    const rx = clientX - box.left - ox, ry = clientY - box.top - oy;
    return { x: Math.min(Math.max(rx, 0), w), y: Math.min(Math.max(ry, 0), h), w, h, ox, oy, inside: rx >= 0 && ry >= 0 && rx <= w && ry <= h };
  };

  const setOriginFrom = (p: Point) => setOrigin({ x: (p.x / p.w) * 100, y: (p.y / p.h) * 100 });

  const onPointerMove = (e: React.PointerEvent) => {
    const p = locate(e.clientX, e.clientY);
    if (!p) return;
    if (e.pointerType === 'mouse') setLens(p.inside ? p : null);
    else if (zoomed) setOriginFrom(p);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') downRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' || !downRef.current) return;
    const moved = Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y);
    downRef.current = null;
    if (moved > 10 && zoomed) return; // fue un arrastre para recorrer, no un toque
    const p = locate(e.clientX, e.clientY);
    if (!zoomed && p) setOriginFrom(p);
    onZoomChange(!zoomed);
  };

  return (
    <div
      ref={boxRef}
      className={`relative flex h-full w-full select-none items-center justify-center ${zoomed ? 'overflow-hidden cursor-zoom-out' : 'cursor-zoom-in'}`}
      style={{ touchAction: zoomed ? 'none' : 'pan-x pan-y' }}
      onPointerMove={onPointerMove}
      onPointerLeave={e => e.pointerType === 'mouse' && setLens(null)}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => (downRef.current = null)}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        draggable={false}
        className={`max-h-full max-w-full object-contain transition-transform duration-200 ease-out ${className}`}
        style={zoomed ? { transform: `scale(${zoom})`, transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
      />

      {/* Lupa (solo con mouse) */}
      {lens && !zoomed && (
        <div
          aria-hidden
          className="pointer-events-none absolute z-20 rounded-full border-2 border-red-600 shadow-[0_0_28px_rgba(209,10,31,0.45),0_16px_40px_rgba(0,0,0,0.7)]"
          style={{
            width: lensSize,
            height: lensSize,
            left: lens.ox + lens.x - lensSize / 2,
            top: lens.oy + lens.y - lensSize / 2,
            backgroundColor: '#141414',
            backgroundImage: `url("${src}")`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${lens.w * zoom}px ${lens.h * zoom}px`,
            backgroundPosition: `${-(lens.x * zoom - lensSize / 2)}px ${-(lens.y * zoom - lensSize / 2)}px`
          }}
        />
      )}

      {/* Aviso para celular */}
      <span className="pointer-events-none absolute bottom-2 left-2 z-10 flex items-center gap-1.5 rounded-full border border-neutral-800 bg-black/70 px-2.5 py-1 text-[11px] text-neutral-200 backdrop-blur [@media(hover:hover)]:hidden">
        {zoomed ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
        {zoomed ? 'Toca para salir' : 'Toca para ampliar'}
      </span>
    </div>
  );
};
