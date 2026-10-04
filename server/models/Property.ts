import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import type {
  Currency,
  KeysLocation,
  OperationType,
  PropertyStatus,
  PropertyType,
  SignageStatus,
} from '../../src/types/index.js';

// Los valores salen de la app para que el enum de Mongo y la UI no puedan
// divergir. El anotado con el tipo unión hace que TS falle si alguien agrega un
// valor en src/types y se olvida de reflejarlo acá.
const PROPERTY_TYPES: readonly PropertyType[] = [
  'Casa',
  'Casa PH',
  'Casa Interna',
  'Departamento',
  'PH',
  'Terreno',
  'Oficina',
  'Local',
  'Local Comercial',
  'Galpón',
  'Quinta',
  'Complejo',
  'Fondo de Comercio',
];

const CURRENCIES: readonly Currency[] = ['USD', 'ARS'];

const OPERATION_TYPES: readonly OperationType[] = ['Venta', 'Alquiler', 'Alquiler Temporal'];

const PROPERTY_STATUSES: readonly PropertyStatus[] = [
  'disponible',
  'en_visita',
  'reservada',
  'entregada',
  'no_disponible',
];

const KEYS_LOCATIONS: readonly KeysLocation[] = [
  'Oficina Central',
  'Portería',
  'Propietario',
  'Agente a Cargo',
];

const SIGNAGE_STATUSES: readonly SignageStatus[] = [
  'Cartel Colocado',
  'Sin Cartel',
  'Pendiente de Colocación',
];

const assignedAgentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    role: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
);

export const propertySchema = new Schema(
  {
    // Tenant: la cartera de cada inmobiliaria es privada. Todos los listados y
    // accesos por id de /api/properties se filtran por este campo.
    inmoviliariaId: {
      type: Schema.Types.ObjectId,
      ref: 'Inmobiliaria',
      required: true,
      index: true,
    },
    code: { type: String, required: true, trim: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: PROPERTY_TYPES, required: true },
    operation: { type: String, enum: OPERATION_TYPES, required: true },
    status: { type: String, enum: PROPERTY_STATUSES, required: true, default: 'disponible' },
    address: { type: String, default: '' },
    neighborhood: { type: String, default: '' },
    city: { type: String, default: '' },
    coveredArea: { type: Number, default: 0, min: 0 },
    totalArea: { type: Number, default: 0, min: 0 },
    bedrooms: { type: Number, default: 0, min: 0 },
    bathrooms: { type: Number, default: 0, min: 0 },
    parkingSpots: { type: Number, default: 0, min: 0 },
    keysLocation: { type: String, enum: KEYS_LOCATIONS, default: 'Oficina Central' },
    signageStatus: { type: String, enum: SIGNAGE_STATUSES, default: 'Pendiente de Colocación' },
    imageUrl: { type: String, default: '' },
    // Todas las fotos de la ficha, no solo la portada: la importación trae
    // galerías completas desde Drive y imageUrl apunta a la primera.
    images: { type: [String], default: [] },
    description: { type: String, default: '' },
    // Datos de la planilla de captación: el precio es el dato que más se consulta
    // y no estaba modelado. 0 significa "a consultar" porque hay publicaciones
    // como "CHARLABLE" que no tienen cifra.
    price: { type: Number, default: 0, min: 0 },
    currency: { type: String, enum: CURRENCIES, default: 'USD' },
    services: { type: String, default: '' },
    aptaCredito: { type: Boolean, default: false },
    financing: { type: String, default: '' },
    active: { type: Boolean, default: true },
    signagePlaced: { type: Boolean, default: false },
    // De dónde salió la ficha: '' = cargada a mano, 'captacion' = importada del
    // PDF. El importador usa este campo para retirar solo lo que él puso, en vez
    // de depender de un rango de códigos que una carga manual podría pisar.
    source: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    assignedAgent: { type: assignedAgentSchema, required: true },
  },
  { timestamps: true }
);

// El código es la clave de negocio que ve la gente (INM-1042), no el _id: tiene
// que ser único o la cartelera muestra dos fichas indistinguibles. Único DENTRO
// de la inmobiliaria: si dos empresas distintas pueden tener su propia INM-1042,
// el índice global las chocaría entre sí.
propertySchema.index({ inmoviliariaId: 1, code: 1 }, { unique: true });
propertySchema.index({ status: 1 });
propertySchema.index({ operation: 1 });
// La planilla se importa y después se filtra por what's activo/publicado.
propertySchema.index({ active: 1 });
propertySchema.index({ source: 1 });
propertySchema.index({ createdAt: -1 });
// Respalda la búsqueda global de la barra superior.
propertySchema.index(
  { title: 'text', address: 'text', neighborhood: 'text', city: 'text', code: 'text' },
  { name: 'property_search' }
);

export const PropertyModel = model('Property', propertySchema);

/** Tipo del documento hydrated: lo que devuelve Model.find()/create(). */
export type PropertyDoc = HydratedDocument<InferSchemaType<typeof propertySchema>>;