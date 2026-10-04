import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import type { FinancialCategory, FinancialEntryType } from '../../src/types/index.js';

const ENTRY_TYPES: readonly FinancialEntryType[] = ['ingreso', 'egreso'];

const ENTRY_CATEGORIES: readonly FinancialCategory[] = [
  'Comisiones por Venta',
  'Comisiones por Alquiler',
  'Honorarios de Administración',
  'Marketing y Cartelería',
  'Sueldos y Cargas Sociales',
  'Alquileres y Servicios',
  'Tecnología y Software',
  'Impuestos y Tasas',
];

export const financialEntrySchema = new Schema(
  {
    // Tenant: los finanzas de una inmobiliaria no son visibles para otra.
    inmoviliariaId: {
      type: Schema.Types.ObjectId,
      ref: 'Inmobiliaria',
      required: true,
      index: true,
    },
    type: { type: String, enum: ENTRY_TYPES, required: true },
    category: { type: String, enum: ENTRY_CATEGORIES, required: true },
    concept: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    propertyCode: { type: String, default: '' },
  },
  { timestamps: true }
);

// Los tableros financieros agregan por mes, así que el rango de fechas es la
// consulta caliente junto con el desglose por categoría.
financialEntrySchema.index({ date: -1 });
financialEntrySchema.index({ category: 1, date: -1 });

export const FinancialEntryModel = model('FinancialEntry', financialEntrySchema);

/** Tipo del documento hydrated: lo que devuelve Model.find()/create(). */
export type FinancialEntryDoc = HydratedDocument<
  InferSchemaType<typeof financialEntrySchema>
>;