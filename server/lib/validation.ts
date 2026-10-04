import { ApiError } from './http';

type Rec = Record<string, unknown>;

const isRec = (v: unknown): v is Rec => typeof v === 'object' && v !== null;

export const asString = (
  value: unknown,
  field: string,
  opts: { required?: boolean; fallback?: string; max?: number } = {}
): string => {
  const { required = false, fallback = '', max = 500 } = opts;
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest('validation_error', `"${field}" es obligatorio.`);
    return fallback;
  }
  if (typeof value !== 'string') {
    throw ApiError.badRequest('validation_error', `"${field}" debe ser texto.`);
  }
  const trimmed = value.trim();
  if (required && !trimmed) {
    throw ApiError.badRequest('validation_error', `"${field}" es obligatorio.`);
  }
  if (trimmed.length > max) {
    throw ApiError.badRequest('validation_error', `"${field}" supera los ${max} caracteres.`);
  }
  return trimmed;
};

export const asNumber = (
  value: unknown,
  field: string,
  opts: { required?: boolean; fallback?: number; min?: number } = {}
): number => {
  const { required = false, fallback = 0, min = 0 } = opts;
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest('validation_error', `"${field}" es obligatorio.`);
    return fallback;
  }
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw ApiError.badRequest('validation_error', `"${field}" debe ser numérico.`);
  }
  if (n < min) {
    throw ApiError.badRequest('validation_error', `"${field}" no puede ser menor que ${min}.`);
  }
  return n;
};

export const asBoolean = (value: unknown, fallback = false): boolean => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === 1;
};

export const asEnum = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  opts: { required?: boolean; fallback?: T } = {}
): T => {
  const { required = false, fallback } = opts;
  if (value === undefined || value === null || value === '') {
    if (required) throw ApiError.badRequest('validation_error', `"${field}" es obligatorio.`);
    if (fallback === undefined) {
      throw ApiError.badRequest('validation_error', `"${field}" es obligatorio.`);
    }
    return fallback;
  }
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw ApiError.badRequest(
      'validation_error',
      `"${field}" debe ser uno de: ${allowed.join(', ')}.`
    );
  }
  return value as T;
};

export const asStringArray = (value: unknown, field: string): string[] => {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw ApiError.badRequest('validation_error', `"${field}" debe ser una lista.`);
  }
  return value.map((item) => asString(item, field, { max: 60 })).filter(Boolean);
};

/** 'YYYY-MM-DD' → Date a medianoche UTC, que es como el cliente la interpeta. */
export const asYmdDate = (value: unknown, field: string, required = true): Date => {
  const raw = asString(value, field, { required, max: 10 });
  if (!raw) return new Date(0);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw ApiError.badRequest('validation_error', `"${field}" debe tener formato YYYY-MM-DD.`);
  }
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw ApiError.badRequest('validation_error', `"${field}" no es una fecha válida.`);
  }
  return date;
};

/** 'HH:mm' exacto: la agenda ordena por hora y no por texto. */
export const asHhMm = (value: unknown, field: string): string | undefined => {
  const raw = asString(value, field, { max: 5 });
  if (!raw) return undefined;
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw)) {
    throw ApiError.badRequest('validation_error', `"${field}" debe tener formato HH:mm.`);
  }
  return raw;
};

/** Mongo genera el _id: si el body trae uno, se ignora en vez de respetarlo. */
export const stripServerFields = (body: unknown): Rec =>
  isRec(body) ? Object.fromEntries(Object.entries(body).filter(([k]) => k !== '_id' && k !== 'id')) : {};