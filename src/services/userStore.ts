import { AppUser, StoredUser, UserRole } from '../types';

const USERS_KEY = 'inmotask.users.v1';
const SESSION_KEY = 'inmotask.session.v1';

/**
 * Digest local para no persistir contraseñas en claro dentro de localStorage.
 * NO es seguridad real: sin backend, cualquiera con acceso al navegador o a la
 * devtools puede leer el store completo. Sirve únicamente para que el demo no
 * enseñe el patrón de guardar passwords planos.
 */
const digest = (value: string): string => {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ code, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(36)}${h2.toString(36)}`;
};

export const DEMO_PASSWORD = 'inmotask';

const SEED_USERS: StoredUser[] = [
  {
    id: 'usr-1',
    name: 'Natalia Aimé',
    email: 'natalia@inmotask.com',
    role: 'jefatura',
    phone: '+54 9 11 4829-9182',
    license: 'CUCICBA Mat. 7412',
    avatar: '/src/assets/images/avatar_natalia_1790435623633.jpg',
    active: true,
    createdAt: '2026-01-12',
    passwordDigest: digest(DEMO_PASSWORD),
  },
  {
    id: 'usr-2',
    name: 'Martín Duarte',
    email: 'martin@inmotask.com',
    role: 'asesor',
    phone: '+54 9 11 5533-2041',
    active: true,
    createdAt: '2026-03-04',
    passwordDigest: digest(DEMO_PASSWORD),
  },
  {
    id: 'usr-3',
    name: 'Carla Ferreira',
    email: 'carla@inmotask.com',
    role: 'asesor',
    active: false,
    createdAt: '2026-05-19',
    passwordDigest: digest(DEMO_PASSWORD),
  },
];

const isBrowser = (): boolean => typeof window !== 'undefined';

const readUsers = (): StoredUser[] => {
  if (!isBrowser()) return SEED_USERS;

  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    if (!raw) {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS));
      return SEED_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
};

const writeUsers = (users: StoredUser[]): void => {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // Cuota excedida o almacenamiento bloqueado: el demo sigue en memoria.
  }
};

const stripPassword = ({ passwordDigest: _passwordDigest, ...user }: StoredUser): AppUser => user;

export const listUsers = (): AppUser[] => readUsers().map(stripPassword);

export type LoginResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'credentials' | 'inactive' | 'unknown-email' };

export const login = (email: string, password: string): LoginResult => {
  const normalized = email.trim().toLowerCase();
  const match = readUsers().find((u) => u.email.toLowerCase() === normalized);

  if (!match) return { ok: false, reason: 'unknown-email' };
  if (match.passwordDigest !== digest(password)) return { ok: false, reason: 'credentials' };
  if (!match.active) return { ok: false, reason: 'inactive' };

  if (isBrowser()) {
    window.localStorage.setItem(SESSION_KEY, match.id);
  }
  return { ok: true, user: stripPassword(match) };
};

export const logout = (): void => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
};

export const getSessionUser = (): AppUser | null => {
  if (!isBrowser()) return null;
  const id = window.localStorage.getItem(SESSION_KEY);
  if (!id) return null;

  const match = readUsers().find((u) => u.id === id);
  if (!match || !match.active) {
    logout();
    return null;
  }
  return stripPassword(match);
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  license?: string;
};

export type CreateUserResult =
  | { ok: true; user: AppUser }
  | { ok: false; reason: 'duplicate-email' | 'invalid' };

export const createUser = (input: CreateUserInput): CreateUserResult => {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const role = input.role;

  if (!name || !email || !input.password) return { ok: false, reason: 'invalid' };

  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email)) {
    return { ok: false, reason: 'duplicate-email' };
  }

  const user: StoredUser = {
    id: `usr-${Date.now().toString(36)}`,
    name,
    email,
    role,
    phone: input.phone?.trim() || undefined,
    license: input.license?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString().slice(0, 10),
    passwordDigest: digest(input.password),
  };

  writeUsers([...users, user]);
  return { ok: true, user: stripPassword(user) };
};

export const setUserActive = (id: string, active: boolean): void => {
  writeUsers(readUsers().map((u) => (u.id === id ? { ...u, active } : u)));
};

export const setUserRole = (id: string, role: UserRole): void => {
  writeUsers(readUsers().map((u) => (u.id === id ? { ...u, role } : u)));
};

export const resetUsers = (): void => {
  writeUsers(SEED_USERS);
  logout();
};
