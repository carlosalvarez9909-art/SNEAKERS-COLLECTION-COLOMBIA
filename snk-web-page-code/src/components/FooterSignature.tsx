import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

// Estrella de 5 puntas con lados curvos, centrada en (0,0) y simétrica respecto al eje vertical.
const STAR_PATH = (() => {
  const outer = 30;
  const inner = 9.5;
  const point = (radius: number, angle: number) =>
    [radius * Math.sin(angle), -radius * Math.cos(angle)].map(n => n.toFixed(2)).join(' ');
  let d = '';
  for (let k = 0; k < 5; k += 1) {
    const tip = (k * 2 * Math.PI) / 5;
    const valley = tip + Math.PI / 5;
    const nextTip = tip + (2 * Math.PI) / 5;
    d += `${k === 0 ? 'M' : 'L'} ${point(outer, tip)} `;
    d += `Q ${point(inner * 1.25, (tip + valley) / 2)} ${point(inner, valley)} `;
    d += `Q ${point(inner * 1.25, (valley + nextTip) / 2)} ${point(outer, nextTip)} `;
  }
  return `${d}Z`;
})();

const BASE_SIZE = 100; // px con los que se mide el texto antes de ajustarlo
const FILL = 0.96; // porción del ancho disponible que ocupa la frase

/**
 * "Sneakers World." en letra gótica roja, ajustada al ancho de la pantalla sin
 * estirar las letras, con 5 estrellas centradas debajo (efecto embudo).
 */
export const FooterSignature: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  const fit = () => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;
    const natural = measure.getBoundingClientRect().width;
    if (!natural) return;
    setFontSize(Math.floor(((container.clientWidth * FILL) / natural) * BASE_SIZE));
  };

  useLayoutEffect(fit, []);

  useEffect(() => {
    const observer = new ResizeObserver(fit);
    if (containerRef.current) observer.observe(containerRef.current);
    // Vuelve a medir cuando termina de cargar la fuente gótica.
    document.fonts?.ready.then(fit).catch(() => undefined);
    return () => observer.disconnect();
  }, []);

  const starSize = fontSize ? Math.max(14, Math.round(fontSize * 0.26)) : 28;

  // Versión pequeña (menú de la lupa): tamaño fijo, alineada a la izquierda,
  // con las estrellas centradas bajo el texto.
  if (compact) {
    return (
      <div className="inline-flex select-none flex-col items-center" role="img" aria-label="Sneakers World. Cinco estrellas">
        <span aria-hidden="true" className="footer-signature-text whitespace-nowrap" style={{ fontSize: 30 }}>
          Sneakers World.
        </span>
        <span className="mt-1 flex items-center justify-center gap-1.5" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg key={i} viewBox="-31 -31 62 62" width={10} height={10}>
              <path d={STAR_PATH} fill="#d10a1f" />
            </svg>
          ))}
        </span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="footer-signature relative mt-16 w-full select-none overflow-hidden py-2" role="img" aria-label="Sneakers World. Cinco estrellas">
      {/* Copia invisible a tamaño fijo, solo para medir el ancho real del texto */}
      <span
        ref={measureRef}
        aria-hidden="true"
        className="footer-signature-text pointer-events-none invisible absolute left-0 top-0 whitespace-nowrap"
        style={{ fontSize: BASE_SIZE }}
      >
        Sneakers World.
      </span>

      <p
        aria-hidden="true"
        className="footer-signature-text whitespace-nowrap text-center"
        style={{ fontSize: fontSize ?? undefined, visibility: fontSize ? 'visible' : 'hidden' }}
      >
        Sneakers World.
      </p>

      <div className="mt-2 flex items-center justify-center" style={{ gap: starSize * 0.55 }} aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} viewBox="-31 -31 62 62" width={starSize} height={starSize}>
            <path d={STAR_PATH} fill="#d10a1f" />
          </svg>
        ))}
      </div>
    </div>
  );
};
