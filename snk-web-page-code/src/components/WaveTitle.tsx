import React from 'react';
import { motion } from 'motion/react';

/**
 * Título que aparece letra por letra y, al pasar el cursor, las letras se mueven
 * en ola de derecha a izquierda.
 */
export const WaveTitle: React.FC<{ text: string; className?: string; as?: 'h1' | 'h2' }> = ({
  text,
  className = '',
  as = 'h1'
}) => {
  const Tag = as;
  const letters = Array.from(text);

  return (
    <Tag className={`wave-title ${className}`} aria-label={text}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="wave-letter luxury-title inline-block"
          style={{ '--wave-delay': `${(letters.length - 1 - i) * 45}ms` } as React.CSSProperties}
          initial={{ opacity: 0, x: 40, filter: 'blur(6px)' }}
          animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: (letters.length - 1 - i) * 0.05, ease: [0.22, 1, 0.36, 1] }}
        >
          {letter === ' ' ? ' ' : letter}
        </motion.span>
      ))}
    </Tag>
  );
};
