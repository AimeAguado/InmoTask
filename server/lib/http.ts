import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(400, code, message, details);
  }

  static unauthorized(code = 'unauthorized', message = 'Sesión inválida o vencida.'): ApiError {
    return new ApiError(401, code, message);
  }

  static forbidden(message = 'No tenés permisos para esta operación.'): ApiError {
    return new ApiError(403, 'forbidden', message);
  }

  static notFound(message = 'Recurso no encontrado.'): ApiError {
    return new ApiError(404, 'not_found', message);
  }

  static conflict(code: string, message: string): ApiError {
    return new ApiError(409, code, message);
  }

  /** 503: el servidor no está en condiciones de atender (falta de configuración). */
  static serviceUnavailable(code = 'service-unavailable', message = 'El servicio no está disponible.'): ApiError {
    return new ApiError(503, code, message);
  }
}

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * Express 4 no captura rechazos de promesas: sin este wrapper, un await que
 * falla dentro de un handler async se convierte en un request colgado y el error
 * nunca llega al errorHandler.
 */
export const asyncHandler =
  (handler: AsyncRequestHandler): RequestHandler =>
  (req, res, next) => {
    void handler(req, res, next).catch(next);
  };