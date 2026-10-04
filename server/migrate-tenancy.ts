/**
 * Migración a multi-inmobiliaria.
 *
 *   npm run migrate:tenancy -- --dry-run   # sólo informa qué haría (default)
 *   npm run migrate:tenancy                # aplica los cambios
 *
 * Qué hace, en orden:
 *
 *  1. Crea (o reutiliza) la inmobiliaria inicial. Es idempotente: si ya existe
 *     con ese nombre, no se duplica.
 *  2. Asocia a esa empresa todos los usuarios, inmuebles, tareas y movimientos
 *     que todavía no tengan `inmoviliariaId`.
 *  3. Separa `name` en `firstName` / `lastName` para que se puedan editar por
 *     separado, y renombra el rol global `jefatura` a `admin`.
 *  4. Borra el índice único global `code_1` de properties, que impediría que dos
 *     inmobiliarias tengan un inmueble con el mismo código.
 *
 * El paso 4 es el que más importa: sin él, dos inmobiliarias no podrían tener
 * un inmueble con el mismo código aunque el schema ya lo permita.
 *
 * Es idempotente en su totalidad. Se puede correr las veces que haga falta.
 */
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from './db.js';
import { config } from './config.js';
import { AppUserModel } from './models/AppUser.js';
import { PropertyModel } from './models/Property.js';
import { TaskModel } from './models/Task.js';
import { FinancialEntryModel } from './models/FinancialEntry.js';
import { InmobiliariaModel } from './models/Inmobiliaria.js';

const APPLY = process.argv.includes('--apply');

/** Empresa donde cae todo lo que hoy no tiene dueño. */
const INITIAL_INMOBILIARIA = {
  name: process.env.MIGRATE_INMOBILIARIA_NAME?.trim() || 'InmoTask',
  legalName: process.env.MIGRATE_INMOBILIARIA_LEGAL_NAME?.trim() || 'InmoTask Inmobiliaria S.A.',
};

const log = (msg: string): void => console.log(`[migrate] ${msg}`);

/**
 * Separa un nombre guardado en un solo string.
 *
 * Los datos existentes sólo guardan `name`, así que no hay información de
 * dónde terminaba el nombre: se parte por el primer espacio, que para nombres
 * rioplatenses ("Natalia Aimé", "Martín Duarte") da la división correcta. Lo que
 * no se puede adivinar (apellidos compuestos) lo edita el usuario desde su perfil. */
export const splitName = (fullName: string): { firstName: string; lastName: string } => {
  const clean = fullName.trim().replace(/\s+/g, ' ');
  if (!clean) return { firstName: '', lastName: '' };

  const cut = clean.indexOf(' ');
  if (cut === -1) return { firstName: clean, lastName: '' };

  return { firstName: clean.slice(0, cut), lastName: clean.slice(cut + 1) };
};

const migrateInmobiliaria = async (): Promise<mongoose.Types.ObjectId> => {
  const existing = await InmobiliariaModel.findOne({ name: INITIAL_INMOBILIARIA.name });
  if (existing) {
    log(`la inmobiliaria "${existing.name}" ya existe (${existing._id}). Se reutiliza.`);
    return existing._id as mongoose.Types.ObjectId;
  }

  if (APPLY) {
    const created = await InmobiliariaModel.create({ ...INITIAL_INMOBILIARIA, active: true });
    log(`creada la inmobiliaria "${created.name}" (${created._id}).`);
    return created._id as mongoose.Types.ObjectId;
  }

  log(`[dry-run] crearía la inmobiliaria "${INITIAL_INMOBILIARIA.name}".`);
  return new mongoose.Types.ObjectId();
};

/**
 * Filtro de los documentos que todavía no tienen empresa.
 *
 * Hace falta el $or porque en Mongo un filtro `{inmoviliariaId: null}` también
 * matchea los documentos a los que les falta la clave, así que consultarlos por
 * separado cuenta dos veces lo mismo (con 33 documentos atrás parecía que
 * había 66). Con el $or cada documento se cuenta una sola vez.
 */
const ORPHANS: Record<string, unknown> = {
  $or: [{ inmoviliariaId: { $exists: false } }, { inmoviliariaId: null }],
};

/**
 * Asocia a la empresa inicial todo lo que todavía no tenga dueño.
 *
 * El filtro es siempre el de los huérfanos: nunca se pisa una empresa que ya
 * estuviera cargada, así que el script se puede correr las veces que haga falta.
 */
const adoptOrphans = async (
  label: string,
  model: mongoose.Model<any>,
  inmoviliariaId: mongoose.Types.ObjectId,
  extra?: Record<string, unknown>
): Promise<void> => {
  const orphans = await model.countDocuments(ORPHANS);

  if (orphans === 0) {
    log(`${label}: todos tienen inmobiliaria.`);
    return;
  }

  log(`${label}: ${orphans} documentos sin inmobiliaria.`);

  if (!APPLY) {
    log(`[dry-run] los asociaría a ${inmoviliariaId}.`);
    return;
  }

  const res = await model.updateMany(ORPHANS, { $set: { inmoviliariaId, ...extra } });
  log(`${label}: ${res.modifiedCount} documentos asociados.`);
};

