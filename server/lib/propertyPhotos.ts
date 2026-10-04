/**
 * Borrado en disco de las fotos de un inmueble.
 *
 * Las imágenes viven en public/properties/<carpeta>/ y se sirven como
 * /properties/<carpeta>/<archivo>. La carpeta NO viene del código (INM-1042 vs
 * "lasdunas"), así que se deduce de las propias rutas que guarda la ficha: todas
 * las fotos de un inmueble están en una sola carpeta, y esa carpeta es el
 * directorio de cualquiera de sus URLs.
 *
 * Aislado del router para que la parte con riesgo de borrar el directorio
 * equivocado quede en un solo lugar testeable.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Este archivo vive en server/lib: la raíz del proyecto está dos niveles arriba. */
const LIB_DIR = path.dirname(fileURLToPath(import.meta.url));

/** Raíz de los assets estáticos, que es contra la que se resuelven las URLs. */
export const PUBLIC_ROOT = path.resolve(LIB_DIR, '..', '..', 'public');

/** Cualquier cosa fuera de acá no se toca. */
export const PROPERTIES_ROOT = path.resolve(PUBLIC_ROOT, 'properties');

/**
 * Devuelve la carpeta de fotos de una URL de imagen, o null si la ruta no
 * apunta a public/properties/.
 *
 * La URL se resuelve contra PUBLIC_ROOT y después se verifica que el resultado
 * caiga dentro de PROPERTIES_ROOT. Ese chequeo es lo que impide que un ".."
 * guardado en la base haga que el borrado salga de public/ y se lleve el repo.
 */
const folderOfUrl = (url: string): string | null => {
  const clean = url.trim();
  if (!clean) return null;

  // Las URLs son relativas al servidor público ("/properties/carpeta/x.jpg"). Un
  // origin delante (http://host/...) se descarta para no resolverlo contra el
  // filesystem local.
  const pathOnly = clean.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i, '');
  const relative = decodeURIComponent(pathOnly).replace(/^\/+/, '');

  const resolved = path.resolve(PUBLIC_ROOT, relative);
  if (!resolved.startsWith(PROPERTIES_ROOT + path.sep)) return null;

  // El directorio padre del archivo es la carpeta de la ficha. Si el directorio
  // padre fuera la propia raíz, la URL no tiene carpeta propia que borrar.
  const folder = path.dirname(resolved);
  return folder === PROPERTIES_ROOT ? null : folder;
};

/** Carpetas únicas de todas las fotos de una ficha, en el orden en que aparecen. */
export const photoFoldersOf = (urls: readonly string[]): string[] => {
  const folders: string[] = [];
  for (const url of urls) {
    const folder = folderOfUrl(url);
    if (folder && !folders.includes(folder)) folders.push(folder);
  }
  return folders;
};

/** Cuenta archivos sin seguir symlinks, para poder informar cuántos se borraron. */
const countFiles = async (dir: string): Promise<number> => {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  let total = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) total += await countFiles(path.join(dir, entry.name));
    else total += 1;
  }
  return total;
};

export interface RemovePhotosResult {
  /** Archivos realmente borrados de disco. */
  filesDeleted: number;
  /** Carpetas eliminadas, con nombre relativo a public/properties. */
  foldersRemoved: string[];
  /** Carpetas preservadas porque otro inmueble las sigue usando. */
  foldersKept: string[];
  /** Carpetas que la ficha referenciaba pero que ya no estaban en disco. */
  foldersMissing: string[];
  /** Carpetas que existían pero falló el borrado. */
  foldersFailed: string[];
}

/**
 * Borra las carpetas de fotos indicadas.
 *
 * `isFolderShared` recibe una carpeta y debe decir si algún OTRO inmueble la
 * sigue referenciando; si es así la carpeta se preserva, porque borrarla dejaría
 * sin fotos a una ficha viva. Es un callback y no una query para que este módulo
 * no dependa de mongoose.
 *
 * Dos decisiones que parecían obvias y no lo son:
 *
 * - El borrado no es "best effort silencioso". Con force:true, fs.rm sobre una
 *   ruta inexistente NO lanza error y el código terminaba anunciando una carpeta
 *   que nunca se borró. Ahora se comprueba la existencia antes y el resultado
 *   refleja lo que pasó de verdad.
 * - Los fallos de disco no se propagan. La ficha ya fue eliminada de la base y
 *   dejar restos en disco es un problema menor comparado con un 500 que hace
 *   creer al usuario que no se borró nada. Por eso se registran y se devuelven.
 */
export const removePhotoFolders = async (
  folders: readonly string[],
  isFolderShared: (folder: string) => Promise<boolean>
): Promise<RemovePhotosResult> => {
  const result: RemovePhotosResult = {
    filesDeleted: 0,
    foldersRemoved: [],
    foldersKept: [],
    foldersMissing: [],
    foldersFailed: [],
  };

  for (const folder of folders) {
    const name = path.basename(folder);

    if (await isFolderShared(folder)) {
      result.foldersKept.push(name);
      continue;
    }

    try {
      // Se verifica antes de borrar: fs.rm con force no distingue "borrado" de
      // "nunca existió", y esa diferencia es justo la que hay que reportar.
      const stats = await fs.stat(folder);
      if (!stats.isDirectory()) {
        result.foldersFailed.push(name);
        console.error(`[fotos] ${folder} no es un directorio; no se toca.`);
        continue;
      }

      result.filesDeleted += await countFiles(folder);
      await fs.rm(folder, { recursive: true });
      result.foldersRemoved.push(name);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        result.foldersMissing.push(name);
        continue;
      }
      console.error(`[fotos] no se pudo borrar ${folder}:`, err instanceof Error ? err.message : err);
      result.foldersFailed.push(name);
    }
  }

  return result;
};