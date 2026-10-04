export type PropertyType =
  | 'Casa'
  | 'Casa PH'
  | 'Casa Interna'
  | 'Departamento'
  | 'PH'
  | 'Terreno'
  | 'Oficina'
  | 'Local'
  | 'Local Comercial'
  | 'Galpón'
  | 'Quinta'
  | 'Complejo'
  | 'Fondo de Comercio';

/** Moneda del precio. El PDF usa USD y $ (pesares) según la publicación. */
export type Currency = 'USD' | 'ARS';
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
  /** Galería completa; imageUrl es la portada. */
  images: string[];
  description: string;
  /** Precio de venta o alquiler en la moneda indicada. 0 = "a consultar". */
  price: number;
  currency: Currency;
  /** "Todos los servicios", "Gas y luz", etc. Texto libre del PDF. */
  services: string;
  /** El dueño acepta crédito hipotecario. */
  aptaCredito: boolean;
  /** Condiciones de permuta o financing: "50% Entrega, 50% Financia". */
  financing: string;
  /** true = publicación activa; false = pausada. */
  active: boolean;
  /** '' = cargada a mano, 'captacion' = importada del PDF de captación. */
  source: string;
  /** true = tiene cartel colocado ("Placas" = Si en el PDF). */
  signagePlaced: boolean;
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
    avatar?: string;
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

export type FinancialEntryType = 'ingreso' | 'egreso';

export type FinancialCategory =
  | 'Comisiones por Venta'
  | 'Comisiones por Alquiler'
  | 'Honorarios de Administración'
  | 'Marketing y Cartelería'
  | 'Sueldos y Cargas Sociales'
  | 'Alquileres y Servicios'
  | 'Tecnología y Software'
  | 'Impuestos y Tasas';

export interface FinancialEntry {
  id: string;
  type: FinancialEntryType;
  category: FinancialCategory;
  concept: string;
  amount: number;
  date: string; // YYYY-MM-DD
  propertyCode?: string;
}

export type UserRole = 'asesor' | 'jefatura';

export interface RolePermissions {
  label: string;
  description: string;
  canViewFinancials: boolean;
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  asesor: {
    label: 'Asesor',
    description: 'Opera la cartera de inmuebles y la agenda de tareas.',
    canViewFinancials: false,
    canManageUsers: false,
  },
  jefatura: {
    label: 'Jefatura',
    description: 'Acceso completo, incluyendo resultados financieros y alta de usuarios.',
    canViewFinancials: true,
    canManageUsers: true,
  },
};

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  license?: string;
  avatar?: string;
  active: boolean;
  createdAt: string; // YYYY-MM-DD
}
