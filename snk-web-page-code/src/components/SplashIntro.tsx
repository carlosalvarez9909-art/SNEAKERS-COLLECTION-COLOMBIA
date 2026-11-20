import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

// Duración total de la apertura (logo + desvanecido). No debe pasar de 1.5 s.
const SPLASH_MS = 1400;
// Momento en que la apertura empieza a desvanecerse y aparece la página.
const REVEAL_MS = 1000;

interface SplashIntroProps {
  onReveal: () => void;
  onFinish: () => void;
}

/**
 * Apertura de pantalla: el video del logo centrado sobre el fondo de estrellas.
 * El video tiene fondo negro puro; con mix-blend-mode: screen ese negro se vuelve
 * transparente y las estrellas del sitio se ven detrás del logo.
 */
export const SplashIntro: React.FC<SplashIntroProps> = ({ onReveal, onFinish }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const callbacks = useRef({ onReveal, onFinish });
  callbacks.current = { onReveal, onFinish };
  const [isLeaving, setIsLeaving] = useState(false);
  // El video se muestra solo cuando ya está reproduciendo, para que no salte de imagen.
  const [isPlaying, setIsPlaying] = useState(false);
  // Si el navegador no reproduce el video (p. ej. ahorro de batería), se muestra la imagen fija.
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Algunos navegadores móviles ignoran autoplay; se intenta reproducir a mano.
    videoRef.current?.play().catch(() => undefined);

    const fallbackTimer = window.setTimeout(() => {
      if (videoRef.current?.paused) setShowFallback(true);
    }, 400);
    const revealTimer = window.setTimeout(() => {
      setIsLeaving(true);
      callbacks.current.onReveal();
    }, REVEAL_MS);
    const finishTimer = window.setTimeout(() => callbacks.current.onFinish(), SPLASH_MS);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(finishTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: isLeaving ? 0 : 1 }}
      transition={{ duration: (SPLASH_MS - REVEAL_MS) / 1000, ease: 'easeInOut' }}
      className="splash-intro fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
    >
      {showFallback ? (
        <img src="/intro/logo-intro-poster.jpg" alt="" className="splash-intro-video" />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          preload="auto"
          onPlaying={() => setIsPlaying(true)}
          className="splash-intro-video transition-opacity duration-200"
          style={{ opacity: isPlaying ? 1 : 0 }}
        >
          <source src="/intro/logo-intro.mp4" type="video/mp4" />
        </video>
      )}
    </motion.div>
  );
};
