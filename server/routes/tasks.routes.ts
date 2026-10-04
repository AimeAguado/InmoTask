import { Router } from 'express';
import { TaskModel } from '../models/Task';
import { PropertyModel } from '../models/Property';
import { serializeTask } from '../lib/serialize';
import { ApiError, asyncHandler } from '../lib/http';
import { asBoolean, asEnum, asHhMm, asString, asYmdDate, stripServerFields } from '../lib/validation';
import { requireAuth, scope } from '../middleware/auth';
import type { TaskCategory, TaskPriority, TaskStatus } from '../../src/types';

const CATEGORIES: readonly TaskCategory[] = [
  'Visita',
  'Cartelería',
  'Llaves',
  'Fotografía',
  'Inspección',
  'Documentación',
];

const PRIORITIES: readonly TaskPriority[] = ['alta', 'media', 'baja'];
const STATUSES: readonly TaskStatus[] = ['pendiente', 'en_progreso', 'completada'];

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

/**
 * Resuelve el id de inmueble a ObjectId y devuelve también el título, que se
 * persiste desnormalizado: la tarjeta de la agenda muestra el nombre del
 * inmueble aunque la referencia no se haya populado.
 */
const resolveProperty = async (propertyId: unknown) => {
  const raw = asString(propertyId, 'propertyId', { max: 40 });
  if (!raw) return { property: null, propertyTitle: '' };

  if (!/^[a-fA-F0-9]{24}$/.test(raw)) {
    throw ApiError.badRequest('invalid_id', 'El identificador de inmueble no es válido.');
  }

  const property = await PropertyModel.findById(raw).select('title');
  if (!property) throw ApiError.badRequest('unknown_property', 'El inmueble no existe.');

  return { property: property._id, propertyTitle: property.title as string };
};

const toTaskDoc = async (body: unknown) => {
  const raw = stripServerFields(body);
  const { property, propertyTitle } = await resolveProperty(raw.propertyId);
  const assigneeRaw =
    typeof raw.assignedTo === 'object' && raw.assignedTo !== null
      ? (raw.assignedTo as Record<string, unknown>)
      : {};

  return {
    title: asString(raw.title, 'title', { required: true, max: 200 }),
    description: asString(raw.description, 'description', { max: 4000 }),
    category: asEnum<TaskCategory>(raw.category, 'category', CATEGORIES, { required: true }),
    priority: asEnum<TaskPriority>(raw.priority, 'priority', PRIORITIES, { fallback: 'media' }),
    status: asEnum<TaskStatus>(raw.status, 'status', STATUSES, { fallback: 'pendiente' }),
    dueDate: asYmdDate(raw.dueDate, 'dueDate'),
    dueTime: asHhMm(raw.dueTime, 'dueTime') ?? '',
    property,
    propertyTitle,
    assignedByDirector: asBoolean(raw.assignedByDirector, false),
    assignedTo: {
      name: asString(assigneeRaw.name, 'assignedTo.name', { required: true, max: 120 }),
      avatar: asString(assigneeRaw.avatar, 'assignedTo.avatar', { max: 500 }),
    },
    completedAt:
      raw.status === 'completada'
        ? new Date()
        : (raw.completedAt ? new Date(String(raw.completedAt)) : null),
  };
};

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { ...scope(req) };

    const status = req.query.status;
    if (typeof status === 'string' && status) {
      filter.status = asEnum<TaskStatus>(status, 'status', STATUSES, { required: true });
    }

    const from = req.query.from;
    if (typeof from === 'string' && from) {
      filter.dueDate = { ...(filter.dueDate as object), $gte: asYmdDate(from, 'from', false) };
    }

    const to = req.query.to;
    if (typeof to === 'string' && to) {
      filter.dueDate = { ...(filter.dueDate as object), $lte: asYmdDate(to, 'to', false) };
    }

    const docs = await TaskModel.find(filter).sort({ dueDate: 1, dueTime: 1 });
    res.json({ tasks: docs.map(serializeTask) });
  })
);

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const created = await TaskModel.create({
      ...(await toTaskDoc(req.body)),
      inmoviliariaId: req.user!.inmoviliariaId,
    });
    res.status(201).json({ task: serializeTask(created) });
  })
);

tasksRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await TaskModel.findOne({ ...scope(req), _id: req.params.id });
    if (!existing) throw ApiError.notFound('Tarea no encontrada.');

    existing.set(await toTaskDoc(req.body));
    await existing.save();
    res.json({ task: serializeTask(existing) });
  })
);

/** Cambio de estado aislado: la agenda lo usa para completar y mover tarjetas
 *  sin mandar el objeto entero y arriesgarse a pisar campos de otro editing. */
tasksRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const status = asEnum<TaskStatus>(req.body?.status, 'status', STATUSES, { required: true });

    // El filtro del tenant va en la misma query que el _id: sin él, un id
    // adivinado de otra inmobiliaria dejaría editarse una tarea ajena.
    const doc = await TaskModel.findOneAndUpdate(
      { ...scope(req), _id: req.params.id },
      { status, completedAt: status === 'completada' ? new Date() : null },
      { new: true, runValidators: true }
    );

    if (!doc) throw ApiError.notFound('Tarea no encontrada.');
    res.json({ task: serializeTask(doc) });
  })
);

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const doc = await TaskModel.findOneAndDelete({ ...scope(req), _id: req.params.id });
    if (!doc) throw ApiError.notFound('Tarea no encontrada.');
    res.status(204).end();
  })
);