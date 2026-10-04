import { setServers } from 'node:dns';
import mongoose from 'mongoose';
import { config } from './config';

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