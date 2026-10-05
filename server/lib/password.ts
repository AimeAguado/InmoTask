/**
 * Política de contraseñas en un solo lugar.
 *
 * La usan tanto el alta de usuarios (POST /api/users) como el cambio de
 * contraseña propia (PATCH /api/auth/password). Tener el mínimo y las rondas de
 * bcrypt duplicados en dos routers invitaba a que uno se actualizara y el otro
 * no: el resultado sería que un usuario podría crear una contraseña más corta
 * que la que le dejarían cambiar.
 */
import bcrypt from 'bcryptjs';
import { ApiError } from './http.js';

/**
 * 12 rondas. Subirlo multiplica por diez el costo de CADA login, y el login es la
 * operación más frecuente del sistema; bajarlo a 10 abriría la puerta a que un
 * hash robado se revierta con una GPU.
 */
export const SALT_ROUNDS = 12;

/** 8 caracteres: el mínimo histórico del proyecto. */
export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, SALT_ROUNDS);

/**
 * Comprueba contra el hash guardado. Nunca comparar contraseñas con `===`: el
 * hash tiene salt y da un resultado distinto cada vez.
 */
export const verifyPassword = (plain: string, hash: string): Promise<boolean> =>
  bcrypt.compare(plain, hash);

/** Corta con un 400 si no cumple el mínimo. */
export const assertPasswordStrength = (plain: string): void => {
  if (plain.length < MIN_PASSWORD_LENGTH) {
    throw ApiError.badRequest(
      'weak_password',
      `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
    );
  }
};
