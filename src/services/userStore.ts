import { AppUser, UserRole } from '../types';
import { ApiRequestError, authApi, usersApi } from './api';
import type { UpdateUserInput } from './api';

export type { UpdateUserInput };


/**
 * La sesión vive en una cookie httpOnly que el backend firma (JWT) y en la que
 * el navegador no puede escribir: no hay ningún token en localStorage al que un
 * XSS pueda llegar. Acá sólo se orchestran las llamadas; el store local y el
 * digest weak de contraseñas quedaron eliminados.
 */
export const DEMO_PASSWORD = 'inmotask';

export type LoginResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'credentials' | 'inactive' | 'unknown-email' | 'server' };

/**
 * El backend responde el mismo mensaje para email inexistente y password
 * incorrecto (no confirma qué emails existen), así que acá no se puede
 * distinguir uno de otro: ambos caen en 'credentials'.
 */
export const login = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const { user } = await authApi.login(email.trim(), password);
    return { ok: true, user };
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.code === 'inactive-user') return { ok: false, reason: 'inactive' };
      if (err.status === 0 || err.status >= 500) return { ok: false, reason: 'server' };
    }
    return { ok: false, reason: 'credentials' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await authApi.logout();
  } catch {
    // Si el logout falla, la cookie local se limpia igual: peor una sesión
    // abierta en el servidor que un 500 en la pantalla de salida.
  }
};

/** Restaura la sesión al recargar la página. Null si no hay cookie válida. */
export const getSessionUser = async (): Promise<AppUser | null> => {
  try {
    const { user } = await authApi.session();
    return user;
  } catch {
    return null;
  }
};

export const listUsers = async (): Promise<AppUser[]> => {
  const { users } = await usersApi.list();
  return users;
};

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  license?: string;
};

export type CreateUserResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'duplicate-email' | 'weak-password' | 'invalid' };

export const createUser = async (input: CreateUserInput): Promise<CreateUserResult> => {
  try {
    const { user } = await usersApi.create(input);
    return { ok: true, user };
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.code === 'duplicate-email') return { ok: false, reason: 'duplicate-email' };
      if (err.code === 'weak_password') return { ok: false, reason: 'weak-password' };
    }
    return { ok: false, reason: 'invalid' };
  }
};

/** Un admin corrige los datos de un asesor de su propia inmobiliaria. */
export const updateUser = async (id: string, input: UpdateUserInput): Promise<AppUser> => {
  const { user } = await usersApi.update(id, input);
  return user;
};

export const setUserActive = async (id: string, active: boolean): Promise<void> => {
  await usersApi.setActive(id, active);
};

export const setUserRole = async (id: string, role: UserRole): Promise<void> => {
  await usersApi.setRole(id, role);
};