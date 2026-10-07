import React from 'react';
import { Search, X, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';

export interface ActiveFilterTag {
  id: string;
  label: string;
  value: string;
}

export interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  children?: React.ReactNode;
  activeFilters?: ActiveFilterTag[];
  onRemoveFilter?: (id: string) => void;
  onResetFilters?: () => void;
  totalResults?: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  hideSearch = false,
  children,
  activeFilters = [],
  onRemoveFilter,
  onResetFilters,
  totalResults,
  className = '',
}) => {
  const hasActiveFilters = activeFilters.length > 0 || (!hideSearch && searchQuery.trim().length > 0);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Primary search and controls bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 rounded-xl border border-slate-200/85 shadow-xs">
        {/* Search Input */}
        {!hideSearch && (
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-slate-50 text-slate-900 text-sm rounded-lg border border-slate-200 pl-9 pr-8 py-1.5 h-9 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        )}

        {/* Filter slots */}
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}

        {/* Reset button */}
        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-slate-500 hover:text-slate-900 text-xs ml-auto"
          >
            Reestablecer
          </Button>
        )}
      </div>

      {/* Secondary active tags & counter bar */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex flex-wrap items-center gap-2">
          {totalResults !== undefined && (
            <span className="text-slate-500 font-mono tabular-nums font-medium mr-1">
              {totalResults} {totalResults === 1 ? 'resultado encontrado' : 'resultados encontrados'}
            </span>
          )}

          {activeFilters.map((filter) => (
            <span
              key={filter.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/80 transition-colors"
            >
              <span className="text-slate-400">{filter.label}:</span>
              <span className="text-slate-900">{filter.value}</span>
              {onRemoveFilter && (
                <button
                  onClick={() => onRemoveFilter(filter.id)}
                  className="text-slate-400 hover:text-slate-700 ml-0.5 p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
