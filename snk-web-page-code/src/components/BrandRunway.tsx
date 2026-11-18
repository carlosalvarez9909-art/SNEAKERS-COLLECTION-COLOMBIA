import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

export const BrandRunway: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, {
    stiffness: 100,
    damping: 20,
  });

  const smoothY = useSpring(mouseY, {
    stiffness: 100,
    damping: 20,
  });

  const rotateY = useTransform(smoothX, [-1, 1], [-7, 7]);
  const rotateX = useTransform(smoothY, [-1, 1], [5, -5]);

  const translateX = useTransform(smoothX, [-1, 1], [-15, 15]);
  const translateY = useTransform(smoothY, [-1, 1], [-10, 10]);

  const handleMouseMove = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();

    const x =
      ((event.clientX - rect.left) / rect.width - 0.5) * 2;

    const y =
      ((event.clientY - rect.top) / rect.height - 0.5) * 2;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[760px] overflow-hidden bg-transparent"
    >


      {/* Header */}
      <div className="absolute left-8 top-12 z-20 md:left-16 md:top-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-neutral-500">
          Sneakers Collection
        </p>

        <h2 className="mt-5 text-5xl font-black uppercase leading-[0.85] tracking-[-0.05em] text-white md:text-7xl">
          Marcas
          <br />
          <span className="text-neutral-600">
            Exclusivas
          </span>
        </h2>
      </div>

      {/* Sneaker */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          style={{
            rotateX,
            rotateY,
            x: translateX,
            y: translateY,
            transformPerspective: 1200,
          }}
          animate={{
            y: [0, -16, 0],
          }}
          transition={{
            y: {
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="relative w-[min(90vw,850px)]"
        >
          {/* Red glow behind product */}
          <div className="absolute left-1/2 top-1/2 h-[260px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/10 blur-[100px]" />

          <img
            src="/images/jordan12.png"
            alt="Air Jordan 12 Bloodline"
            draggable={false}
            className="relative z-10 w-full select-none object-contain drop-shadow-[0_50px_50px_rgba(0,0,0,0.95)]"
          />

          {/* Ground shadow */}
          <motion.div
            animate={{
              scaleX: [1, 0.82, 1],
              opacity: [0.45, 0.22, 0.45],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute bottom-[4%] left-1/2 h-8 w-[52%] -translate-x-1/2 rounded-full bg-black blur-2xl"
          />
        </motion.div>
      </div>

      {/* Product information */}
      <div className="absolute bottom-12 left-8 z-20 md:left-16">
        <p className="font-mono text-[9px] uppercase tracking-[0.35em] text-red-500">
          Featured Brand
        </p>

        <h3 className="mt-2 text-2xl font-black uppercase text-white">
          Jordan
        </h3>

        <p className="mt-1 text-xs text-neutral-500">
          Air Jordan 12 Retro Bloodline
        </p>
      </div>

      {/* CTA */}
      <div className="absolute bottom-12 right-8 z-20 md:right-16">
        <button
          type="button"
          className="group flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-white"
        >
          <span className="transition-colors group-hover:text-red-500">
            Explorar colección
          </span>

          <span className="text-red-500 transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>
        </button>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-12 left-1/2 z-20 hidden -translate-x-1/2 md:block">
        <div className="flex flex-col items-center gap-3">
          <span className="font-mono text-[8px] uppercase tracking-[0.35em] text-neutral-600">
            Scroll
          </span>

          <div className="h-10 w-px overflow-hidden bg-neutral-900">
            <motion.div
              animate={{ y: ['-100%', '200%'] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="h-1/2 w-full bg-red-600"
            />
          </div>
        </div>
      </div>
    </section>
  );
};