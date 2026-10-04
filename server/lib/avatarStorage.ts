/**
 * Guardado de las fotos de perfil.
 *
 * La app no usa multipart: el cliente manda un data URL (base64) en el JSON y
 * acá se lo baja a public/uploads/avatars/. Evita agregar una dependencia de
 * parsing de multipart y no deja archivos temporales en el servidor.
 *
 * Los archivos se sirven como /uploads/... porque Vite sirve public/ en dev.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { ApiError } from './http.js';
import { fileURLToPath } from 'node:url';

const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** public/ está dos niveles arriba desde server/lib. */
export const PUBLIC_ROOT = path.resolve(LIB_DIR, '..', '..', 'public');

/** Cualquier cosa fuera de acá no se escribe ni se borra. */
export const AVATARS_ROOT = path.resolve(PUBLIC_ROOT, 'uploads', 'avatars');

/** 2 MB: sobra para una foto de perfil y evita que el body se vuelva un hosting. */
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

interface ImageFormat {
  ext: string;
  mime: string;
}

/**
 * Se identifica la imagen por los primeros bytes, no por el Content-Type que
 * declara el cliente: si se confiara en el header, cualquiera podría subir un
 * HTML con "image/png" y servirse desde el mismo origen que la app.
 */
const sniff = (buf: Buffer): ImageFormat | null => {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: 'png', mime: 'image/png' };
  }
  // WEBP: "RIFF" .... "WEBP"
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
};

const DATA_URL = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i;

/**
 * Persiste un avatar y devuelve la ruta pública.
 *
 * Si el valor no es un data URL se asume que ya es una ruta guardada (los
 * avatares previos a este cambio son rutas a /src/assets/...) y se devuelve tal
 * cual, para no obligar a recargar todos los usuarios existentes.
 */
export const saveAvatar = async (
  value: string,
  userId: string,
  inmoviliariaId: string
): Promise<string> => {
  const raw = value.trim();
  if (!raw) return '';

  const match = DATA_URL.exec(raw);
  if (!match) return raw;

  const [, declaredMime, base64] = match;

  let buf: Buffer;
  try {
    buf = Buffer.from(base64, 'base64');
  } catch {
    throw ApiError.badRequest('invalid_avatar', 'La imagen no se pudo decodificar.');
  }

  if (!buf.length) throw ApiError.badRequest('invalid_avatar', 'La imagen está vacía.');
  if (buf.length > MAX_AVATAR_BYTES) {
    throw ApiError.badRequest('invalid_avatar', 
      `La imagen supera el máximo de ${Math.round(MAX_AVATAR_BYTES / 1024 / 1024)} MB.`
    );
  }

  const format = sniff(buf);
  if (!format) {
    throw ApiError.badRequest('invalid_avatar', 'El archivo no es una imagen válida (JPG, PNG o WEBP).');
  }
  if (declaredMime.toLowerCase() !== format.mime) {
    // No es fatal: el contenido manda. Se acepta igual para no romper clientes
    // que declaren image/jpg en lugar de image/jpeg.
    if (!(declaredMime.toLowerCase() === 'image/jpg' && format.mime === 'image/jpeg')) {
      throw ApiError.badRequest('invalid_avatar', 'El tipo de la imagen no coincide con su contenido.');
    }
  }

  // Los ids de Mongo y los nombres de archivo se validan igual: un id con "/"
  // o ".." escribiría fuera de la carpeta de avatars.
  const safeUser = /^[a-f0-9]{24}$/i.test(userId) ? userId : 'user';
  const safeInmo = /^[a-f0-9]{24}$/i.test(inmoviliariaId) ? inmoviliariaId : 'shared';

  const dir = path.join(AVATARS_ROOT, safeInmo);
  const filename = `${safeUser}.${format.ext}`;
  const target = path.join(dir, filename);

  if (!target.startsWith(AVATARS_ROOT + path.sep)) {
    throw ApiError.badRequest('invalid_avatar', 'No se pudo determinar dónde guardar la imagen.');
  }

  await fs.mkdir(dir, { recursive: true });

  // Se borra la versión anterior si tenía otra extensión, así de cambiar de
  // celular no deja un .png huérfano al lado del .jpg.
  for (const old of ['jpg', 'png', 'webp']) {
    if (old === format.ext) continue;
    await fs.rm(path.join(dir, `${safeUser}.${old}`), { force: true });
  }

  await fs.writeFile(target, buf);
  return `/uploads/avatars/${safeInmo}/${filename}`;
};


/** Borra el archivo de un avatar. Best effort: si falla, el usuario ya no tiene foto. */
export const removeAvatar = async (avatarPath: string): Promise<void> => {
  if (!avatarPath.startsWith('/uploads/avatars/')) return;

  const resolved = path.resolve(PUBLIC_ROOT, avatarPath.replace(/^\/+/, ''));
  if (!resolved.startsWith(AVATARS_ROOT + path.sep)) return;

  await fs.rm(resolved, { force: true }).catch(() => undefined);
};
