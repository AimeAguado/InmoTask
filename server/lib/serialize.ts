import type { AppUserDoc } from '../models/AppUser';
import type { FinancialEntryDoc } from '../models/FinancialEntry';
import type { PropertyDoc } from '../models/Property';
import type { TaskDoc } from '../models/Task';
import type { AppUser, FinancialEntry, Property, Task } from '../../src/types';

/**
 * La UI trabaja con fechas como 'YYYY-MM-DD' (ver src/types). Mongo las guarda
 * como Date, así que la frontera API→cliente tiene que hacer la traducción.
 * Recortar el ISO a 10 caracteres conserva el día en UTC, que es como el
 * cliente parsea las fechas sin zona horaria.
 */
const ymd = (value: Date | null | undefined): string | undefined =>
  value ? value.toISOString().slice(0, 10) : undefined;

/** Los opcionales del cliente llegan como '' en Mongo; '' no es lo mismo que
 *  "no informado", así que se colapsan a undefined. */
const opt = (value: string | null | undefined): string | undefined =>
  value ? value : undefined;

export const serializeProperty = (doc: PropertyDoc): Property => ({
  id: String(doc._id),
  code: doc.code,
  title: doc.title,
  type: doc.type,
  operation: doc.operation,
  status: doc.status,
  address: doc.address,
  neighborhood: doc.neighborhood,
  city: doc.city,
  coveredArea: doc.coveredArea,
  totalArea: doc.totalArea,
  bedrooms: doc.bedrooms,
  bathrooms: doc.bathrooms,
  parkingSpots: doc.parkingSpots,
  keysLocation: doc.keysLocation,
  signageStatus: doc.signageStatus,
  imageUrl: doc.imageUrl,
  images: doc.images,
  description: doc.description,
  price: doc.price,
  currency: doc.currency,
  services: doc.services,
  aptaCredito: doc.aptaCredito,
  financing: doc.financing,
  active: doc.active,
  source: doc.source,
  signagePlaced: doc.signagePlaced,
  featured: doc.featured,
  tags: doc.tags,
  assignedAgent: {
    name: doc.assignedAgent.name,
    avatar: doc.assignedAgent.avatar,
    role: doc.assignedAgent.role,
    phone: doc.assignedAgent.phone,
    email: doc.assignedAgent.email,
  },
  createdAt: ymd(doc.createdAt) ?? '',
});

export const serializeTask = (doc: TaskDoc): Task => ({
  id: String(doc._id),
  title: doc.title,
  description: opt(doc.description),
  category: doc.category,
  priority: doc.priority,
  status: doc.status,
  dueDate: ymd(doc.dueDate) ?? '',
  dueTime: opt(doc.dueTime),
  // populate no se usa a propósito: el _id está en el campo aunque la referencia
  // no se haya resuelto, y la agenda no necesita el documento del inmueble.
  propertyId: doc.property ? String(doc.property) : undefined,
  propertyTitle: opt(doc.propertyTitle),
  assignedByDirector: doc.assignedByDirector,
  assignedTo: {
    name: doc.assignedTo.name,
    avatar: opt(doc.assignedTo.avatar),
  },
  completedAt: doc.completedAt?.toISOString(),
});

export const serializeEntry = (doc: FinancialEntryDoc): FinancialEntry => ({
  id: String(doc._id),
  type: doc.type,
  category: doc.category,
  concept: doc.concept,
  amount: doc.amount,
  date: ymd(doc.date) ?? '',
  propertyCode: opt(doc.propertyCode),
});

/**
 * El passwordHash nunca sale de acá: el schema lo tiene en select:false y esta
 * función ni siquiera lo menciona, así que no hay forma de filtrarlo por error.
 */
export const serializeUser = (doc: AppUserDoc): AppUser => ({
  id: String(doc._id),
  name: doc.name,
  email: doc.email,
  role: doc.role,
  phone: opt(doc.phone),
  license: opt(doc.license),
  avatar: opt(doc.avatar),
  active: doc.active,
  createdAt: ymd(doc.createdAt) ?? '',
});