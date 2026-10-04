import type { AppUserDoc } from '../models/AppUser.js';
import mongoose from 'mongoose';
import type { FinancialEntryDoc } from '../models/FinancialEntry.js';
import type { PropertyDoc } from '../models/Property.js';
import type { TaskDoc } from '../models/Task.js';
import type { AppUser, FinancialEntry, Property, Task } from '../../src/types/index.js';

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
 * Lee la referencia a la inmobiliaria tolerando los dos casos de mongoose.
 *
 * OJO con distinguir un ObjectId "puro" de un documento populado: bson define un
 * getter `_id` en ObjectId que devuelve el propio ObjectId, así que un chequeo
 * del tipo `'_id' in ref` da TRUE en los dos casos y el nombre se pierde siempre
 * (manda el `populated.name` de un ObjectId, que es undefined). Por eso el
 * `instanceof ObjectId` va primero.
 *
 * - Sin populate, el campo es un ObjectId: se usa su id y el nombre que pasó el
 *   caller (que ya lo consultó).
 * - Con populate, mongoose reemplaza el campo por el documento entero: si se
 *   hiciera String() a secas se devolvería el nombre de la empresa en el lugar
 *   del id.
 */
const readTenant = (ref: unknown, fallbackName?: string): { id: string; name: string } => {
  if (ref instanceof mongoose.Types.ObjectId) {
    return { id: String(ref), name: fallbackName ?? '' };
  }

  if (typeof ref === 'string' && ref.trim()) {
    return { id: ref, name: fallbackName ?? '' };
  }

  if (ref && typeof ref === 'object' && '_id' in ref) {
    const populated = ref as { _id: unknown; name?: unknown };
    return {
      id: String(populated._id),
      name: populated.name ? String(populated.name) : (fallbackName ?? ''),
    };
  }

  return { id: '', name: fallbackName ?? '' };
};

/**
 * El passwordHash nunca sale de acá: el schema lo tiene en select:false y esta
 * función ni siquiera lo menciona, así que no hay forma de filtrarlo por error.
 *
 * `inmoviliariaName` es para los callers que ya tienen el nombre a mano (por
 * ejemplo el login, que consulta la empresa aparte) y no hicieron populate.
 */
export const serializeUser = (doc: AppUserDoc, inmobiliariaName?: string): AppUser => {
  const tenant = readTenant(doc.inmoviliariaId, inmobiliariaName);

  return {
    id: String(doc._id),
    name: doc.name,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    role: doc.role,
    inmoviliariaId: tenant.id,
    inmoviliaria: tenant.name,
    phone: opt(doc.phone),
    license: opt(doc.license),
    avatar: opt(doc.avatar),
    active: doc.active,
    createdAt: ymd(doc.createdAt) ?? '',
  };
};