import React, { useState } from 'react';
import { Property } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Bed, Bath, Maximize2, Car, Eye, Calendar, Sparkles, Key, Flag, Trash2, Tag } from 'lucide-react';
import { formatPrice, hasPrice } from '../../lib/format';

interface PropertyCardProps {
  property: Property;
  onViewDetails?: (property: Property) => void;
  onScheduleVisit?: (property: Property) => void;
  onEdit?: (property: Property) => void;
  onDelete?: (property: Property) => void;
  className?: string;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onViewDetails,
  onScheduleVisit,
  onEdit,
  onDelete,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group bg-white rounded-xl border border-slate-200/90 overflow-hidden hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col ${className}`}
    >
      {/* Property Visual Showcase */}
      <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-100">
        {!imageError && property.imageUrl ? (
          <img
            src={property.imageUrl}
            alt={property.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 p-4 text-center">
            <Maximize2 className="w-8 h-8 text-slate-400 mb-1" />
            <span className="text-xs text-slate-500 font-medium">{property.type} en {property.neighborhood}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <Badge status={property.status} />
          {property.featured && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-900/90 text-white backdrop-blur-xs px-2 py-0.5 rounded-md">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Destacada
            </span>
          )}
        </div>

        {/* Operation Tag */}
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-white/95 backdrop-blur-xs text-slate-800 rounded-md border border-slate-200/60 shadow-xs">
            {property.operation}
          </span>
        </div>

        {/* Operational Status Overlay at Bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-linear-to-t from-slate-950/85 via-slate-950/40 to-transparent flex items-end justify-between text-white">
          <div>
            <div className="text-xs font-mono font-medium text-slate-300 uppercase tracking-wider">{property.code}</div>
            <div className="text-sm font-bold leading-tight flex items-center gap-1.5 mt-0.5 text-white">
              <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Llaves: {property.keysLocation}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-850/80 backdrop-blur-xs text-slate-200 border border-slate-700">
              <Flag className="w-3 h-3 text-emerald-400 shrink-0" />
              {property.signageStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Property Details Body */}
      <div className="p-4.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Location */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <span className="font-semibold text-slate-700">{property.type}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{property.neighborhood}, {property.city}</span>
          </div>

          {/* Title */}
          <h4
            onClick={() => onViewDetails?.(property)}
            className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors"
            title={property.title}
          >
            {property.title}
          </h4>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{property.address}</span>
          </div>

          {/* Precio: va arriba, antes de las medidas, porque es el primer dato
              que se mira de una publicación. Las medidas se leen en la ficha. */}
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0 translate-y-0.5" />
            <span
              className={`text-base font-bold tabular-nums ${
                hasPrice(property.price) ? 'text-slate-900' : 'text-slate-400 font-semibold italic'
              }`}
              title={
                hasPrice(property.price)
                  ? `Precio de ${property.operation.toLowerCase()}`
                  : 'La publicación no tiene precio cargado'
              }
            >
              {formatPrice(property.price, property.currency)}
            </span>
          </div>

          {/* Physical Metrics Bar */}
          <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-100 text-slate-700">
            <div className="flex items-center gap-1.5" title="Superficie Total">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono tabular-nums">{property.totalArea} m²</span>
            </div>
            <div className="flex items-center gap-1.5" title="Dormitorios">
              <Bed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono tabular-nums">{property.bedrooms} dorm</span>
            </div>
            <div className="flex items-center gap-1.5" title="Baños">
              <Bath className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono tabular-nums">{property.bathrooms} baños</span>
            </div>
            <div className="flex items-center gap-1.5" title="Cocheras">
              <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs font-mono tabular-nums">{property.parkingSpots} coch</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails?.(property)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="flex-1 text-xs"
          >
            Ficha Técnica
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onScheduleVisit?.(property)}
            leftIcon={<Calendar className="w-3.5 h-3.5 text-emerald-600" />}
            className="flex-1 text-xs"
          >
            + Visita
          </Button>
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(property)}
              className="text-xs text-slate-500 hover:text-slate-900 px-2"
            >
              Editar
            </Button>
          )}
          {/* Sólo se pasa onDelete al admin (ver PropertiesView): es la única
              forma de que el botón no exista para un asesor, y no sólo de que
              esté deshabilitado. */}
          {onDelete && (
            <button
              onClick={() => onDelete(property)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
              title="Eliminar de cartelera"
              aria-label={`Eliminar ${property.code}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
