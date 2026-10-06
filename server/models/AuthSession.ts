import { Schema, model } from 'mongoose';

/**
 * Sesión activa registrada en el servidor.
 *
 * El JWT que vive en la cookie httpOnly lleva un `jti` que apunta acá: sin este
 * documento la sesión no vale. Así cerrar sesión es una baja real (se borra el
 * documento) y no "olvidar la cookie": un token robado deja de servir apenas se
 * revoca, aunque no haya expirado.
 *
 * Las filas se limpian solas: `expiresAt` con el índice TTL las borra a las 12 h,
 * así que la colección no acumula sesiones abandonadas.
 */
const authSessionSchema = new Schema(
  {
    jti: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'AppUser', required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL: Mongo borra el documento automáticamente después de expiresAt.
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AuthSessionModel = model('AuthSession', authSessionSchema);