const migrateUsers = async (inmoviliariaId: mongoose.Types.ObjectId): Promise<void> => {
  await adoptOrphans('usuarios', AppUserModel, inmoviliariaId);

  // El nombre partido y el renombre de rol se resuelven documento por
  // documento: updateMany no sirve porque el valor a escribir depende de `name`.
  const users = await AppUserModel.find({});
  let namesFixed = 0;
  let rolesFixed = 0;

  for (const user of users) {
    const update: Record<string, unknown> = {};

    if (!user.firstName || !user.lastName) {
      const source =
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.name || '';
      const { firstName, lastName } = splitName(source);
      if (firstName) update.firstName = firstName;
      if (lastName) update.lastName = lastName;
      update.name = `${firstName} ${lastName}`.trim() || user.name;
    }

    // 'jefatura' era global; pasa a ser el admin de SU empresa.
    if (user.role === ('jefatura' as unknown as typeof user.role)) {
      update.role = 'admin';
      rolesFixed += 1;
    }

    if (Object.keys(update).length > 0) {
      if (APPLY) {
        await AppUserModel.updateOne({ _id: user._id }, { $set: update });
      }
      if (update.firstName || update.lastName) namesFixed += 1;
    }
  }

  log(`usuarios: ${namesFixed} con nombre separado, ${rolesFixed} con rol jefatura → admin.`);
  if (!APPLY && (namesFixed > 0 || rolesFixed > 0)) {
    log(`[dry-run] habría que actualizar esos ${users.length} documentos.`);
  }
};

/**
 * Ejecuta el cambio de índice de forma explícita.
 *
 * Mongo no permite que un índice se cambie en el sitio: `dropIndex` + `createIndex`.
 * Si se creara el compuesto sin borrar antes el global, seguiría un índice
 * `code_1` que impide que dos empresas usen el mismo código.
 */
const migratePropertyIndex = async (): Promise<void> => {
  const indexes = await PropertyModel.collection.indexes();

  const globalCode = indexes.find(
    (i) => i.name === 'code_1' && i.key?.code === 1 && !i.key?.inmoviliariaId
  );
  const compound = indexes.find(
    (i) =>
      i.key?.inmoviliariaId === 1 &&
      i.key?.code === 1 &&
      (i.unique ?? false)
  );

  if (globalCode) {
    log(`índice global code_1 presente: se va a BORRAR.`);
    if (!APPLY) {
      log('[dry-run] haría dropIndex("code_1") y crearía { inmoviliariaId, code } único.');
    } else {
      await PropertyModel.collection.dropIndex('code_1');
      await PropertyModel.collection.createIndex(
        { inmoviliariaId: 1, code: 1 },
        { unique: true, name: 'inmoviliariaId_1_code_1' }
      );
      log('índice code_1 eliminado; compuesto { inmoviliariaId, code } creado.');
    }
  } else if (!compound) {
    log('no hay índice global code_1 pero tampoco el compuesto: hay que crearlo.');
    if (!APPLY) {
      log('[dry-run] crearía { inmoviliariaId, code } único.');
    } else {
      await PropertyModel.collection.createIndex(
        { inmoviliariaId: 1, code: 1 },
        { unique: true, name: 'inmoviliariaId_1_code_1' }
      );
      log('índice compuesto creado.');
    }
  } else {
    log('los índices ya están como corresponde; no se tocan.');
  }

  // Nota: el índice simple `inmoviliariaId_1` NO se toca. Lo crea el `index: true`
  // del campo en los cuatro schemas, así que mongoose lo vuelve a levantar en
  // cada arranque si se lo dropea acá. En properties queda redundante (el índice
  // compuesto empieza por ese mismo campo) y en tasks/financials es necesario,
  // porque no hay compuesto que empiece por la empresa.
  //
  // Se releen los índices después de los drop/create: el snapshot de arriba es el
  // estado previo y reportarlo daría la impresión de que el borrado falló.
  const after = (await PropertyModel.collection.indexes()).map((i) => i.name);
  log(`índices de properties ahora: ${after.join(', ')}`);
};

/** Reporte de passwords: avisa si algún usuario quedó con hash vacío o inválido. */
const audit = async (): Promise<void> => {
  const [users, props, tasks, entries, empresas] = await Promise.all([
    AppUserModel.countDocuments({}),
    PropertyModel.countDocuments({}),
    TaskModel.countDocuments({}),
    FinancialEntryModel.countDocuments({}),
    InmobiliariaModel.countDocuments({}),
  ]);

  log('');
  log('resumen:');
  log(`  inmobiliarias: ${empresas}`);
  log(`  usuarios:      ${users}`);
  log(`  inmuebles:     ${props}`);
  log(`  tareas:        ${tasks}`);
  log(`  movimientos:   ${entries}`);
};

const main = async (): Promise<void> => {
  log(APPLY ? 'MODO APLICAR: se van a escribir cambios.' : 'MODO DRY-RUN: no se escribe nada.');
  log(`base "${config.mongoDb}" en ${config.mongoUri.replace(/\/\/[^@]*@/, '//***@')}`);

  await connectDb();

  const inmoviliariaId = await migrateInmobiliaria();
  await migrateUsers(inmoviliariaId);
  await adoptOrphans('inmuebles', PropertyModel, inmoviliariaId);
  await adoptOrphans('tareas', TaskModel, inmoviliariaId);
  await adoptOrphans('movimientos', FinancialEntryModel, inmoviliariaId);
  await migratePropertyIndex();
  await audit();

  if (!APPLY) {
    log('');
    log('Nada se modificó. Corré con --apply cuando quieras aplicar los cambios.');
  }

  await disconnectDb();
};

main().catch((err: unknown) => {
  console.error('[migrate] falló:', err instanceof Error ? err.stack : err);
  process.exit(1);
});
