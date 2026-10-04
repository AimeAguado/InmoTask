import type { AppUser, FinancialEntry, Property, Task, TaskStatus, UserRole } from '../types';

/**
 * Rutas relativas a propósito: el dev server de Vite proxea /api al backend
 * (ver vite.config.ts), así el navegador nunca ve otro origen y la cookie de
 * sesión queda como first-party.
 */
const BASE = '/api';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiRequestError(0, 'network_error', 'No se pudo conectar con el servidor.');
  }

  if (res.status === 204) return undefined as T;

  const payload = (await res.json().catch(() => null)) as
    | { error?: { code?: string; message?: string } }
    | T
    | null;

  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiRequestError(
      res.status,
      err?.code ?? 'unknown_error',
      err?.message ?? 'Ocurrió un error inesperado.'
    );
  }

  return payload as T;
};

const json = (body: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body),
});

// ------------------------------------------------------------------ auth ----

export const authApi = {
  login: (email: string, password: string) =>
    request<{ user: AppUser }>('/auth/login', json({ email, password })),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  session: () => request<{ user: AppUser }>('/auth/session'),
};

// ----------------------------------------------------------------- users ----

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  license?: string;
};

export const usersApi = {
  list: () => request<{ users: AppUser[] }>('/users'),

  create: (input: CreateUserInput) =>
    request<{ user: AppUser }>('/users', json(input)),

  setActive: (id: string, active: boolean) =>
    request<{ user: AppUser }>(`/users/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    }),

  setRole: (id: string, role: UserRole) =>
    request<{ user: AppUser }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
};

// ------------------------------------------------------------ properties ----

export const propertiesApi = {
  list: () => request<{ properties: Property[] }>('/properties'),

  create: (property: Property) =>
    request<{ property: Property }>('/properties', json(property)),

  update: (id: string, property: Property) =>
    request<{ property: Property }>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(property),
    }),

  remove: (id: string) => request<void>(`/properties/${id}`, { method: 'DELETE' }),
};

// ----------------------------------------------------------------- tasks ----

export const tasksApi = {
  list: () => request<{ tasks: Task[] }>('/tasks'),

  create: (task: Task) => request<{ task: Task }>('/tasks', json(task)),

  update: (id: string, task: Task) =>
    request<{ task: Task }>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),

  setStatus: (id: string, status: TaskStatus) =>
    request<{ task: Task }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  remove: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
};

// ------------------------------------------------------------- financial ----

export const financialsApi = {
  list: () => request<{ entries: FinancialEntry[] }>('/financials'),
};

/** Traduce los fallos de red a un mensaje presentable en la UI. */
export const toMessage = (err: unknown): string =>
  err instanceof ApiRequestError
    ? err.message
    : 'Ocurrió un error inesperado. Intentá de nuevo.';