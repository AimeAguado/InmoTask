import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config';
import { errorHandler, notFoundHandler } from './lib/errorHandler';
import { authRouter } from './routes/auth.routes';
import { usersRouter } from './routes/users.routes';
import { propertiesRouter } from './routes/properties.routes';
import { tasksRouter } from './routes/tasks.routes';
import { financialsRouter } from './routes/financials.routes';

export const createApp = (): express.Express => {
  const app = express();

  // Sólo en dev: en producción el mismo origen sirve el front y la API, así que
  // no hay nada que permitir y abrir el CORS sería superficie de ataque.
  if (!config.isProd) {
    app.use(cors({ origin: config.clientOrigin, credentials: true }));
  }

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