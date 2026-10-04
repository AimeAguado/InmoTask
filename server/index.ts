import { createApp } from './app';
import { config } from './config';
import { connectDb, disconnectDb } from './db';

const main = async (): Promise<void> => {
  await connectDb();

  const server = createApp().listen(config.port, () => {
    console.log(`[api] escuchando en http://localhost:${config.port} (${config.isProd ? 'prod' : 'dev'})`);
  });

  const shutdown = (signal: string): void => {
    console.log(`\n[api] ${signal} recibido, cerrando...`);
    server.close(() => {
      void disconnectDb().then(() => process.exit(0));
    });
    // Si una conexión se queda colgada, no esperar indefinidamente.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

main().catch((err: unknown) => {
  console.error('[api] no se pudo arrancar:', err instanceof Error ? err.message : err);
  process.exit(1);
});