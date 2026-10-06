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
/**
 * 'no_disponible' es el limbo de una ficha que ya no se ofrece (el dueño la
 * retiró, se leased, la públicas por otro canal) pero cuyo historial y fotos
 * interesa conservar. Es distinto de 'entregada': no se vendió ni se alquiló,
 * simplemente dejó de estar en cartelera.
 */
export type PropertyStatus =
  | 'disponible'
  | 'en_visita'
  | 'reservada'
  | 'entregada'
  | 'no_disponible';
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

export type UserRole = 'admin' | 'asesor';

export interface Inmobiliaria {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  phone: string;
  email: string;
  logo: string;
  active: boolean;
  createdAt: string;
}

/**
 * Permisos: usuario → inmobiliaria → acceso completo a los datos operativos de
 * esa inmobiliaria (propiedades, tareas, visitas, finanzas, estadísticas).
 * No hay restricción por rol para operar. El ÚNICO permiso exclusivo del admin
 * es la gestión de usuarios de su propia inmobiliaria (crear, desactivar,
 * eliminar y listar). El backend lo valida igual aunque la UI no muestre botones.
 */
export interface RolePermissions {
  label: string;
  description: string;
  /** Único permiso exclusivo del administrador: gestión de usuarios. */
  canManageUsers: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  asesor: {
    label: 'Asesor',
    description: 'Acceso operativo completo de su inmobiliaria: propiedades, tareas, visitas y finanzas.',
    canManageUsers: false,
  },
  admin: {
    label: 'Administrador',
    description: 'Acceso operativo completo más la gestión de los usuarios de su inmobiliaria.',
    canManageUsers: true,
  },
};

export interface AppUser {
  id: string;
  /** Nombre y apellido juntos, para mostrar. Derivado por el servidor. */
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  /** Tenant del usuario. Todo lo que ve está acotado a esta inmobiliaria. */
  inmoviliariaId: string;
  /** Nombre de la inmobiliaria, resuelto en el servidor para mostrarlo junto al asesor. */
  inmoviliaria: string;
  phone?: string;
  license?: string;
  avatar?: string;
  active: boolean;
  createdAt: string; // YYYY-MM-DD
}
