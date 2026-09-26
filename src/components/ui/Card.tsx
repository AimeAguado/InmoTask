import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, LucideIcon } from 'lucide-react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className = '',
  hoverable = false,
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/85 transition-all duration-150 ${
        hoverable ? 'hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <h3
      className={`text-base font-semibold text-slate-900 tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 leading-normal ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div
      className={`px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-600 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  timeframe?: string;
  icon: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  timeframe,
  icon: Icon,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/85 p-5 transition-all duration-150 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-xs' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500">{title}</span>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
            {value}
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(change || timeframe) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <div
              className={`flex items-center gap-1 font-medium ${
                trend === 'up'
                  ? 'text-emerald-600'
                  : trend === 'down'
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
              {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
              <span>{change}</span>
            </div>
          )}
          {timeframe && <span className="text-slate-400">{timeframe}</span>}
        </div>
      )}
    </div>
  );
};
