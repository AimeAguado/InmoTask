import { Schema, model } from 'mongoose';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import type { UserRole } from '../../src/types/index.js';

const USER_ROLES: readonly UserRole[] = ['admin', 'asesor'];

export const appUserSchema = new Schema(
  {
    // firstName/lastName son la verdad y se editan por separado; `name` es
    // derivado y sólo se usa para mostrar. Se guarda en el documento para que un
    // listado no tenga que concatenar en cada cliente.
    firstName: { type: String, required: true, trim: true, max: 80 },
    lastName: { type: String, required: true, trim: true, max: 80 },
    name: { type: String, required: true, trim: true, max: 160 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    // select:false lo esconde de cualquier find() que no lo pida explícito, para
    // que un forgot de populate no termine filtrando hashes a la respuesta.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true, default: 'asesor' },
    // Obligatorio: un usuario sin tenant vería la cartera de todas las
    // inmobiliarias, que es exactamente el aislamiento que este cambio agrega.
    inmoviliariaId: {
      type: Schema.Types.ObjectId,
      ref: 'Inmobiliaria',
      required: true,
      index: true,
    },
    phone: { type: String, default: '' },
    license: { type: String, default: '' },
    avatar: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// El índice de email único ya lo crea el campo con `unique: true`. Declararlo
// otra vez por schema.index() generaba un duplicado con otro nombre, que es
// ruido y hace fallar createIndex() si se reconstruyen los índices.
// El de active sirve para el listado de usuarios del admin.
appUserSchema.index({ active: 1 });
// El listado de usuarios del admin siempre filtra por inmobiliaria.
appUserSchema.index({ inmoviliariaId: 1, active: 1 });

export const AppUserModel = model('AppUser', appUserSchema);

/** Tipo del documento hydrated: lo que devuelve Model.find()/create(). */
export type AppUserDoc = HydratedDocument<InferSchemaType<typeof appUserSchema>>;
