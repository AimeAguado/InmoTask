export type PropertyType = 'Casa' | 'Departamento' | 'PH' | 'Terreno' | 'Oficina' | 'Local Comercial';
export type OperationType = 'Venta' | 'Alquiler' | 'Alquiler Temporal';
export type PropertyStatus = 'disponible' | 'en_visita' | 'reservada' | 'entregada';
export type KeysLocation = 'Oficina Central' | 'Portería' | 'Propietario' | 'Agente a Cargo';
export type SignageStatus = 'Cartel Colocado' | 'Sin Cartel' | 'Pendiente de Colocación';

export interface Property {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  operation: OperationType;
  status: PropertyStatus;
  address: string;
  neighborhood: string;
  city: string;
  coveredArea: number; // m2
  totalArea: number; // m2
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  keysLocation: KeysLocation;
  signageStatus: SignageStatus;
  imageUrl: string;
  description: string;
  featured: boolean;
  tags: string[];
  assignedAgent: {
    name: string;
    avatar: string;
    role: string;
    phone: string;
    email: string;
  };
  createdAt: string;
}

export type TaskPriority = 'alta' | 'media' | 'baja';
export type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';
export type TaskCategory = 'Visita' | 'Cartelería' | 'Llaves' | 'Fotografía' | 'Inspección' | 'Documentación';

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  propertyId?: string;
  propertyTitle?: string;
  assignedByDirector?: boolean;
  assignedTo: {
    name: string;
    avatar: string;
  };
  completedAt?: string;
}

export interface MetricCardData {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  timeframe?: string;
  iconName: string;
}
