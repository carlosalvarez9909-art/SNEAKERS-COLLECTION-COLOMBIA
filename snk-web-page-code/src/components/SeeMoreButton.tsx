import React from 'react';
import { ArrowRight } from 'lucide-react';

/** Botón "ver más" del inicio: borde y texto rojos, se enciende al pasar el cursor. */
export const SeeMoreButton: React.FC<{
  label: string;
  onClick: () => void;
  id?: string;
  className?: string;
}> = ({ label, onClick, id, className = '' }) => (
  <button
    id={id}
    type="button"
    onClick={onClick}
    className={`group inline-flex items-center gap-2 rounded-full border border-red-600/70 bg-red-600/[0.06] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-red-500 transition-all duration-300 hover:border-red-500 hover:bg-red-600 hover:text-white hover:shadow-[0_0_24px_rgba(209,10,31,0.55)] active:scale-95 ${className}`}
  >
    {label}
    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
  </button>
);
