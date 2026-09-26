import React, { useState, useRef, useEffect } from 'react';
import { Property } from '../../types';
import { Badge } from './Badge';
import { Search, X, MapPin, Key, ArrowRight, Building2, Check } from 'lucide-react';

interface GlobalSearchProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onViewAllInProperties?: (searchTerm: string) => void;
  className?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  properties,
  onSelectProperty,
  onViewAllInProperties,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter in real time as user types
  const matchingProperties = React.useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];

    return properties.filter((p) => {
      return (
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });
  }, [properties, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Escape to close, Ctrl+K or / to focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (property: Property) => {
    onSelectProperty(property);
    setIsOpen(false);
  };

  const handleViewAll = () => {
    if (onViewAllInProperties) {
      onViewAllInProperties(searchTerm);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Bar Input */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (searchTerm.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Buscar por código, dirección o título... (⌘K)"
          className="w-full sm:w-64 md:w-72 lg:w-80 bg-slate-100/90 hover:bg-slate-100 text-slate-900 text-xs rounded-lg border border-slate-200 pl-8.5 pr-8 py-1.5 h-8.5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white focus:w-80 lg:focus:w-96 transition-all duration-200"
        />

        {searchTerm ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 text-slate-400 hover:text-slate-700 p-0.5"
            title="Limpiar búsqueda"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden lg:inline-flex items-center absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded pointer-events-none shadow-2xs">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Real-time Results Dropdown Popup */}
      {isOpen && searchTerm.trim().length > 0 && (
        <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-[320px] sm:w-[420px] max-w-[90vw] bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 text-left overflow-hidden">
          {/* Header of results */}
          <div className="px-3.5 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70">
            <span>
              Resultados para "<strong className="text-slate-800">{searchTerm}</strong>"
            </span>
            <span className="font-mono tabular-nums font-semibold text-slate-700">
              {matchingProperties.length} {matchingProperties.length === 1 ? 'coincidencia' : 'coincidencias'}
            </span>
          </div>

          {/* Results List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {matchingProperties.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">No se encontraron inmuebles</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Verifique si el código (ej. INM-1042) o calle están bien escritos.
                </p>
              </div>
            ) : (
              matchingProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handleSelect(property)}
                  className="p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 group"
                >
                  <img
                    src={property.imageUrl}
                    alt={property.title}
                    className="w-13 h-10 rounded-md object-cover border border-slate-200 shrink-0 group-hover:opacity-90"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-mono text-[11px] font-bold text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {property.code}
                      </span>
                      <Badge status={property.status} size="sm" />
                      <span className="text-[10px] text-slate-500 ml-auto font-medium">
                        {property.type}
                      </span>
                    </div>

                    <h5 className="text-xs font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                      {property.title}
                    </h5>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1 truncate">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{property.address}, {property.neighborhood}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="flex items-center gap-1 text-amber-700 font-medium shrink-0">
                        <Key className="w-3 h-3 text-amber-500" />
                        <span>{property.keysLocation}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer action to view in catalogue */}
          {matchingProperties.length > 0 && onViewAllInProperties && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/70">
              <button
                onClick={handleViewAll}
                className="w-full py-1.5 px-3 text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Ver todos los resultados en el catálogo de Inmuebles</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
