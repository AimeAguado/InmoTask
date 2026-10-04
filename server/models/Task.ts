import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import type { TaskCategory, TaskPriority, TaskStatus } from '../../src/types';

const TASK_CATEGORIES: readonly TaskCategory[] = [
  'Visita',
  'Cartelería',
  'Llaves',
  'Fotografía',
  'Inspección',
  'Documentación',
];

const TASK_PRIORITIES: readonly TaskPriority[] = ['alta', 'media', 'baja'];

const TASK_STATUSES: readonly TaskStatus[] = ['pendiente', 'en_progreso', 'completada'];

export const taskSchema = new Schema(
  {
    // Tenant: toda lectura y escritura de tareas se acota a la inmobiliaria del
    // usuario. Sin este campo, dos inmobiliarias verían la misma agenda.
    inmoviliariaId: {
      type: Schema.Types.ObjectId,
      ref: 'Inmobiliaria',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, enum: TASK_CATEGORIES, required: true },
    priority: { type: String, enum: TASK_PRIORITIES, required: true, default: 'media' },
    status: { type: String, enum: TASK_STATUSES, required: true, default: 'pendiente' },
    dueDate: { type: Date, required: true },
    dueTime: { type: String, default: '' },
    // Referencia al inmueble y no un id suelto: una visita sin propiedad
    // asociada queda huérfana en el cliente si el inmueble se borra.
    property: { type: Schema.Types.ObjectId, ref: 'Property', default: null },
    propertyTitle: { type: String, default: '' },
    assignedByDirector: { type: Boolean, default: false },
    assignedTo: {
      type: {
        name: { type: String, required: true, trim: true },
        avatar: { type: String, default: '' },
      },
      required: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// La agenda ordena por vencimiento y filtra por estado en cada render.
taskSchema.index({ dueDate: 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ property: 1 });

export const TaskModel = model('Task', taskSchema);

/** Tipo del documento hydrated: lo que devuelve Model.find()/create(). */
export type TaskDoc = HydratedDocument<InferSchemaType<typeof taskSchema>>;