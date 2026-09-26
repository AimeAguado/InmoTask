import React from 'react';

export type BadgeStatus =
  | 'disponible'
  | 'en_visita'
  | 'reservada'
  | 'reservado'
  | 'entregada'
  | 'vendido'
  | 'alquilado'
  | 'alta'
  | 'media'
  | 'baja'
  | 'pendiente'
  | 'en_progreso'
  | 'completada'
  | 'cancelada'
  | 'lead'
  | 'interesado'
  | 'visita_agendada'
  | 'negociacion'
  | 'cerrado'
  | 'default';

interface BadgeProps {
  status?: BadgeStatus;
  label?: string;
  variant?: 'subtle' | 'outline' | 'dot';
  size?: 'sm' | 'md';
  className?: string;
  children?: React.ReactNode;
}

const STATUS_CONFIG: Record<
  BadgeStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  disponible: {
    label: 'Disponible',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  en_visita: {
    label: 'En Visita',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  reservada: {
    label: 'Reservada',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  reservado: {
    label: 'Reservado',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  entregada: {
    label: 'Entregada',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  vendido: {
    label: 'Vendido',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
  },
  alquilado: {
    label: 'Alquilado',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  alta: {
    label: 'Alta',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  media: {
    label: 'Media',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  baja: {
    label: 'Baja',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  pendiente: {
    label: 'Pendiente',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  en_progreso: {
    label: 'En Progreso',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  completada: {
    label: 'Completada',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  cancelada: {
    label: 'Cancelada',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  lead: {
    label: 'Nuevo Lead',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  interesado: {
    label: 'Interesado',
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    dot: 'bg-cyan-500',
  },
  visita_agendada: {
    label: 'Visita Agendada',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  negociacion: {
    label: 'En Negociación',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  cerrado: {
    label: 'Operación Cerrada',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
  },
  default: {
    label: 'Info',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const Badge: React.FC<BadgeProps> = ({
  status = 'default',
  label,
  variant = 'subtle',
  size = 'md',
  className = '',
  children,
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.default;
  const textContent = children || label || config.label;

  const sizeClasses = {
    sm: 'text-[11px] px-1.5 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2 py-0.5 gap-1.5 font-medium',
  };

  let styleClasses = '';
  if (variant === 'subtle') {
    styleClasses = `${config.bg} ${config.text} border ${config.border}`;
  } else if (variant === 'outline') {
    styleClasses = `bg-white ${config.text} border ${config.border}`;
  } else if (variant === 'dot') {
    styleClasses = `bg-transparent ${config.text} px-0 py-0`;
  }

  return (
    <span
      className={`inline-flex items-center rounded-md whitespace-nowrap transition-colors select-none ${sizeClasses[size]} ${styleClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      <span>{textContent}</span>
    </span>
  );
};
