import 'dotenv/config';

const required = (key: string): string => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${key}. Copiá .env.example a .env y completala antes de arrancar.`
    );
  }
  return value.trim();
};

const isProd = process.env.NODE_ENV === 'production';

// En desarrollo se tolera un secret fijo para no bloquear el arranque, pero en
// producción tiene que venir del entorno: una clave conocida y pública permite
// firmar sesiones ajenas y saltear el login.
const DEV_JWT_SECRET = 'inmotask-dev-secret-no-usar-en-produccion';

/** Caracteres que Mongo prohíbe en un nombre de base. */
const INVALID_DB_NAME = /[\\/. "$*<>:|?\0]/;

/**
 * MONGODB_DB es obligatoria a propósito.
 *
 * Si faltara, mongoose usaría la base del path de la URI, y una URI de Atlas
 * conectada sin base (mongodb+srv://.../ ) resuelve a "test": este proyecto
 * escribiría sus datos en una base compartida. Exigirla hace que el destino se
 * decida de forma explícita y no por defaults.
 */
const requiredDbName = (): string => {
  const name = required('MONGODB_DB');

  if (INVALID_DB_NAME.test(name)) {
    throw new Error(
      `MONGODB_DB="${name}" contiene caracteres no permitidos en un nombre de base de Mongo.`
    );
  }

  return name;
};

/**
 * Resolvers DNS opcionales, separados por coma, para el lookup SRV de Atlas.
 *
 * c-ares (el resolver de Node) y el cliente DNS del sistema no siempre coinciden:
 * con el DNS del router por defecto, dns.resolveSrv() devuelve ECONNREFUSED
 * aunque nslookup resuelva la misma consulta bien, y la API no arranca sin poder
 * descubrir los hosts del cluster. Apuntar a un resolver público lo arregla.
 * Sin esta variable se usa el DNS del sistema, que es el comportamiento normal.
 */
const optionalDnsServers = (value: string | undefined): string[] | undefined => {
  const servers = value
    ?.split(',')
    .map((server) => server.trim())
    .filter((server) => server !== '');
  return servers?.length ? servers : undefined;
};

export const config = {
  isProd,
  port: Number.parseInt(process.env.PORT ?? '4000', 10),
  mongoUri: required('MONGODB_URI'),
  mongoDb: requiredDbName(),
  mongoDnsServers: optionalDnsServers(process.env.MONGODB_DNS_SERVERS),
  jwtSecret: isProd
    ? required('JWT_SECRET')
    : process.env.JWT_SECRET?.trim() || DEV_JWT_SECRET,
  clientOrigin: process.env.CLIENT_ORIGIN?.trim() || 'http://localhost:3000',
};