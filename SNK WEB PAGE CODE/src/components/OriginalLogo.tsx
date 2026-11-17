import React from 'react';

interface OriginalLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OriginalLogo: React.FC<OriginalLogoProps> = ({ 
  className = '', 
  showTagline = true,
  size = 'md'
}) => {
  const logoSizeMap = {
    sm: 'w-28 h-10',
    md: 'w-44 h-14',
    lg: 'w-64 h-20'
  } as const;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <img
        src="/SNEAKERS%20COLLECTION%20LOGO%20EDIT%20.png"
        alt="Sneakers Collection logo"
        className={`${logoSizeMap[size]} object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]`}
      />

      {showTagline && size !== 'sm' && (
        <div className="mt-2 flex flex-col items-center">
          <div className="h-[1px] w-24 bg-neutral-900" />
          <span className="mt-1 text-[7.5px] font-sans tracking-[0.28em] text-neutral-500 font-extrabold uppercase">
            THE SNEAKERS WORLD
          </span>
        </div>
      )}
    </div>
  );
};
