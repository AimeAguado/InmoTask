import { createApp } from '../server/app';
import { config } from '../server/config';

/**
 * Entry point de la API como serverless function de Vercel.
 *
 * Vercel detecta que este archivo exporta una app de Express y lo monta como
 * handler Node: todo lo que llega a /api/* entra por acá. El front (build de
 * Vite, outputDirectory "dist") lo sirve el mismo dominio, así que la cookie de
 * sesión es first-party y no hace falta CORS ni dominio cruzado.
 *
 * No se llama a app.listen() porque en serverless no hay un puerto que escuchar:
 * quien abre y cierra el socket es la plataforma. La conexión a Mongo la abre
 * ensureDb() (dentro de createApp) la primera vez que llega una petición.
 *
 * Un cold start nuevo reconecta a Atlas; una instancia warm reutiliza la
 * conexión. Ver ensureDb() en server/db.ts.
 */
const app = createApp();

console.log(`[api] serverless listo (${config.isProd ? 'prod' : 'dev'})`);

export default app;
