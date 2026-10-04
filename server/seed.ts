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
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './db';
import { config } from './config';
import { PropertyModel } from './models/Property';
import { TaskModel } from './models/Task';
import { FinancialEntryModel } from './models/FinancialEntry';
import { AppUserModel } from './models/AppUser';
import {
  INITIAL_PROPERTIES,
  INITIAL_TASKS,
  INITIAL_FINANCIAL_ENTRIES,
} from '../src/data/mockData';
import type { AppUser, UserRole } from '../src/types';

const DEMO_PASSWORD = 'inmotask';
const SALT_ROUNDS = 12;
const KEEP_EXISTING = process.argv.includes('--keep');

/** Base propiedad de este proyecto. El seed se niega a correr sobre otra. */
const PROJECT_DB = 'inmotask';

type SeedUser = Omit<AppUser, 'createdAt'> & { createdAt: string };

const SEED_USERS: SeedUser[] = [
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
  },
  {
    id: 'usr-2',
    name: 'Martín Duarte',
    email: 'martin@inmotask.com',
    role: 'asesor',
    phone: '+54 9 11 5533-2041',
    active: true,
    createdAt: '2026-03-04',
  },
  {
    id: 'usr-3',
    name: 'Carla Ferreira',
    email: 'carla@inmotask.com',
    role: 'asesor',
    active: false,
    createdAt: '2026-05-19',
  },
];

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
    await Promise.all([
      PropertyModel.deleteMany({}),
      TaskModel.deleteMany({}),
      FinancialEntryModel.deleteMany({}),
      AppUserModel.deleteMany({}),
    ]);
  }

  // Cada paso se saltea si su colección ya tiene documentos, así que --keep
  // completa lo que falta sin pisar lo que ya está.
  await seedUsers();
  await seedProperties();
  await seedTasks();
  await seedFinancialEntries();

  console.log('[seed] listo.');
  console.log(`[seed] login de prueba: natalia@inmotask.com / ${DEMO_PASSWORD}`);
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

const seedUsers = async (): Promise<void> => {
  await skipIfPopulated('AppUser', AppUserModel, async () => {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
    await AppUserModel.insertMany(
      SEED_USERS.map((u) => ({
        name: u.name,
        email: u.email.toLowerCase(),
        role: u.role as UserRole,
        phone: u.phone ?? '',
        license: u.license ?? '',
        avatar: u.avatar ?? '',
        active: u.active,
        passwordHash,
        // createdAt real (el del mock se descarta: el timestamp lo pone Mongoose).
        createdAt: ymd(u.createdAt),
      }))
    );
    console.log(`[seed] AppUser: ${SEED_USERS.length} usuarios.`);
  });
};

let propertyIdMap = new Map<string, mongoose.Types.ObjectId>();

const seedProperties = async (): Promise<void> => {
  await skipIfPopulated('Property', PropertyModel, async () => {
    const docs = await PropertyModel.insertMany(
      INITIAL_PROPERTIES.map((p) => ({
        code: p.code,
        title: p.title,
        type: p.type,
        operation: p.operation,
        status: p.status,
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
  // sus referencias.
  if (propertyIdMap.size === 0) {
    const existing = await PropertyModel.find({}, { code: 1, title: 1 }).lean();
    INITIAL_PROPERTIES.forEach((p) => {
      const match = existing.find((d) => d.code === p.code);
      if (match) propertyIdMap.set(p.id, match._id as mongoose.Types.ObjectId);
    });
  }
};

const seedTasks = async (): Promise<void> => {
  await skipIfPopulated('Task', TaskModel, async () => {
    const docs = await TaskModel.insertMany(
      INITIAL_TASKS.map((t) => ({
        title: t.title,
        description: t.description ?? '',
        category: t.category,
        priority: t.priority,
        status: t.status,
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

const seedFinancialEntries = async (): Promise<void> => {
  await skipIfPopulated('FinancialEntry', FinancialEntryModel, async () => {
    const docs = await FinancialEntryModel.insertMany(
      INITIAL_FINANCIAL_ENTRIES.map((e) => ({
        type: e.type,
        category: e.category,
        concept: e.concept,
        amount: e.amount,
        date: ymd(e.date),
        propertyCode: e.propertyCode ?? '',
      }))
    );
    console.log(`[seed] FinancialEntry: ${docs.length} movimientos.`);
  });
};

main().catch((err: unknown) => {
  console.error('[seed] falló:', err instanceof Error ? err.message : err);
  process.exit(1);
});