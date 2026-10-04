/**
 * Lectura de imágenes desde el navegador para subirlas como foto de perfil.
 *
 * La app manda la foto como data URL dentro del JSON (ver server/lib/avatarStorage.ts),
 * así que conviene achicarla antes: una foto de celular de 4 MB convertida a base64
 * son ~5,5 MB de body, y el servidor la limita a 2 MB.
 *
 * El redimensionado usa canvas, así que la salida siempre queda en JPEG/PNG y en
 * las dimensiones que indicamos: una foto de perfil no necesita más de 512 px.
 */

export const MAX_AVATAR_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Lado máximo del avatar. 512 es de sobra para una esquina de 32-40 px en pantalla. */
const MAX_EDGE = 512;

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

export class AvatarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarError';
  }
}

const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AvatarError('No se pudo leer el archivo.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new AvatarError('El archivo no es una imagen válida.'));
    img.src = src;
  });

/**
 * Devuelve un data URL con la foto escalada y, si hace falta, recomprimida.
 *
 * Sólo se recursa si el resultado sigue pasando del límite: un PNG de 512 px con
 * transparencia puede pesar más que el original.
 */
export const fileToAvatarDataUrl = async (file: File): Promise<string> => {
  if (!ACCEPTED.includes(file.type)) {
    throw new AvatarError('Elegí una imagen JPG, PNG o WEBP.');
  }

  const original = await readAsDataUrl(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(original);
  } catch {
    throw new AvatarError('El archivo no es una imagen válida.');
  }

  // Escalar por el lado más largo y no deformar: se conservan las proporciones.
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  let quality = 0.86;
  let out = render(img, width, height, quality);

  while (dataUrlBytes(out) > MAX_AVATAR_UPLOAD_BYTES && quality > 0.4) {
    quality -= 0.15;
    out = render(img, width, height, quality);
  }

  if (dataUrlBytes(out) > MAX_AVATAR_UPLOAD_BYTES) {
    throw new AvatarError('La imagen sigue pesando demasiado. Probá con otra foto.');
  }
  return out;
};

const render = (
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AvatarError('El navegador no permitió procesar la imagen.');

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
};

/** Tamaño real en bytes del base64, sin crear un data URL gigante en memoria. */
export const dataUrlBytes = (dataUrl: string): number => {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const base64 = dataUrl.slice(comma + 1);
  return Math.floor((base64.length * 3) / 4);
};
