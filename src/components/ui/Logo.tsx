import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'light',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Signature House + Checkmark Icon */}
      <div
        className={`${iconSizes[size]} rounded-lg bg-slate-900 flex items-center justify-center p-1.5 shadow-sm shrink-0 border border-slate-800`}
      >
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* House outline */}
          <path
            d="M20 7L7 18V33C7 34.1046 7.89543 35 9 35H31C32.1046 35 33 34.1046 33 33V18L20 7Z"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner house door cutout line */}
          <path
            d="M15 35V26C15 24.8954 15.8954 24 17 24H23C24.1046 24 25 24.8954 25 26V35"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
          {/* Dynamic emerald task checkmark */}
          <path
            d="M13 20L18.5 25.5L30 14"
            stroke="#10B981"
            strokeWidth="3.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {showText && (
        <span className={`${textSizes[size]} font-extrabold tracking-tight flex items-baseline leading-none`}>
          <span className={variant === 'dark' ? 'text-white' : 'text-slate-900'}>Inmo</span>
          <span className="text-emerald-600">Task</span>
        </span>
      )}
    </div>
  );
};
