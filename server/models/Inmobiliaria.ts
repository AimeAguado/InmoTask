import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';

/**
 * La inmobiliaria es el tenant: la frontera de aislamiento de todos los datos.
 *
 * No existe un super-admin en la app, así que las inmobiliarias se dan de alta
 * desde el script server/create-inmoviliaria.ts. Cada una nace con su usuario
 * admin, que es el único que puede dar de alta asesores y ver los finanzas de
 * SU empresa.
 */
export const inmobiliariaSchema = new Schema(
  {
    // Nombre comercial, el que se muestra en la interfaz y en las fichas.
    name: { type: String, required: true, trim: true, max: 120 },
    // Razón social y CUIT: datos fiscales, opcionales porque un monotributista
    // puede no tener el CUIT cargado todavía.
    legalName: { type: String, default: '', trim: true, max: 160 },
    taxId: { type: String, default: '', trim: true, max: 32 },
    phone: { type: String, default: '', trim: true, max: 40 },
    email: { type: String, default: '', trim: true, lowercase: true, max: 160 },
    logo: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// La búsqueda del selector de sesión y de la lista de empresas.
inmobiliariaSchema.index({ name: 1 });
inmobiliariaSchema.index({ active: 1 });

export const InmobiliariaModel = model('Inmobiliaria', inmobiliariaSchema);

/** Tipo del documento hydrated: lo que devuelve Model.find()/create(). */
export type InmobiliariaDoc = HydratedDocument<InferSchemaType<typeof inmobiliariaSchema>>;
