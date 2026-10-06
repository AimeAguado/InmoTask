/**
 * Puebla Atlas con los datos que hasta ahora vivían en src/data/mockData.ts.
 *
 *   npm run seed            # borra las colecciones y las vuelve a llenar
 *   npm run seed -- --keep  # agrega sin borrar (omite las colecciones vacías)
 *
 * Los ids del mock ('prop-1', 'task-1') no se conservan: Mongo genera los
 * _id. Para las tareas se traduce el propertyId del mock al _id real del
 * inmueble recién insertado, que es lo que ahora guarda la referencia.
 */
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from './db.js';
import { config } from './config.js';
import { PropertyModel } from './models/Property.js';
import { TaskModel } from './models/Task.js';
import { InmobiliariaModel } from './models/Inmobiliaria.js';
import { INITIAL_PROPERTIES, INITIAL_TASKS } from '../src/data/mockData.js';

const KEEP_EXISTING = process.argv.includes('--keep');

/** Base propiedad de este proyecto. El seed se niega a correr sobre otra. */
const PROJECT_DB = 'inmotask';

/** Empresa que se crea en el seed. Las demás se dan de alta con create:inmoviliaria. */
const SEED_INMOBILIARIA = {
  name: 'InmoTask',
  legalName: 'InmoTask Inmobiliaria S.A.',
  taxId: '30-71234567-9',
  phone: '+54 11 4829-9182',
  email: 'contacto@inmotask.com',
};

const ymd = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/**
 * Barrera contra el borrado accidental de datos ajenos.
 *
 * connectDb ya aborta si la base no es la de MONGODB_DB, pero acá se agrega una
 * segunda red: `deleteMany({})` sin filtro borra la colección completa, así que
 * sólo se permite si MONGODB_DB es explícitamente el nombre de este proyecto.
 */
const assertOwnedDatabase = (): void => {
  if (config.mongoDb !== PROJECT_DB) {
    throw new Error(
      `El seed sólo puede correr contra la base "${PROJECT_DB}" y MONGODB_DB dice ` +
        `"${config.mongoDb}". Borrar las colecciones de otra base no es seguro.`
    );
  }
};

const main = async (): Promise<void> => {
  await connectDb();

  if (!KEEP_EXISTING) {
    assertOwnedDatabase();
    console.log(`[seed] borrando colecciones de la base "${config.mongoDb}"...`);
    // Se borran sólo los datos demo. Las inmobiliarias y sus usuarios NO se
    // tocan: el seed ya no crea cuentas, y las que existen (create:inmoviliaria)
    // no deben quedar huérfanas.
    await Promise.all([
      PropertyModel.deleteMany({}),
      TaskModel.deleteMany({}),
    ]);
  }

  // La empresa va primero: su _id es la referencia que comparten todos los datos
  // del seed, así que tiene que existir antes que usuarios o inmuebles.
  const inmoviliariaId = await ensureSeedInmobiliaria();

  // El seed ya NO crea usuarios: las cuentas se dan de alta con
  // `npm run create:inmoviliaria` (que crea la empresa y su primer admin). Así no
  // queda ninguna credencial demo conocida en el sistema.
  await seedProperties(inmoviliariaId);
  await seedTasks(inmoviliariaId);

  console.log('[seed] listo.');
  await disconnectDb();
};

/** Sólo se usa para contar documentos, así que se tipa por duck typing: un
 *  Model<unknown> genérico no acepta los modelos con schema concreto. */
const skipIfPopulated = async (
  label: string,
  model: { estimatedDocumentCount(): Promise<number> },
  run: () => Promise<void>
): Promise<void> => {
  if (KEEP_EXISTING && (await model.estimatedDocumentCount()) > 0) {
    console.log(`[seed] ${label}: ya tiene datos, se omite.`);
    return;
  }
  await run();
};

/**
 * Devuelve el _id de la empresa del seed.
 *
 * Con `findOneAndUpdate` + upsert es idempotente: correr el seed dos veces con
 * --keep no duplica la empresa ni le cambia el _id, que es lo que mantiene
 * apuntando a los datos ya sembrados.
 */
const ensureSeedInmobiliaria = async (): Promise<string> => {
  const existing = await InmobiliariaModel.findOneAndUpdate(
    { name: SEED_INMOBILIARIA.name },
    { $setOnInsert: { ...SEED_INMOBILIARIA, active: true } },
    { upsert: true, new: true }
  );
  return String(existing._id);
};

let propertyIdMap = new Map<string, mongoose.Types.ObjectId>();

const seedProperties = async (inmoviliariaId: string): Promise<void> => {
  await skipIfPopulated('Property', PropertyModel, async () => {
    const docs = await PropertyModel.insertMany(
      INITIAL_PROPERTIES.map((p) => ({
        code: p.code,
        title: p.title,
        type: p.type,
        operation: p.operation,
        status: p.status,
        inmoviliariaId,
        address: p.address,
        neighborhood: p.neighborhood,
        city: p.city,
        coveredArea: p.coveredArea,
        totalArea: p.totalArea,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        parkingSpots: p.parkingSpots,
        keysLocation: p.keysLocation,
        signageStatus: p.signageStatus,
        imageUrl: p.imageUrl,
        description: p.description,
        featured: p.featured,
        tags: p.tags,
        assignedAgent: p.assignedAgent,
        createdAt: ymd(p.createdAt),
      }))
    );

    INITIAL_PROPERTIES.forEach((p, i) => propertyIdMap.set(p.id, docs[i]._id));
    console.log(`[seed] Property: ${docs.length} inmuebles.`);
  });

  // Aunque se salte el insert, el mapa lo necesitan las tareas para resolver
  // sus referencias. El filtro por empresa evita que un --keep contra una base
  // con dos inmobiliarias tome el inmueble de otra con el mismo código.
  if (propertyIdMap.size === 0) {
    const existing = await PropertyModel.find({ inmoviliariaId }, { code: 1, title: 1 }).lean();
    INITIAL_PROPERTIES.forEach((p) => {
      const match = existing.find((d) => d.code === p.code);
      if (match) propertyIdMap.set(p.id, match._id as mongoose.Types.ObjectId);
    });
  }
};

const seedTasks = async (inmoviliariaId: string): Promise<void> => {
  await skipIfPopulated('Task', TaskModel, async () => {
    const docs = await TaskModel.insertMany(
      INITIAL_TASKS.map((t) => ({
        title: t.title,
        description: t.description ?? '',
        category: t.category,
        priority: t.priority,
        status: t.status,
        inmoviliariaId,
        dueDate: ymd(t.dueDate),
        dueTime: t.dueTime ?? '',
        // El mock guarda el id de texto; se reemplaza por el _id real. Si el
        // inmueble no está en el mapa, la tarea queda sin referencia.
        property: (t.propertyId && propertyIdMap.get(t.propertyId)) || null,
        propertyTitle: t.propertyTitle ?? '',
        assignedByDirector: t.assignedByDirector ?? false,
        assignedTo: t.assignedTo,
        completedAt: t.completedAt ? new Date(t.completedAt) : null,
      }))
    );
    console.log(`[seed] Task: ${docs.length} tareas.`);
  });
};

main().catch((err: unknown) => {
  console.error('[seed] falló:', err instanceof Error ? err.message : err);
  process.exit(1);
});