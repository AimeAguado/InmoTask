import { Router } from 'express';
import { PropertyModel } from '../models/Property';
import { serializeProperty } from '../lib/serialize';
import { ApiError, asyncHandler } from '../lib/http';
import {
  asBoolean,
  asEnum,
  asNumber,
  asString,
  asStringArray,
  stripServerFields,
} from '../lib/validation';
import { requireAuth } from '../middleware/auth';
import type {
  Currency,
  KeysLocation,
  OperationType,
  PropertyStatus,
  PropertyType,
  SignageStatus,
} from '../../src/types';

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

export const propertiesRouter = Router();

propertiesRouter.use(requireAuth);

/** Mapea el body del cliente a los campos del schema, descartando lo desconocido. */
const toPropertyDoc = (body: unknown) => {
  const raw = stripServerFields(body);
  const agentRaw =
    typeof raw.assignedAgent === 'object' && raw.assignedAgent !== null
      ? (raw.assignedAgent as Record<string, unknown>)
      : {};

  return {
    code: asString(raw.code, 'code', { required: true, max: 30 }),
    title: asString(raw.title, 'title', { required: true, max: 200 }),
    type: asEnum<PropertyType>(raw.type, 'type', PROPERTY_TYPES, { required: true }),
    operation: asEnum<OperationType>(raw.operation, 'operation', OPERATION_TYPES, {
      required: true,
    }),
    status: asEnum<PropertyStatus>(raw.status, 'status', PROPERTY_STATUSES, {
      fallback: 'disponible',
    }),
    address: asString(raw.address, 'address', { max: 240 }),
    neighborhood: asString(raw.neighborhood, 'neighborhood', { max: 120 }),
    city: asString(raw.city, 'city', { max: 120 }),
    coveredArea: asNumber(raw.coveredArea, 'coveredArea'),
    totalArea: asNumber(raw.totalArea, 'totalArea'),
    bedrooms: asNumber(raw.bedrooms, 'bedrooms'),
    bathrooms: asNumber(raw.bathrooms, 'bathrooms'),
    parkingSpots: asNumber(raw.parkingSpots, 'parkingSpots'),
    keysLocation: asEnum<KeysLocation>(raw.keysLocation, 'keysLocation', KEYS_LOCATIONS, {
      fallback: 'Oficina Central',
    }),
    signageStatus: asEnum<SignageStatus>(raw.signageStatus, 'signageStatus', SIGNAGE_STATUSES, {
      fallback: 'Pendiente de Colocación',
    }),
    imageUrl: asString(raw.imageUrl, 'imageUrl', { max: 500 }),
    images: asStringArray(raw.images, 'images'),
    description: asString(raw.description, 'description', { max: 4000 }),
    price: asNumber(raw.price, 'price'),
    currency: asEnum<Currency>(raw.currency, 'currency', CURRENCIES, { fallback: 'USD' }),
    services: asString(raw.services, 'services', { max: 240 }),
    aptaCredito: asBoolean(raw.aptaCredito, false),
    financing: asString(raw.financing, 'financing', { max: 240 }),
    active: asBoolean(raw.active, true),
    source: asString(raw.source, 'source', { max: 40 }),
    signagePlaced: asBoolean(raw.signagePlaced, false),
    featured: asBoolean(raw.featured, false),
    tags: asStringArray(raw.tags, 'tags'),
    assignedAgent: {
      name: asString(agentRaw.name, 'assignedAgent.name', { required: true, max: 120 }),
      avatar: asString(agentRaw.avatar, 'assignedAgent.avatar', { max: 500 }),
      role: asString(agentRaw.role, 'assignedAgent.role', { max: 120 }),
      phone: asString(agentRaw.phone, 'assignedAgent.phone', { max: 40 }),
      email: asString(agentRaw.email, 'assignedAgent.email', { max: 160 }),
    },
  };
};

propertiesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = {};

    const status = req.query.status;
    if (typeof status === 'string' && status) {
      filter.status = asEnum<PropertyStatus>(status, 'status', PROPERTY_STATUSES, {
        required: true,
      });
    }

    const operation = req.query.operation;
    if (typeof operation === 'string' && operation) {
      filter.operation = asEnum<OperationType>(operation, 'operation', OPERATION_TYPES, {
        required: true,
      });
    }

    const q = req.query.q;
    if (typeof q === 'string' && q.trim()) {
      const needle = q.trim();
      const rx = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ title: rx }, { code: rx }, { address: rx }, { neighborhood: rx }];
    }

    const docs = await PropertyModel.find(filter).sort({ createdAt: -1 });
    res.json({ properties: docs.map(serializeProperty) });
  })
);

propertiesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await PropertyModel.findById(req.params.id);
    if (!doc) throw ApiError.notFound('Inmueble no encontrado.');
    res.json({ property: serializeProperty(doc) });
  })
);

propertiesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = toPropertyDoc(req.body);

    const duplicate = await PropertyModel.exists({ code: payload.code });
    if (duplicate) {
      throw ApiError.conflict('duplicate-code', `Ya existe un inmueble con el código ${payload.code}.`);
    }

    const created = await PropertyModel.create(payload);
    res.status(201).json({ property: serializeProperty(created) });
  })
);

propertiesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await PropertyModel.findById(req.params.id);
    if (!existing) throw ApiError.notFound('Inmueble no encontrado.');

    const payload = toPropertyDoc(req.body);
    if (payload.code !== existing.code) {
      const duplicate = await PropertyModel.exists({
        code: payload.code,
        _id: { $ne: existing._id },
      });
      if (duplicate) {
        throw ApiError.conflict(
          'duplicate-code',
          `Ya existe otro inmueble con el código ${payload.code}.`
        );
      }
    }

    existing.set(payload);
    await existing.save();
    res.json({ property: serializeProperty(existing) });
  })
);

propertiesRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await PropertyModel.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound('Inmueble no encontrado.');
    res.status(204).end();
  })
);