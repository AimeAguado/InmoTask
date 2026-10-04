import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import { config } from './config.js';

export const connectDb = async (): Promise<typeof mongoose> => {
  mongoose.set('strictQuery', true);

  if (config.mongoDnsServers) {
    setServers(config.mongoDnsServers);
    console.log(`[db] DNS forzado a ${config.mongoDnsServers.join(', ')}`);
  }

  await mongoose.connect(config.mongoUri, {
    // dbName tiene precedencia sobre el path de la URI, así que es esta variable
    // la que decide en qué base se trabaja.
    dbName: config.mongoDb,
    // Atlas a veces tarda varios segundos en responder el primer handshake:
    // sin timeout el proceso queda colgado sin log.
    serverSelectionTimeoutMS: 15_000,
  });

  const { host, name } = mongoose.connection;

  // Verificación post-conexión. Si por lo que sea se cayera a otra base (credenciales
  // que apuntan a otro cluster, un dbName mal interpretado), es preferible abortar
  // antes de escribir los datos de este proyecto en el lugar equivocado.
  if (name !== config.mongoDb) {
    await mongoose.disconnect();
    throw new Error(
      `Se conectó a la base "${name}" pero MONGODB_DB dice "${config.mongoDb}". ` +
        'Revisá las credenciales de la URI y el valor de MONGODB_DB.'
    );
  }

  console.log(`[db] conectado a la base "${name}" (${host})`);

  // La conexión puede ser correcta y aun así apuntar a una base VACÍA: un
  // MONGODB_DB distinto en el deploy, o una URI a otro cluster. El síntoma desde
  // el navegador es "Email o contraseña incorrectos" para todos los usuarios, que
  // no dice nada sobre la causa real; este log la delata en los logs de Vercel.
  const db = mongoose.connection.db;
  if (!db) {
    console.warn(`[db] la conexión a "${name}" no expone una base: no se puede verificar si tiene usuarios.`);
    return mongoose;
  }

  const users = await db.collection('appusers').countDocuments();
  if (users === 0) {
    console.warn(
      `[db] ATENCIÓN: la base "${name}" no tiene usuarios. Si esperás poder entrar, ` +
        'MONGODB_URI o MONGODB_DB apuntan a otra base. Cargá los datos con ' +
        '"npm run seed" contra esa base, o corregí las variables del deploy.'
    );
  } else {
    console.log(`[db] ${users} usuario(s) en la base "${name}"`);
  }

  return mongoose;
};

/**
 * Asegura la conexión sin reconectar en cada request.
 *
 * En Vercel la función corre como serverless: una instancia "warm" atiende varias
 * peticiones seguidas y el proceso vive, pero cada "cold start" arranca de cero.
 * mongoose.connect() por request pagaría un handshake a Atlas en cada llamada y
 * agotaría el pool de conexiones; por eso la promesa se cachea y sólo se crea
 * una vez. Si la conexión se cae, el catch descarta la promesa cacheada para que
 * el próximo request pueda reintentar en vez de reutilizar un estado fallido.
 */
let pendingConnection: Promise<typeof mongoose> | null = null;

export const ensureDb = async (): Promise<typeof mongoose> => {
  if (mongoose.connection.readyState === 1) return mongoose;

  pendingConnection ??= connectDb().catch((err: unknown) => {
    pendingConnection = null;
    throw err;
  });

  return pendingConnection;
};

export const disconnectDb = async (): Promise<void> => {
  pendingConnection = null;
  await mongoose.disconnect();
};