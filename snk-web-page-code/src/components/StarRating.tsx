import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewsCount?: number;
  size?: 'sm' | 'md';
  showScore?: boolean;
}

// Cinco estrellas con relleno parcial (ej. 4.6 = 4 llenas + 60% de la quinta).
export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewsCount,
  size = 'sm',
  showScore = true
}) => {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  const textClass = size === 'md' ? 'text-xs' : 'text-[10px]';

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={`Calificación ${safeRating.toFixed(1)} de 5`}
    >
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, safeRating - i));
          return (
            <span key={i} className={`relative inline-block ${iconClass}`}>
              <Star className={`absolute inset-0 ${iconClass} text-white/20`} />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star className={`${iconClass} fill-white text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.55)]`} />
              </span>
            </span>
          );
        })}
      </div>
      {showScore && (
        <span className={`font-mono font-semibold text-white/85 ${textClass}`}>
          {safeRating.toFixed(1)}
          {typeof reviewsCount === 'number' && (
            <span className="font-normal text-white/45"> ({reviewsCount})</span>
          )}
        </span>
      )}
    </div>
  );
};
