import React, { useState, useEffect } from 'react';
import { Property, PropertyType, OperationType, PropertyStatus, KeysLocation, SignageStatus } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { CURRENT_AGENT } from '../../data/mockData';

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: Property) => void;
  propertyToEdit?: Property | null;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  propertyToEdit,
}) => {
  const [formData, setFormData] = useState<Partial<Property>>({
    title: '',
    type: 'Departamento',
    operation: 'Venta',
    status: 'disponible',
    address: '',
    neighborhood: '',
    city: 'Buenos Aires',
    coveredArea: 65,
    totalArea: 75,
    bedrooms: 2,
    bathrooms: 1,
    parkingSpots: 1,
    keysLocation: 'Oficina Central',
    signageStatus: 'Cartel Colocado',
    imageUrl: '/src/assets/images/prop_modern_home_1790435612450.jpg',
    description: '',
    featured: false,
    tags: ['Luminoso', 'Balcón'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (propertyToEdit) {
      setFormData(propertyToEdit);
    } else {
      setFormData({
        title: '',
        type: 'Departamento',
        operation: 'Venta',
        status: 'disponible',
        address: '',
        neighborhood: '',
        city: 'Buenos Aires',
        coveredArea: 70,
        totalArea: 80,
        bedrooms: 2,
        bathrooms: 1,
        parkingSpots: 1,
        keysLocation: 'Oficina Central',
        signageStatus: 'Cartel Colocado',
        imageUrl: '/src/assets/images/prop_luxury_villa_1790435591462.jpg',
        description: '',
        featured: false,
        tags: ['Balcón', 'Parrilla'],
      });
    }
    setErrors({});
  }, [propertyToEdit, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title?.trim()) newErrors.title = 'El título de la propiedad es obligatorio';
    if (!formData.address?.trim()) newErrors.address = 'La dirección física es obligatoria';
    if (!formData.neighborhood?.trim()) newErrors.neighborhood = 'El barrio o zona es obligatorio';
    if (!formData.totalArea || formData.totalArea <= 0) newErrors.totalArea = 'La superficie total debe ser mayor a 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const property: Property = {
      id: propertyToEdit ? propertyToEdit.id : `prop-${Date.now()}`,
      code: propertyToEdit ? propertyToEdit.code : `INM-${Math.floor(1000 + Math.random() * 9000)}`,
      title: formData.title || '',
      type: (formData.type as PropertyType) || 'Departamento',
      operation: (formData.operation as OperationType) || 'Venta',
      status: (formData.status as PropertyStatus) || 'disponible',
      address: formData.address || '',
      neighborhood: formData.neighborhood || '',
      city: formData.city || 'Buenos Aires',
      coveredArea: Number(formData.coveredArea || 0),
      totalArea: Number(formData.totalArea || 0),
      bedrooms: Number(formData.bedrooms || 0),
      bathrooms: Number(formData.bathrooms || 0),
      parkingSpots: Number(formData.parkingSpots || 0),
      keysLocation: (formData.keysLocation as KeysLocation) || 'Oficina Central',
      signageStatus: (formData.signageStatus as SignageStatus) || 'Cartel Colocado',
      imageUrl: formData.imageUrl || '/src/assets/images/prop_modern_home_1790435612450.jpg',
      images: propertyToEdit ? propertyToEdit.images : [],
      description: formData.description || '',
      price: propertyToEdit ? propertyToEdit.price : 0,
      currency: propertyToEdit ? propertyToEdit.currency : 'USD',
      services: propertyToEdit ? propertyToEdit.services : '',
      aptaCredito: propertyToEdit ? propertyToEdit.aptaCredito : false,
      financing: propertyToEdit ? propertyToEdit.financing : '',
      active: propertyToEdit ? propertyToEdit.active : true,
      source: propertyToEdit ? propertyToEdit.source : '',
      signagePlaced: propertyToEdit ? propertyToEdit.signagePlaced : false,
      featured: Boolean(formData.featured),
      tags: formData.tags || [],
      assignedAgent: CURRENT_AGENT,
      createdAt: propertyToEdit ? propertyToEdit.createdAt : new Date().toISOString().split('T')[0],
    };

    onSave(property);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={propertyToEdit ? 'Editar Ficha de Inmueble' : 'Registrar Nuevo Inmueble'}
      subtitle="Complete los datos físicos, llaves y ubicación para la organización operativa."
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {propertyToEdit ? 'Guardar Cambios' : 'Registrar Inmueble'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <Input
          label="Título descriptivo del inmueble"
          placeholder="Ej: Semipiso con balcón terraza y cochera fija"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          required
        />

        {/* Row 1: Type, Operation, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Tipo de Propiedad"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as PropertyType })}
            options={[
              { value: 'Departamento', label: 'Departamento' },
              { value: 'Casa', label: 'Casa' },
              { value: 'PH', label: 'PH' },
              { value: 'Terreno', label: 'Terreno / Lote' },
              { value: 'Oficina', label: 'Oficina' },
              { value: 'Local Comercial', label: 'Local Comercial' },
            ]}
          />
          <Select
            label="Operación"
            value={formData.operation}
            onChange={(e) => setFormData({ ...formData, operation: e.target.value as OperationType })}
            options={[
              { value: 'Venta', label: 'Venta' },
              { value: 'Alquiler', label: 'Alquiler' },
              { value: 'Alquiler Temporal', label: 'Alquiler Temporal' },
            ]}
          />
          <Select
            label="Estado del Inmueble"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as PropertyStatus })}
            options={[
              { value: 'disponible', label: 'Disponible para mostrar' },
              { value: 'en_visita', label: 'En Visita / Agendado' },
              { value: 'reservada', label: 'Reservada' },
              { value: 'entregada', label: 'Entregada / Concluida' },
              { value: 'no_disponible', label: 'No Disponible (fuera de cartelera)' },
            ]}
          />
        </div>

        {/* Row 2: Keys Location & Signage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <Select
            label="Control y Ubicación de Llaves"
            value={formData.keysLocation}
            onChange={(e) => setFormData({ ...formData, keysLocation: e.target.value as KeysLocation })}
            options={[
              { value: 'Oficina Central', label: '🔑 Oficina Central (Tablero)' },
              { value: 'Portería', label: '🏢 Portería del Edificio' },
              { value: 'Propietario', label: '👤 Propietario (Coordina jefe)' },
              { value: 'Agente a Cargo', label: '🎒 En poder de Natalia' },
            ]}
            helperText="Indica dónde retirar la llave antes de salir a la visita."
          />

          <Select
            label="Estado del Cartel Inmobiliario"
            value={formData.signageStatus}
            onChange={(e) => setFormData({ ...formData, signageStatus: e.target.value as SignageStatus })}
            options={[
              { value: 'Cartel Colocado', label: '✅ Cartel Colocado en Frente' },
              { value: 'Sin Cartel', label: '⚪ Sin Cartel' },
              { value: 'Pendiente de Colocación', label: '⏳ Pendiente de Colocación' },
            ]}
            helperText="Control de cartelería en fachada o balcón."
          />
        </div>

        {/* Row 3: Address, Neighborhood, City */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Dirección y Número"
            placeholder="Ej: Av. Libertador 4200"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            error={errors.address}
            required
          />
          <Input
            label="Barrio / Localidad"
            placeholder="Ej: Belgrano / La Horqueta"
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            error={errors.neighborhood}
            required
          />
          <Input
            label="Ciudad / Provincia"
            placeholder="Ej: Buenos Aires"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        {/* Row 4: Metrics (Total Area, Covered Area, Bedrooms, Bathrooms, Parking) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Input
            label="Sup. Total (m²)"
            type="number"
            value={formData.totalArea || ''}
            onChange={(e) => setFormData({ ...formData, totalArea: Number(e.target.value) })}
            error={errors.totalArea}
            required
          />
          <Input
            label="Sup. Cubierta (m²)"
            type="number"
            value={formData.coveredArea || ''}
            onChange={(e) => setFormData({ ...formData, coveredArea: Number(e.target.value) })}
          />
          <Input
            label="Dormitorios"
            type="number"
            value={formData.bedrooms || ''}
            onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
          />
          <Input
            label="Baños"
            type="number"
            value={formData.bathrooms || ''}
            onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
          />
          <Input
            label="Cocheras"
            type="number"
            value={formData.parkingSpots || ''}
            onChange={(e) => setFormData({ ...formData, parkingSpots: Number(e.target.value) })}
          />
        </div>

        {/* Image selector */}
        <Select
          label="Foto principal del inmueble"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          options={[
            { value: '/src/assets/images/prop_luxury_villa_1790435591462.jpg', label: 'Casa con Piscina y Jardín' },
            { value: '/src/assets/images/prop_penthouse_1790435602518.jpg', label: 'Penthouse / Departamento' },
            { value: '/src/assets/images/prop_modern_home_1790435612450.jpg', label: 'Casa Escandinava en Nordelta' },
          ]}
        />

        {/* Description */}
        <Textarea
          label="Memoria técnica y observaciones"
          placeholder="Estado de conservación, servicios, orientación, detalles constructivos..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />

        {/* Checkbox: Destacada */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="featured"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-4 h-4 cursor-pointer"
          />
          <label htmlFor="featured" className="text-xs font-medium text-slate-700 cursor-pointer">
            Marcar como inmueble prioritario en cartelera
          </label>
        </div>
      </form>
    </Modal>
  );
};
