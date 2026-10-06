import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[10px]',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
};

const PALETTES = [
  'bg-emerald-100 text-emerald-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-cyan-100 text-cyan-800',
];

const initialsOf = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const paletteFor = (name: string): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[hash % PALETTES.length];
};

/**
 * Avatar de usuario: siempre muestra las iniciales, sin foto de perfil.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ name, size = 'sm', className = '' }) => {
  const dimension = SIZES[size];

  return (
    <span
      aria-hidden="true"
      className={`${dimension} rounded-full font-bold font-mono flex items-center justify-center shrink-0 select-none ${paletteFor(
        name
      )} ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
};