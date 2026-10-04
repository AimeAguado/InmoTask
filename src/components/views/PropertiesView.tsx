import React, { useState, useMemo } from 'react';
import { Property, PropertyType, OperationType, PropertyStatus, KeysLocation } from '../../types';
import { PropertyCard } from '../domain/PropertyCard';
import { Table, Column } from '../ui/Table';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FilterBar, ActiveFilterTag } from '../ui/FilterBar';
import { Select } from '../ui/Select';
import { LayoutGrid, List, Plus, Eye, Edit2, Trash2, Key, Flag } from 'lucide-react';

interface PropertiesViewProps {
  properties: Property[];
  onNewProperty: () => void;
  onEditProperty: (property: Property) => void;
  onDeleteProperty: (property: Property) => void;
  onViewDetails: (property: Property) => void;
  onScheduleVisit: (property: Property) => void;
  /** Sólo el admin puede eliminar: el botón se oculta a los asesores. */
  canDeleteProperties?: boolean;
  initialSearchQuery?: string;
}

export const PropertiesView: React.FC<PropertiesViewProps> = ({
  properties,
  onNewProperty,
  onEditProperty,
  onDeleteProperty,
  onViewDetails,
  onScheduleVisit,
  canDeleteProperties = false,
  initialSearchQuery = '',
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [keysFilter, setKeysFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtered properties (no price calculations)
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.neighborhood.toLowerCase().includes(q);

      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesOperation = operationFilter === 'all' || p.operation === operationFilter;
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesKeys = keysFilter === 'all' || p.keysLocation === keysFilter;

      return matchesSearch && matchesType && matchesOperation && matchesStatus && matchesKeys;
    });
  }, [properties, searchQuery, typeFilter, operationFilter, statusFilter, keysFilter]);

  // Active filter tags for the FilterBar
  const activeFilters = useMemo<ActiveFilterTag[]>(() => {
    const list: ActiveFilterTag[] = [];
    if (typeFilter !== 'all') {
      list.push({ id: 'type', label: 'Tipo', value: typeFilter });
    }
    if (operationFilter !== 'all') {
      list.push({ id: 'operation', label: 'Operación', value: operationFilter });
    }
    if (statusFilter !== 'all') {
      list.push({ id: 'status', label: 'Estado', value: statusFilter });
    }
    if (keysFilter !== 'all') {
      list.push({ id: 'keys', label: 'Llaves', value: keysFilter });
    }
    return list;
  }, [typeFilter, operationFilter, statusFilter, keysFilter]);

  const handleRemoveFilter = (filterId: string) => {
    if (filterId === 'type') setTypeFilter('all');
    if (filterId === 'operation') setOperationFilter('all');
    if (filterId === 'status') setStatusFilter('all');
    if (filterId === 'keys') setKeysFilter('all');
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setOperationFilter('all');
    setStatusFilter('all');
    setKeysFilter('all');
  };

  // Table columns definition (operational real estate)
  const columns: Column<Property>[] = [
    {
      id: 'image',
      header: 'Foto',
      width: '72px',
      render: (_, p) => (
        <img
          src={p.imageUrl}
          alt={p.title}
          className="w-12 h-9 rounded object-cover border border-slate-200"
        />
      ),
    },
    {
      id: 'code',
      header: 'Código',
      width: '90px',
      sortable: true,
      accessor: 'code',
      render: (code) => <span className="font-mono text-xs font-semibold text-slate-700">{code}</span>,
    },
    {
      id: 'title',
      header: 'Inmueble & Ubicación',
      sortable: true,
      render: (_, p) => (
        <div className="max-w-md">
          <div className="font-medium text-slate-900 truncate hover:text-emerald-700 transition-colors">
            {p.title}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {p.address} · <span className="font-medium">{p.neighborhood}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Tipo',
      accessor: 'type',
      width: '100px',
      sortable: true,
      render: (type) => <span className="text-xs text-slate-700">{type}</span>,
    },
    {
      id: 'operation',
      header: 'Operación',
      accessor: 'operation',
      width: '90px',
      sortable: true,
      render: (op) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200/80">
          {op}
        </span>
      ),
    },
    {
      id: 'keys',
      header: 'Control Llaves',
      accessor: 'keysLocation',
      width: '150px',
      sortable: true,
      render: (keys) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">{keys}</span>
        </div>
      ),
    },
    {
      id: 'signage',
      header: 'Cartelería',
      accessor: 'signageStatus',
      width: '140px',
      sortable: true,
      render: (sign) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Flag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="truncate">{sign}</span>
        </div>
      ),
    },
    {
      id: 'rooms',
      header: 'Amb.',
      accessor: 'bedrooms',
      align: 'center',
      width: '70px',
      sortable: true,
      render: (bed) => <span className="font-mono tabular-nums text-xs">{bed} d.</span>,
    },
    {
      id: 'area',
      header: 'Sup.',
      accessor: 'totalArea',
      align: 'center',
      width: '80px',
      sortable: true,
      render: (area) => <span className="font-mono tabular-nums text-xs">{area} m²</span>,
    },
    {
      id: 'status',
      header: 'Estado',
      accessor: 'status',
      width: '120px',
      sortable: true,
      render: (status) => <Badge status={status as PropertyStatus} size="sm" />,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '100px',
      render: (_, p) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onViewDetails(p)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Ver ficha técnica"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditProperty(p)}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded hover:bg-slate-100 transition-colors"
            title="Editar ficha"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {canDeleteProperties && (
            <button
              onClick={() => onDeleteProperty(p)}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
              title="Eliminar de cartelera"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Catálogo Operativo de Inmuebles</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Inventario físico de propiedades, control de llaves para visitas y estado de cartelería.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Grid vs Table View Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Fichas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Vista en Tabla Operativa"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onNewProperty}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Registrar Inmueble
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por código, dirección o barrio..."
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onResetFilters={handleResetFilters}
        totalResults={filteredProperties.length}
      >
        <Select
          value={operationFilter}
          onChange={(e) => setOperationFilter(e.target.value)}
          className="w-32 text-xs h-9"
          options={[
            { value: 'all', label: 'Operación: Todas' },
            { value: 'Venta', label: 'Venta' },
            { value: 'Alquiler', label: 'Alquiler' },
            { value: 'Alquiler Temporal', label: 'Temporal' },
          ]}
        />

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-36 text-xs h-9"
          options={[
            { value: 'all', label: 'Tipo: Todos' },
            { value: 'Departamento', label: 'Departamento' },
            { value: 'Casa', label: 'Casa' },
            { value: 'PH', label: 'PH' },
            { value: 'Terreno', label: 'Terreno' },
            { value: 'Oficina', label: 'Oficina' },
          ]}
        />

        <Select
          value={keysFilter}
          onChange={(e) => setKeysFilter(e.target.value)}
          className="w-36 text-xs h-9"
          options={[
            { value: 'all', label: 'Llaves: Todas' },
            { value: 'Oficina Central', label: '🔑 En Oficina' },
            { value: 'Portería', label: '🏢 En Portería' },
            { value: 'Propietario', label: '👤 Propietario' },
            { value: 'Agente a Cargo', label: '🎒 En poder de Natalia' },
          ]}
        />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-36 text-xs h-9"
          options={[
            { value: 'all', label: 'Estado: Todos' },
            { value: 'disponible', label: 'Disponible' },
            { value: 'en_visita', label: 'En Visita' },
            { value: 'reservada', label: 'Reservada' },
            { value: 'entregada', label: 'Entregada' },
            { value: 'no_disponible', label: 'No Disponible' },
          ]}
        />
      </FilterBar>

      {/* Main Content: Grid or Table */}
      {viewMode === 'grid' ? (
        filteredProperties.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center">
            <p className="font-semibold text-slate-800 text-sm">No se encontraron propiedades</p>
            <p className="text-xs text-slate-400 mt-1">Ajuste los filtros de búsqueda o registre un nuevo inmueble.</p>
            <Button variant="secondary" size="sm" onClick={handleResetFilters} className="mt-4">
              Restablecer Filtros
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onViewDetails={onViewDetails}
                onScheduleVisit={onScheduleVisit}
                onEdit={onEditProperty}
                onDelete={canDeleteProperties ? onDeleteProperty : undefined}
              />
            ))}
          </div>
        )
      ) : (
        <Table
          data={filteredProperties}
          columns={columns}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => onViewDetails(p)}
          selectedIds={selectedIds}
          onSelectRow={(id, sel) =>
            setSelectedIds((prev) => (sel ? [...prev, id] : prev.filter((item) => item !== id)))
          }
          onSelectAll={(sel) =>
            setSelectedIds(sel ? filteredProperties.map((p) => p.id) : [])
          }
          selectable
          pageSize={8}
          emptyMessage="No hay inmuebles registrados con los criterios seleccionados."
        />
      )}
    </div>
  );
};
