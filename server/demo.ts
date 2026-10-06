/**
 * Crea la base de datos demo para que cualquiera pueda probar la app.
 *
 *   npm run seed:demo
 *
 * Genera la inmobiliaria demo, sus dos usuarios (admin y asesor) y, si la
 * inmobiliaria aún no tiene propiedades, las mismas fichas ficticias del seed.
 * Es idempotente: correrlo dos veces no duplica ni pisa datos ajenos; sí
 * restaura las credenciales y reactiva los usuarios demo.
 *
 * Las credenciales son públicas (se muestran en el login) y viven en
 * src/data/demo.ts. A diferencia del seed real, acá SÍ se crean cuentas a
 * propósito: es el único caso donde una credencial conocida está en el sistema.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './db.js';
import { config } from './config.js';
import { PropertyModel } from './models/Property.js';
import { TaskModel } from './models/Task.js';
import { InmobiliariaModel } from './models/Inmobiliaria.js';
import { AppUserModel } from './models/AppUser.js';
import { INITIAL_PROPERTIES, INITIAL_TASKS } from '../src/data/mockData.js';
import { DEMO } from '../src/data/demo.js';

const PROJECT_DB = 'inmotask';
const SALT_ROUNDS = 12;
const SKIP_CHECK = process.argv.includes('--skip-check');

const ymd = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

/** Esta base es PROPIA del proyecto: el demo (como el seed) no escribe otra. */
const guard = (): void => {
  if (!SKIP_CHECK && config.mongoDb !== PROJECT_DB) {
    throw new Error(
      `El demo sólo puede correr contra la base "${PROJECT_DB}" y MONGODB_DB dice ` +
        `"${config.mongoDb}". Usá --skip-check si estás seguro.`
    );
  }
};

const main = async (): Promise<void> => {
  guard();
  await connectDb();

  // La inmobiliaria demo es un tenant aislado: no pisa los datos de ninguna
  // empresa real ni choca con sus códigos de propiedad (únicos por inmobiliaria).
  const inmobiliaria = await InmobiliariaModel.findOneAndUpdate(
    { name: DEMO.inmobiliaria },
    {
      $setOnInsert: {
        name: DEMO.inmobiliaria,
        legalName: 'InmoTask Demo S.R.L.',
        phone: '+54 11 0000-0000',
        email: 'demo@inmotask.com',
        active: true,
      },
    },
    { upsert: true, new: true }
  );
  const inmoviliariaId = String(inmobiliaria._id);

  const accounts = [
    { role: 'admin' as const, ...DEMO.admin },
    { role: 'asesor' as const, ...DEMO.asesor },
  ];

  for (const account of accounts) {
    await AppUserModel.findOneAndUpdate(
      { email: account.email },
      {
        $set: {
          firstName: account.firstName,
          lastName: account.lastName,
          name: `${account.firstName} ${account.lastName}`.trim(),
          role: account.role,
          inmoviliariaId: inmobiliaria._id,
          active: true,
          // Se restaura la contraseña en cada corrida: si el usuario demo ya
          // existía con otra clave, queda de nuevo como la anunciada en el login.
          passwordHash: await bcrypt.hash(account.password, SALT_ROUNDS),
        },
        $setOnInsert: {
          email: account.email,
          phone: '',
          license: '',
          avatar: '',
        },
      },
      { upsert: true }
    );
    console.log(`[seed:demo] ${account.role}: ${account.email} / ${account.password}`);
  }

  await seedPortfolio(inmoviliariaId);

  console.log('');
  console.log('[seed:demo] listo.');
  console.log(
    `[seed:demo] Entrá en el login con ${DEMO.admin.email} (admin) o ${DEMO.asesor.email} (asesor).`
  );
  await disconnectDb();
};

const seedPortfolio = async (inmoviliariaId: string): Promise<void> => {
  const existing = await PropertyModel.countDocuments({ inmoviliariaId });
  if (existing > 0) {
    console.log(`[seed:demo] ya tiene ${existing} inmuebles, se mantienen.`);
    return;
  }

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

  const propertyIdMap = new Map<string, mongoose.Types.ObjectId>();
  INITIAL_PROPERTIES.forEach((p, i) => propertyIdMap.set(p.id, docs[i]._id));

  await TaskModel.insertMany(
    INITIAL_TASKS.map((t) => ({
      title: t.title,
      description: t.description ?? '',
      category: t.category,
      priority: t.priority,
      status: t.status,
      inmoviliariaId,
      dueDate: ymd(t.dueDate),
      dueTime: t.dueTime ?? '',
      property: (t.propertyId && propertyIdMap.get(t.propertyId)) || null,
      propertyTitle: t.propertyTitle ?? '',
      assignedByDirector: t.assignedByDirector ?? false,
      assignedTo: t.assignedTo,
      completedAt: t.completedAt ? new Date(t.completedAt) : null,
    }))
  );

  console.log(`[seed:demo] ${docs.length} inmuebles y ${INITIAL_TASKS.length} tareas ficticias.`);
};

main().catch((err: unknown) => {
  console.error('[seed:demo] falló:', err instanceof Error ? err.message : err);
  process.exit(1);
});