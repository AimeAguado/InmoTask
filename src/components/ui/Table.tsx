import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  align?: 'left' | 'center' | 'right';
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedIds?: string[];
  onSelectRow?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  selectable?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  showPagination?: boolean;
  className?: string;
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  selectable = false,
  isLoading = false,
  emptyMessage = 'No se encontraron registros',
  pageSize = 8,
  showPagination = true,
  className = '',
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnId: string, sortable?: boolean) => {
    if (!sortable) return;
    if (sortColumn === columnId) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col || !col.accessor) return data;

    return [...data].sort((a, b) => {
      let valA: any = typeof col.accessor === 'function' ? col.accessor(a) : a[col.accessor as keyof T];
      let valB: any = typeof col.accessor === 'function' ? col.accessor(b) : b[col.accessor as keyof T];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = showPagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const allSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.includes(keyExtractor(row)));

  const someSelected =
    paginatedData.some((row) => selectedIds.includes(keyExtractor(row))) && !allSelected;

  return (
    <div className={`w-full overflow-hidden border border-slate-200/85 rounded-xl bg-white shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-600">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => {
                const isSorted = sortColumn === col.id;
                const alignClass =
                  col.align === 'right'
                    ? 'text-right'
                    : col.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <th
                    key={col.id}
                    style={{ width: col.width }}
                    onClick={() => handleSort(col.id, col.sortable)}
                    className={`px-4 py-3 font-semibold ${alignClass} ${
                      col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-slate-900" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-slate-900" />
                            )
                          ) : (
                            <div className="w-3 h-3 opacity-30">↕</div>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {selectable && <td className="px-4 py-3.5"><div className="w-4 h-4 bg-slate-200 rounded" /></td>}
                  {columns.map((c) => (
                    <td key={c.id} className="px-4 py-3.5">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-6 py-12 text-center text-slate-400 text-sm"
                >
                  <p className="font-medium text-slate-600 mb-1">{emptyMessage}</p>
                  <p className="text-xs text-slate-400">Modifica los filtros o añade un nuevo registro para comenzar.</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const key = keyExtractor(row);
                const isSelected = selectedIds.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={`transition-colors duration-100 ${
                      onRowClick ? 'cursor-pointer hover:bg-slate-50/70' : 'hover:bg-slate-50/40'
                    } ${isSelected ? 'bg-slate-50/90' : ''}`}
                  >
                    {selectable && (
                      <td
                        className="w-10 px-4 py-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => onSelectRow?.(key, e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const alignClass =
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left';

                      let cellContent: React.ReactNode = null;
                      if (col.render) {
                        const rawVal =
                          typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : col.accessor
                            ? row[col.accessor]
                            : undefined;
                        cellContent = col.render(rawVal, row, index);
                      } else if (typeof col.accessor === 'function') {
                        cellContent = col.accessor(row);
                      } else if (col.accessor) {
                        cellContent = String(row[col.accessor] ?? '');
                      }

                      return (
                        <td
                          key={col.id}
                          className={`px-4 py-3 text-slate-700 font-normal leading-tight ${alignClass}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && sortedData.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
          <div className="font-mono tabular-nums">
            Mostrando <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> a{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, sortedData.length)}
            </span>{' '}
            de <span className="font-semibold text-slate-900">{sortedData.length}</span> registros
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 font-mono tabular-nums text-slate-700">
              Página {currentPage} de {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
