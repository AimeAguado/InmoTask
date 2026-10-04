import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './lib/errorHandler.js';
import { ensureDb } from './db.js';
import { authRouter } from './routes/auth.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { propertiesRouter } from './routes/properties.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { financialsRouter } from './routes/financials.routes.js';

export const createApp = (): express.Express => {
  const app = express();

  // Va primero y antes de cualquier parser: si la base no está conectada todavía
  // (cold start de Vercel) se espera a que lo esté, en vez de dejar que cada ruta
  // falle por separado. ensureDb() es un no-op cuando ya hay conexión, así que en
  // el servidor local, que conecta antes de listen, no agrega latencia.
  app.use((req, res, next) => {
    ensureDb().then(
      () => next(),
      (err: unknown) => next(err)
    );
  });

  // Sólo en dev: en producción el mismo origen sirve el front y la API, así que
  // no hay nada que permitir y abrir el CORS sería superficie de ataque.
  if (!config.isProd) {
    app.use(cors({ origin: config.clientOrigin, credentials: true }));
  }

  // Las rutas que reciben una foto aceptan un cuerpo más grande. La foto viaja
  // como data URL dentro del JSON, así que una imagen de 2 MB ocupa ~2,7 MB en
  // base64: con el límite global de 256kb el body se rechazaba antes de llegar
  // al validador, y el usuario veía un error genérico en vez de "foto muy
  // grande". Se registra antes que el parser global para que estas rutas ganen;
  // body-parser no vuelve a leer un body ya consumido.
  app.use('/api/auth/me', express.json({ limit: '3mb' }));
  app.use('/api/users', express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '256kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/properties', propertiesRouter);
  app.use('/api/tasks', tasksRouter);
  app.use('/api/financials', financialsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};