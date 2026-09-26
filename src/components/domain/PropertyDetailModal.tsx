import React from 'react';
import { Property } from '../../types';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Car,
  Calendar,
  Key,
  Flag,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onScheduleVisit: (property: Property) => void;
  onEdit: (property: Property) => void;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  isOpen,
  onClose,
  onScheduleVisit,
  onEdit,
}) => {
  if (!property) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={property.title}
      subtitle={`Referencia: ${property.code} · Registrado el ${property.createdAt}`}
      size="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(property)}
            leftIcon={<FileText className="w-3.5 h-3.5" />}
          >
            Editar Ficha
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cerrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onScheduleVisit(property);
              }}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-emerald-400" />}
            >
              + Registrar Visita / Tarea
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Image Header */}
        <div className="relative aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={property.imageUrl}
            alt={property.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <Badge status={property.status} />
            <span className="bg-slate-900/90 text-white text-xs font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs">
              {property.operation}
            </span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-lg bg-slate-950/85 backdrop-blur-xs text-white flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-300 block">Ubicación de Llaves:</span>
                <span className="text-sm font-bold text-white">{property.keysLocation}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] text-slate-300 block">Cartel en Fachada:</span>
                <span className="text-sm font-bold text-white">{property.signageStatus}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Address */}
        <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold text-slate-900">{property.address}</div>
              <div className="text-xs text-slate-500">{property.neighborhood}, {property.city}</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
            {property.type}
          </span>
        </div>

        {/* Physical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded text-slate-700">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Superficie</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {property.totalArea} m² <span className="text-xs font-normal text-slate-500">({property.coveredArea} m² cub.)</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded text-slate-700">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Dormitorios</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {property.bedrooms} ambientes
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded text-slate-700">
              <Bath className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Baños</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {property.bathrooms} completos
              </div>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded text-slate-700">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Cocheras</div>
              <div className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {property.parkingSpots} cubiertas
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
            Memoria Técnica y Estado del Inmueble
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200/80">
            {property.description || 'Sin notas adicionales cargadas.'}
          </p>
        </div>

        {/* Tags / Amenities */}
        {property.tags && property.tags.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider mb-2">
              Características & Equipamiento
            </h4>
            <div className="flex flex-wrap gap-2">
              {property.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Agent In Charge */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={property.assignedAgent.avatar}
              alt={property.assignedAgent.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs"
            />
            <div>
              <div className="text-xs font-semibold text-slate-500">Asesora a Cargo de Mostrar</div>
              <div className="text-sm font-bold text-slate-900">{property.assignedAgent.name}</div>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
            {property.assignedAgent.phone}
          </span>
        </div>
      </div>
    </Modal>
  );
};
