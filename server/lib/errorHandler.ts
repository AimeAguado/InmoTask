import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ApiError } from './http.js';
import { config } from '../config.js';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: `Ruta inexistente: ${req.method} ${req.path}` },
  });
};

/**
 * Traduce los errores conocidos de mongoose a respuestas con código y mensaje
 * útil. Cualquier otra cosa se loguea y se responde 500 sin filtrar detalles
 * internos (stack, nombres de colecciones) al cliente.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: {
        code: 'validation_error',
        message: 'Los datos enviados no son válidos.',
        details: Object.fromEntries(
          Object.entries(err.errors).map(([field, e]) => [field, e.message])
        ),
      },
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: { code: 'invalid_id', message: `Identificador inválido: "${err.value}"` },
    });
    return;
  }

  // Índice único violado (por ejemplo, dos usuarios con el mismo email).
  if (typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({
      error: { code: 'duplicate', message: 'Ya existe un registro con ese valor.' },
    });
    return;
  }

  // Body demasiado grande: body-parser aborta el request antes de que llegue a
  // las rutas. Se detecta por estructura porque la clase no es una dependencia
  // directa; sin esto el usuario recibía un 500 confuso en vez de un 413.
  if (typeof err === 'object' && err !== null && (err as { type?: string }).type === 'entity.too.large') {
    res.status(413).json({
      error: { code: 'payload_too_large', message: 'El contenido enviado es demasiado grande.' },
    });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({
    error: {
      code: 'internal_error',
      message: 'Error interno del servidor.',
      ...(config.isProd ? {} : { debug: (err as Error)?.message }),
    },
  });
};